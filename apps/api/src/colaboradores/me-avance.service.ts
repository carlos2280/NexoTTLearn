import { Injectable, NotFoundException } from "@nestjs/common"
import type {
  ClaseColorSkill,
  EtiquetaCualitativa,
  MeAvanceCursoResponse,
  MeAvancePorSkill,
  MeAvanceSiguienteSeccion,
} from "@nexott-learn/shared-types"
import { apiErrorCodes } from "../common/errors/api-error.codes"
import { PrismaService } from "../common/prisma/prisma.service"
import { PlanPersonalService } from "../plan-personal/plan-personal.service"

/**
 * Fallback de `umbralNoCumple` (cap. 9.1) cuando el curso no lo define
 * explicitamente. Mismo default que usa `Curso.umbralNoCumple` por convencion.
 * El color de cada skill exigida se calcula contra su `notaMinima` y este
 * umbral, no contra constantes globales (lo que antes confundia: una nota
 * MUY por debajo del minimo del curso aparecia "amarilla" porque el umbral
 * global era 50, no el del curso).
 */
const UMBRAL_NO_CUMPLE_FALLBACK = 10

const UMBRAL_EXCELENCIA_FINAL = 85
const UMBRAL_SOLIDO_FINAL = 70
const UMBRAL_DESARROLLO_FINAL = 50

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
    const porcentajeAvance = await this.planPersonalService.obtenerPorcentajeAvance(asignacion.id)

    const seccionesObligatorias = await this.contarSeccionesObligatorias(asignacion.id)
    const seccionesCompletadas = await this.contarSeccionesCompletadas(asignacion.id)
    const porSkill = await this.calcularPorSkill(cursoId, colaboradorId)
    const siguienteSeccion = await this.calcularSiguienteSeccion(asignacion.id)

    const base: MeAvanceCursoResponse = {
      cursoId,
      estaCerrado,
      porcentajeAvance,
      seccionesCompletadas,
      seccionesObligatorias,
      porSkill,
      siguienteSeccion,
    }

    if (!estaCerrado) {
      return base
    }
    const fotografia = await this.prisma.cursoFotografiaCierre.findUnique({
      where: { cursoId },
      select: { snapshot: true, descartada: true },
    })
    const final = extraerNotaFinal(
      fotografia?.snapshot ?? null,
      fotografia?.descartada ?? true,
      asignacion.id,
    )
    if (final === null) {
      return base
    }
    return {
      ...base,
      notaGlobalFinal: final.notaGlobalFinal,
      etiquetaCualitativaFinal: final.etiquetaCualitativaFinal,
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

  private contarSeccionesCompletadas(asignacionId: string): Promise<number> {
    return this.prisma.aperturaSeccion.count({ where: { asignacionId } })
  }

  private async calcularPorSkill(
    cursoId: string,
    colaboradorId: string,
  ): Promise<readonly MeAvancePorSkill[]> {
    const [curso, exigidas] = await Promise.all([
      this.prisma.curso.findUnique({
        where: { id: cursoId },
        select: { umbralNoCumple: true },
      }),
      this.prisma.cursoSkillExigida.findMany({
        where: { cursoId },
        select: {
          skillId: true,
          notaMinima: true,
          skill: { select: { id: true, etiquetaVisible: true } },
        },
      }),
    ])
    if (exigidas.length === 0) {
      return []
    }
    const umbralNoCumple = curso?.umbralNoCumple
      ? Number(curso.umbralNoCumple.toString())
      : UMBRAL_NO_CUMPLE_FALLBACK
    const notas = await this.prisma.notaSkill.findMany({
      where: {
        colaboradorId,
        skillId: { in: exigidas.map((e) => e.skillId) },
      },
      select: { skillId: true, notaActual: true },
    })
    return exigidas.map((exigida) => {
      const nota = notas.find((n) => n.skillId === exigida.skillId)
      const notaActual =
        nota?.notaActual === null || nota?.notaActual === undefined ? null : Number(nota.notaActual)
      const notaMinima = Number(exigida.notaMinima.toString())
      return {
        skillId: exigida.skillId,
        etiqueta: exigida.skill.etiquetaVisible,
        notaActual,
        claseColor: claseColorPorNota(notaActual, notaMinima, umbralNoCumple),
      }
    })
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

interface SnapshotConAsignaciones {
  readonly asignaciones: ReadonlyArray<{
    readonly asignacionId: string
    readonly notaGlobalFinal?: number
  }>
}

function esSnapshotConAsignaciones(value: unknown): value is SnapshotConAsignaciones {
  if (value === null || typeof value !== "object") {
    return false
  }
  const asigs = (value as Record<string, unknown>).asignaciones
  return Array.isArray(asigs)
}

function extraerNotaFinal(
  snapshot: unknown,
  descartada: boolean,
  asignacionId: string,
): { notaGlobalFinal: number; etiquetaCualitativaFinal: EtiquetaCualitativa } | null {
  if (descartada || !esSnapshotConAsignaciones(snapshot)) {
    return null
  }
  const fila = snapshot.asignaciones.find((a) => a.asignacionId === asignacionId)
  if (!fila || typeof fila.notaGlobalFinal !== "number") {
    return null
  }
  return {
    notaGlobalFinal: fila.notaGlobalFinal,
    etiquetaCualitativaFinal: etiquetaCualitativaPorNota(fila.notaGlobalFinal),
  }
}

function etiquetaCualitativaPorNota(nota: number): EtiquetaCualitativa {
  if (nota >= UMBRAL_EXCELENCIA_FINAL) {
    return "excelencia"
  }
  if (nota >= UMBRAL_SOLIDO_FINAL) {
    return "solido"
  }
  if (nota >= UMBRAL_DESARROLLO_FINAL) {
    return "enDesarrollo"
  }
  return "noCumple"
}
