import { Injectable, NotFoundException } from "@nestjs/common"
import type {
  CaminoHaciaApto,
  CaminoHaciaAptoPorArea,
  ClaseColorSkill,
  EtiquetaCualitativa,
  MeAvanceCursoResponse,
  MeAvancePorSkill,
  MeAvanceSiguienteSeccion,
  NivelCaminoHaciaAptoArea,
} from "@nexott-learn/shared-types"
import { RolAsignacion } from "@prisma/client"
import { apiErrorCodes } from "../common/errors/api-error.codes"
import { PrismaService } from "../common/prisma/prisma.service"
import { PlanPersonalService } from "../plan-personal/plan-personal.service"
import {
  etiquetaCualitativaPorNota,
  parseCierreSnapshotMinimo,
  resolverNotaGlobalFinal,
} from "./cierre-snapshot.helpers"

/**
 * Fallback de `umbralNoCumple` (cap. 9.1) cuando el curso no lo define
 * explicitamente. Mismo default que usa `Curso.umbralNoCumple` por convencion.
 * El color de cada skill exigida se calcula contra su `notaMinima` y este
 * umbral, no contra constantes globales (lo que antes confundia: una nota
 * MUY por debajo del minimo del curso aparecia "amarilla" porque el umbral
 * global era 50, no el del curso).
 */
const UMBRAL_NO_CUMPLE_FALLBACK = 10

/**
 * `MeAvanceService` — D-S11-C8, cap. 10.7.
 *
 * Calcula la respuesta de `/me/avance/cursos/:cursoId` para el colaborador en
 * sesion. La visibilidad respeta cap. 10.7: pre-cierre el participante NO ve
 * `notaGlobalFinal` ni `etiquetaCualitativaFinal`. Esos campos solo aparecen
 * cuando el `Curso.estado === CERRADO` (flag `estaCerrado=true`).
 *
 * Reutiliza `PlanPersonalService.obtenerPorcentajeAvance` (FIX-P11b-avance)
 * para el porcentaje canonico — NO duplica la regla de seccion completada.
 */
@Injectable()
export class MeAvanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly planPersonalService: PlanPersonalService,
  ) {}

  async obtenerAvanceDeUsuario(usuarioId: string, cursoId: string): Promise<MeAvanceCursoResponse> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { colaboradorId: true },
    })
    if (!usuario?.colaboradorId) {
      throw new NotFoundException({
        code: apiErrorCodes.colaboradorNoEncontrado,
        message: "Colaborador no encontrado.",
      })
    }
    return this.obtenerAvance(usuario.colaboradorId, cursoId)
  }

  async obtenerAvance(colaboradorId: string, cursoId: string): Promise<MeAvanceCursoResponse> {
    const asignacion = await this.prisma.asignacionCurso.findUnique({
      where: {
        // biome-ignore lint/style/useNamingConvention: clave compuesta generada por Prisma.
        colaboradorId_cursoId: { colaboradorId, cursoId },
      },
      select: {
        id: true,
        rol: true,
        curso: { select: { id: true, estado: true } },
      },
    })
    if (!asignacion) {
      throw new NotFoundException({
        code: apiErrorCodes.asignacionNoEncontrada,
        message: "Asignacion no encontrada para este curso y colaborador.",
      })
    }

    const estaCerrado = asignacion.curso.estado === "CERRADO"
    const esVoluntario = asignacion.rol === RolAsignacion.VOLUNTARIO

    const seccionesAbiertasIds = await this.cargarSeccionesAbiertasIds(asignacion.id)
    const seccionesCompletadas = seccionesAbiertasIds.length

    // VOLUNTARIO (D-AS-1): no hay PlanEstudio. El denominador es el total de
    // secciones del curso (catalogo) y el siguiente paso es la primera no
    // abierta. Esto da feedback de progreso honesto sin generar plan artificial.
    let seccionesObligatorias: number
    let porcentajeAvance: number
    let siguienteSeccion: MeAvanceSiguienteSeccion | null
    if (esVoluntario) {
      seccionesObligatorias = await this.contarSeccionesTotalesCurso(cursoId)
      porcentajeAvance =
        seccionesObligatorias === 0
          ? 0
          : Math.min(100, Math.round((seccionesCompletadas / seccionesObligatorias) * 100))
      siguienteSeccion = await this.calcularSiguienteSeccionVoluntario(
        cursoId,
        seccionesAbiertasIds,
      )
    } else {
      seccionesObligatorias = await this.contarSeccionesObligatorias(asignacion.id)
      porcentajeAvance = await this.planPersonalService.obtenerPorcentajeAvance(asignacion.id)
      siguienteSeccion = await this.calcularSiguienteSeccion(asignacion.id)
    }

    const exigidas = await this.cargarSkillsExigidasConArea(cursoId)
    const notas = await this.cargarNotasColaborador(
      colaboradorId,
      exigidas.map((e) => e.skillId),
    )
    const umbralNoCumple = await this.obtenerUmbralNoCumple(cursoId)
    const porSkill = construirPorSkill(exigidas, notas, umbralNoCumple)
    const caminoHaciaApto = construirCaminoHaciaApto(exigidas, notas)

    const base: MeAvanceCursoResponse = {
      cursoId,
      estaCerrado,
      porcentajeAvance,
      seccionesCompletadas,
      seccionesObligatorias,
      porSkill,
      siguienteSeccion,
      caminoHaciaApto,
      seccionesAbiertasIds,
    }

    if (!estaCerrado) {
      return base
    }
    const fotografia = await this.prisma.cursoFotografiaCierre.findUnique({
      where: { cursoId },
      select: { snapshot: true, descartada: true },
    })
    const notaFinal = extraerNotaFinal(
      fotografia?.snapshot ?? null,
      fotografia?.descartada ?? true,
      asignacion.id,
    )
    if (notaFinal === null) {
      return base
    }
    return {
      ...base,
      notaGlobalFinal: notaFinal.notaGlobalFinal,
      etiquetaCualitativaFinal: notaFinal.etiquetaCualitativaFinal,
    }
  }

  private async contarSeccionesObligatorias(asignacionId: string): Promise<number> {
    const plan = await this.prisma.planEstudio.findUnique({
      where: { asignacionId },
      select: { id: true },
    })
    if (!plan) {
      return 0
    }
    return this.prisma.itemPlan.count({
      where: { planId: plan.id, caracter: "OBLIGATORIA" },
    })
  }

  private async cargarSeccionesAbiertasIds(asignacionId: string): Promise<readonly string[]> {
    const aperturas = await this.prisma.aperturaSeccion.findMany({
      where: { asignacionId },
      select: { seccionId: true },
    })
    return aperturas.map((a) => a.seccionId)
  }

  /**
   * Total de secciones del curso (todos los modulos habilitados) usado como
   * denominador del avance del VOLUNTARIO (D-AS-1: voluntarios no tienen
   * PlanEstudio, el avance se calcula sobre el catalogo completo). La
   * habilitacion de un modulo en un curso vive en `CursoModuloHabilitado`.
   */
  private contarSeccionesTotalesCurso(cursoId: string): Promise<number> {
    return this.prisma.seccion.count({
      where: { modulo: { cursosModulosHabilitados: { some: { cursoId } } } },
    })
  }

  /**
   * Para voluntarios: primera seccion del catalogo que el colaborador aun no
   * ha abierto. Orden: alfabetico por titulo de modulo + `Seccion.orden`
   * (mismo criterio que `calcularSiguienteSeccion` para asignados, porque
   * `Modulo` no tiene campo `orden` propio dentro del curso).
   */
  private async calcularSiguienteSeccionVoluntario(
    cursoId: string,
    seccionesAbiertasIds: readonly string[],
  ): Promise<MeAvanceSiguienteSeccion | null> {
    const aperturasSet = new Set(seccionesAbiertasIds)
    const secciones = await this.prisma.seccion.findMany({
      where: { modulo: { cursosModulosHabilitados: { some: { cursoId } } } },
      select: {
        id: true,
        titulo: true,
        orden: true,
        moduloId: true,
        modulo: { select: { titulo: true } },
      },
    })
    const pendiente = [...secciones]
      .filter((s) => !aperturasSet.has(s.id))
      .sort((a, b) => {
        if (a.modulo.titulo !== b.modulo.titulo) {
          return a.modulo.titulo.localeCompare(b.modulo.titulo)
        }
        return a.orden - b.orden
      })[0]
    if (!pendiente) {
      return null
    }
    return {
      seccionId: pendiente.id,
      moduloId: pendiente.moduloId,
      titulo: pendiente.titulo,
    }
  }

  private cargarSkillsExigidasConArea(cursoId: string): Promise<readonly SkillExigidaConArea[]> {
    return this.prisma.cursoSkillExigida.findMany({
      where: { cursoId },
      select: {
        skillId: true,
        notaMinima: true,
        skill: {
          select: {
            id: true,
            etiquetaVisible: true,
            area: { select: { id: true, codigo: true, nombre: true } },
          },
        },
      },
    })
  }

  private cargarNotasColaborador(
    colaboradorId: string,
    skillIds: readonly string[],
  ): Promise<readonly NotaSkillRaw[]> {
    if (skillIds.length === 0) {
      return Promise.resolve([])
    }
    return this.prisma.notaSkill.findMany({
      where: { colaboradorId, skillId: { in: [...skillIds] } },
      select: { skillId: true, notaActual: true },
    })
  }

  private async obtenerUmbralNoCumple(cursoId: string): Promise<number> {
    const curso = await this.prisma.curso.findUnique({
      where: { id: cursoId },
      select: { umbralNoCumple: true },
    })
    return curso?.umbralNoCumple
      ? Number(curso.umbralNoCumple.toString())
      : UMBRAL_NO_CUMPLE_FALLBACK
  }

  private async calcularSiguienteSeccion(
    asignacionId: string,
  ): Promise<MeAvanceSiguienteSeccion | null> {
    const plan = await this.prisma.planEstudio.findUnique({
      where: { asignacionId },
      select: { id: true },
    })
    if (!plan) {
      return null
    }
    const items = await this.prisma.itemPlan.findMany({
      where: { planId: plan.id, caracter: "OBLIGATORIA" },
      select: {
        seccionId: true,
        moduloId: true,
        seccion: { select: { id: true, titulo: true, orden: true } },
        modulo: { select: { titulo: true } },
      },
    })
    if (items.length === 0) {
      return null
    }

    const aperturas = await this.prisma.aperturaSeccion.findMany({
      where: { asignacionId },
      select: { seccionId: true },
    })
    const aperturasSet = new Set(aperturas.map((a) => a.seccionId))

    const pendiente = [...items]
      .filter((i) => !aperturasSet.has(i.seccionId))
      .sort((a, b) => {
        if (a.modulo.titulo === b.modulo.titulo) {
          return a.seccion.orden - b.seccion.orden
        }
        return a.modulo.titulo.localeCompare(b.modulo.titulo)
      })[0]

    if (!pendiente) {
      return null
    }
    return {
      seccionId: pendiente.seccion.id,
      moduloId: pendiente.moduloId,
      titulo: pendiente.seccion.titulo,
    }
  }
}

interface SkillExigidaConArea {
  readonly skillId: string
  readonly notaMinima: { toString(): string }
  readonly skill: {
    readonly id: string
    readonly etiquetaVisible: string
    readonly area: { readonly id: string; readonly codigo: string; readonly nombre: string }
  }
}

interface NotaSkillRaw {
  readonly skillId: string
  readonly notaActual: { toString(): string } | null
}

function notaActualNumero(nota: NotaSkillRaw | undefined): number | null {
  if (!nota || nota.notaActual === null || nota.notaActual === undefined) {
    return null
  }
  return Number(nota.notaActual.toString())
}

function construirPorSkill(
  exigidas: readonly SkillExigidaConArea[],
  notas: readonly NotaSkillRaw[],
  umbralNoCumple: number,
): readonly MeAvancePorSkill[] {
  if (exigidas.length === 0) {
    return []
  }
  const notasPorSkill = new Map(notas.map((n) => [n.skillId, n]))
  return exigidas.map((exigida) => {
    const notaActual = notaActualNumero(notasPorSkill.get(exigida.skillId))
    const notaMinima = Number(exigida.notaMinima.toString())
    return {
      skillId: exigida.skillId,
      etiqueta: exigida.skill.etiquetaVisible,
      notaActual,
      claseColor: claseColorPorNota(notaActual, notaMinima, umbralNoCumple),
    }
  })
}

/**
 * Construye el agregado `caminoHaciaApto` por area (B-4, decision 03-R2).
 *
 * Una skill se considera DEMOSTRADA cuando `notaActual >= notaMinima` definida
 * en `CursoSkillExigida` — misma semantica que el chip "verde" de
 * `MeAvancePorSkill`. Las areas se ordenan alfabeticamente por `areaNombre`
 * (determinista; el frontend no impone orden).
 */
function construirCaminoHaciaApto(
  exigidas: readonly SkillExigidaConArea[],
  notas: readonly NotaSkillRaw[],
): CaminoHaciaApto {
  // Un curso sin `CursoSkillExigida` (seed incompleto, o catalogo en
  // construccion) NO esta "listo": el camino simplemente no se puede calcular.
  // Devolvemos `catalogoIncompleto: true` para que el frontend muestre un
  // mensaje neutro en vez del falso "Has demostrado todas las capacidades".
  if (exigidas.length === 0) {
    return { faltantesParaApto: 0, estaListo: false, porArea: [], catalogoIncompleto: true }
  }
  const notasPorSkill = new Map(notas.map((n) => [n.skillId, n]))
  interface Acumulador {
    areaId: string
    areaCodigo: string
    areaNombre: string
    exigidas: number
    demostradas: number
  }
  const porArea = new Map<string, Acumulador>()
  for (const exigida of exigidas) {
    const area = exigida.skill.area
    const entry = porArea.get(area.id) ?? {
      areaId: area.id,
      areaCodigo: area.codigo,
      areaNombre: area.nombre,
      exigidas: 0,
      demostradas: 0,
    }
    entry.exigidas += 1
    const notaActual = notaActualNumero(notasPorSkill.get(exigida.skillId))
    const notaMinima = Number(exigida.notaMinima.toString())
    if (notaActual !== null && notaActual >= notaMinima) {
      entry.demostradas += 1
    }
    porArea.set(area.id, entry)
  }
  const items: CaminoHaciaAptoPorArea[] = [...porArea.values()]
    .sort((a, b) => a.areaNombre.localeCompare(b.areaNombre))
    .map((acc) => ({
      areaId: acc.areaId,
      areaCodigo: acc.areaCodigo,
      areaNombre: acc.areaNombre,
      skillsExigidas: acc.exigidas,
      skillsDemostradas: acc.demostradas,
      nivelCualitativo: nivelCualitativoArea(acc.demostradas, acc.exigidas),
    }))
  const faltantesParaApto = items.reduce(
    (acc, item) => acc + (item.skillsExigidas - item.skillsDemostradas),
    0,
  )
  return {
    faltantesParaApto,
    estaListo: faltantesParaApto === 0,
    porArea: items,
  }
}

function nivelCualitativoArea(demostradas: number, exigidas: number): NivelCaminoHaciaAptoArea {
  if (demostradas >= exigidas) {
    return "solido"
  }
  if (demostradas === 0) {
    return "porExplorar"
  }
  return "enDesarrollo"
}

/**
 * Color del chip de skill exigida segun la nota actual vs la exigencia del
 * curso (cap. 9.1):
 *  - VERDE: nota >= notaMinima (cumple la exigencia).
 *  - AMARILLO: notaMinima - umbralNoCumple <= nota < notaMinima (cerca).
 *  - ROJO: nota === null o nota < notaMinima - umbralNoCumple (sin evidencia
 *    o lejos del minimo).
 *
 * Reemplaza un calculo antiguo con constantes globales (50/70) que no
 * consideraba la `notaMinima` del curso. Esto producia inconsistencias como
 * "nota 59 sobre minimo 70 aparecia amarilla" (un colaborador 11 puntos por
 * debajo del minimo no esta "cerca").
 */
function claseColorPorNota(
  nota: number | null,
  notaMinima: number,
  umbralNoCumple: number,
): ClaseColorSkill {
  if (nota === null) {
    return "rojo"
  }
  if (nota >= notaMinima) {
    return "verde"
  }
  if (nota >= notaMinima - umbralNoCumple) {
    return "amarillo"
  }
  return "rojo"
}

/**
 * Extrae `notaGlobalFinal` y `etiquetaCualitativaFinal` del snapshot del
 * cierre. Usa `parseCierreSnapshotMinimo` (Zod) para validar la forma y
 * delega en `resolverNotaGlobalFinal` (helper compartido) para que la regla
 * sea identica a la de `/me/cursos/:id/resumen-cierre`: prefiere la nota
 * persistida, cae a promedio de obligatorias para snapshots legacy
 * (BUG-QA-2). Devuelve `null` cuando no hay nota inferible, asi el response
 * omite ambos campos en lugar de mentir con un 0.
 */
function extraerNotaFinal(
  snapshot: unknown,
  descartada: boolean,
  asignacionId: string,
): { notaGlobalFinal: number; etiquetaCualitativaFinal: EtiquetaCualitativa } | null {
  if (descartada) {
    return null
  }
  const parsed = parseCierreSnapshotMinimo(snapshot)
  if (!parsed) {
    return null
  }
  const fila = parsed.asignaciones.find((a) => a.asignacionId === asignacionId)
  if (!fila) {
    return null
  }
  const nota = resolverNotaGlobalFinal(fila)
  if (nota === null) {
    return null
  }
  return {
    notaGlobalFinal: nota,
    etiquetaCualitativaFinal: etiquetaCualitativaPorNota(nota),
  }
}
