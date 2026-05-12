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

const UMBRAL_COLOR_VERDE = 70
const UMBRAL_COLOR_AMARILLO = 50

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
    const exigidas = await this.prisma.cursoSkillExigida.findMany({
      where: { cursoId },
      select: {
        skillId: true,
        skill: { select: { id: true, etiquetaVisible: true } },
      },
    })
    if (exigidas.length === 0) {
      return []
    }
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
      return {
        skillId: exigida.skillId,
        etiqueta: exigida.skill.etiquetaVisible,
        notaActual,
        claseColor: claseColorPorNota(notaActual),
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

function claseColorPorNota(nota: number | null): ClaseColorSkill {
  if (nota === null || nota < UMBRAL_COLOR_AMARILLO) {
    return "rojo"
  }
  if (nota < UMBRAL_COLOR_VERDE) {
    return "amarillo"
  }
  return "verde"
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
