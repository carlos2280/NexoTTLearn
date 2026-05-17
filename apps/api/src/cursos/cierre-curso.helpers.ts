import { ConflictException, NotFoundException, UnprocessableEntityException } from "@nestjs/common"
import { EstadoCurso, Prisma, RolAsignacion } from "@prisma/client"
import { apiErrorCodes } from "../common/errors/api-error.codes"
import { PrismaService } from "../common/prisma/prisma.service"
import {
  type AccionCierre,
  type NotaSkillSnapshot,
  type ResultadoFinal,
  calcularResultadoFinal,
} from "./calcular-resultado-final"

/**
 * Alias coherente con el resto del proyecto (`plan-personal.service.ts`,
 * `nota-skill.service.ts`): permite ejecutar tanto bajo `$transaction` como
 * directamente con `PrismaService` cuando el caller lo requiera.
 */
export type PrismaTx = Prisma.TransactionClient | PrismaService

/**
 * Fila proyectada que `cerrarCurso` lee y pasa al pipeline de decisiones.
 * Los campos de estado vienen como string para evitar acoplar el helper a
 * los enums concretos de la BD (Prisma los emite como string en `findMany`).
 */
export interface AsignacionCierreRow {
  readonly id: string
  readonly rol: RolAsignacion
  readonly estadoAsignado: string | null
  readonly estadoVoluntario: string | null
  readonly colaboradorId: string
  readonly colaborador: {
    readonly id: string
    readonly nombre: string
    readonly email: string
  }
}

/**
 * Snapshot inmutable del curso usado durante el cierre. Es lo que se persiste
 * en `CursoFotografiaCierre.snapshot` y lo que alimenta `calcularResultadoFinal`.
 */
export interface CursoSnapshotCierre {
  readonly id: string
  readonly titulo: string
  readonly clienteId: string
  readonly estado: EstadoCurso
  readonly fechaInicio: Date
  readonly fechaDeadline: Date
  readonly umbralesLogro: Prisma.JsonValue | null
  readonly pesoBloques: Prisma.Decimal
  readonly pesoTransversal: Prisma.Decimal
  readonly pesoEntrevista: Prisma.Decimal
  readonly transversalId: string | null
  readonly entrevistaIaId: string | null
  readonly areasExigidas: readonly {
    readonly areaId: string
    readonly peso: Prisma.Decimal
    readonly puntajeObjetivo: Prisma.Decimal
  }[]
  readonly skillsExigidas: readonly {
    readonly skillId: string
    readonly notaMinima: Prisma.Decimal
    readonly skill: { readonly etiquetaVisible: string }
  }[]
  readonly modulosHabilitados: readonly { readonly moduloId: string }[]
}

export interface DecisionAplicada {
  readonly asignacionId: string
  readonly accion: AccionCierre
  readonly resultadoFinal: ResultadoFinal | null
  readonly notas: readonly NotaSkillSnapshot[]
}

/**
 * Estado mínimo necesario para revertir una asignación durante el undo del
 * cierre. Se construye desde `HistoricoEstadoAsignacion` + la asignación
 * referenciada por el log.
 */
export interface AsignacionParaRevertir {
  readonly id: string
  readonly rol: RolAsignacion
  readonly estadoAnterior: string
}

export function esEnProgreso(asignacion: AsignacionCierreRow): boolean {
  if (asignacion.rol === RolAsignacion.ASIGNADO) {
    return asignacion.estadoAsignado === "EN_PROGRESO"
  }
  return asignacion.estadoVoluntario === "EN_PROGRESO"
}

export function literalEstadoAsignacion(asignacion: AsignacionCierreRow): string {
  if (asignacion.rol === RolAsignacion.ASIGNADO) {
    return asignacion.estadoAsignado ?? "DESCONOCIDO"
  }
  return asignacion.estadoVoluntario ?? "DESCONOCIDO"
}

export function mapearNotasSkillSnapshot(
  cursoSnapshot: CursoSnapshotCierre,
  notas: ReadonlyMap<string, number | null>,
): readonly NotaSkillSnapshot[] {
  return cursoSnapshot.skillsExigidas.map((s) => ({
    skillId: s.skillId,
    // D-S11-A6: las skills exigidas del curso se consideran OBLIGATORIAS para
    // el calculo APTO/NO_APTO (D44). La distincion OBLIGATORIA/OPCIONAL a
    // nivel de skill exigida no existe en el modelo Curso (es del plan).
    caracter: "OBLIGATORIA",
    notaActual: notas.has(s.skillId) ? (notas.get(s.skillId) ?? null) : null,
    umbralCumple: Number(s.notaMinima),
  }))
}

export function mapearResultadoNotif(
  resultado: ResultadoFinal,
): "APTO" | "NO_APTO" | "COMPLETADO" | "RETIRADO" {
  return resultado
}

/**
 * Lee las notas vigentes (`NotaSkill.notaActual`) de las skills exigidas del
 * curso para todos los colaboradores presentes en la lista de asignaciones.
 * Internal al pipeline de cierre — no se exporta.
 */
async function leerNotasSkillsExigidas(
  tx: PrismaTx,
  cursoSnapshot: CursoSnapshotCierre,
  asignaciones: readonly AsignacionCierreRow[],
): Promise<Map<string, Map<string, number | null>>> {
  const skillIds = cursoSnapshot.skillsExigidas.map((s) => s.skillId)
  const colaboradorIds = asignaciones.map((a) => a.colaboradorId)
  if (skillIds.length === 0 || colaboradorIds.length === 0) {
    return new Map()
  }
  const filas = await tx.notaSkill.findMany({
    where: {
      colaboradorId: { in: colaboradorIds },
      skillId: { in: skillIds },
    },
    select: { colaboradorId: true, skillId: true, notaActual: true },
  })
  const out = new Map<string, Map<string, number | null>>()
  for (const colaboradorId of colaboradorIds) {
    out.set(colaboradorId, new Map())
  }
  for (const f of filas) {
    const sub = out.get(f.colaboradorId)
    if (sub) {
      sub.set(f.skillId, f.notaActual === null ? null : Number(f.notaActual))
    }
  }
  return out
}

/**
 * Lee el curso en `tx` con todas las sub-tablas que el pipeline de cierre
 * necesita (areas, skills exigidas, módulos habilitados). Valida que el
 * curso exista y esté en estado ACTIVO. Lanza `NotFoundException` o
 * `ConflictException` tipadas con `apiErrorCodes` cuando no se cumple.
 */
export async function leerCursoParaCerrar(
  tx: PrismaTx,
  cursoId: string,
): Promise<CursoSnapshotCierre> {
  const curso = await tx.curso.findUnique({
    where: { id: cursoId },
    select: {
      id: true,
      titulo: true,
      clienteId: true,
      estado: true,
      fechaInicio: true,
      fechaDeadline: true,
      umbralesLogro: true,
      pesoBloques: true,
      pesoTransversal: true,
      pesoEntrevista: true,
      transversalId: true,
      entrevistaIaId: true,
      areasExigidas: {
        select: { areaId: true, peso: true, puntajeObjetivo: true },
      },
      skillsExigidas: {
        select: { skillId: true, notaMinima: true, skill: { select: { etiquetaVisible: true } } },
      },
      modulosHabilitados: { select: { moduloId: true } },
    },
  })
  if (!curso) {
    throw new NotFoundException({
      code: apiErrorCodes.cursoNoEncontrado,
      message: "Curso no encontrado.",
    })
  }
  if (curso.estado !== EstadoCurso.ACTIVO) {
    throw new ConflictException({
      code: apiErrorCodes.conflictCursoNoActivo,
      message: "Solo se puede cerrar un curso en estado ACTIVO.",
      details: { estado: curso.estado },
    })
  }
  return curso
}

/**
 * Lee las asignaciones del curso con el shape mínimo que el pipeline de
 * cierre requiere (rol, estados literales, colaborador).
 */
export function leerAsignacionesParaCerrar(
  tx: PrismaTx,
  cursoId: string,
): Promise<readonly AsignacionCierreRow[]> {
  return tx.asignacionCurso.findMany({
    where: { cursoId },
    select: {
      id: true,
      rol: true,
      estadoAsignado: true,
      estadoVoluntario: true,
      colaboradorId: true,
      colaborador: {
        select: {
          id: true,
          nombre: true,
          email: true,
        },
      },
    },
  })
}

/**
 * Verifica que el body trae decisión para CADA asignación EN_PROGRESO. Si
 * falta alguna, lanza `UnprocessableEntityException` con el listado de
 * asignaciones sin decisión (422 / `validacionDecisionFaltante`).
 */
export function validarDecisionesCompletas(
  asignaciones: readonly AsignacionCierreRow[],
  decisiones: ReadonlyMap<string, AccionCierre>,
): void {
  const faltantes = asignaciones
    .filter((a) => esEnProgreso(a) && !decisiones.has(a.id))
    .map((a) => a.id)
  if (faltantes.length > 0) {
    throw new UnprocessableEntityException({
      code: apiErrorCodes.validacionDecisionFaltante,
      message: "Faltan decisiones para una o mas asignaciones EN_PROGRESO.",
      details: { asignacionesFaltantes: faltantes },
    })
  }
}

/**
 * Aplica las decisiones del admin a cada asignación EN_PROGRESO:
 *  - Calcula `resultadoFinal` con `calcularResultadoFinal` (helper puro).
 *  - Actualiza `AsignacionCurso.estadoAsignado`/`estadoVoluntario` según rol.
 *  - Registra `HistoricoEstadoAsignacion` con el `logCambioCursoId` del cierre.
 *
 * `MANTENER_PENDIENTE` (resultado `null`) NO transiciona la asignación pero
 * sí se reporta en el array devuelto para que el caller decida qué notificar.
 *
 * Sin cambios funcionales respecto a la versión previa que vivía como método
 * privado en `CursosService` (extracción organizativa Slice 11 §5.124).
 */
export async function aplicarDecisionesACada(
  tx: PrismaTx,
  input: {
    readonly curso: CursoSnapshotCierre
    readonly asignaciones: readonly AsignacionCierreRow[]
    readonly decisionPorAsignacion: ReadonlyMap<string, AccionCierre>
    readonly autorUsuarioId: string
    readonly motivo: string
    readonly fechaCierre: Date
    readonly logCambioCursoId: string
  },
): Promise<readonly DecisionAplicada[]> {
  const aplicadas: DecisionAplicada[] = []
  const notasPorColaborador = await leerNotasSkillsExigidas(tx, input.curso, input.asignaciones)

  for (const asig of input.asignaciones) {
    const accion = input.decisionPorAsignacion.get(asig.id)
    if (!accion) {
      continue
    }
    const notas = mapearNotasSkillSnapshot(
      input.curso,
      notasPorColaborador.get(asig.colaboradorId) ?? new Map(),
    )
    const resultado = calcularResultadoFinal({ rol: asig.rol, accion, notasSkills: notas })
    if (resultado === null) {
      aplicadas.push({
        asignacionId: asig.id,
        accion,
        resultadoFinal: null,
        notas,
      })
      continue
    }
    const estadoAnterior = literalEstadoAsignacion(asig)
    const estadoNuevo = resultado
    if (asig.rol === RolAsignacion.ASIGNADO) {
      await tx.asignacionCurso.updateMany({
        where: { id: asig.id },
        data: {
          estadoAsignado:
            estadoNuevo as Prisma.AsignacionCursoUpdateManyMutationInput["estadoAsignado"],
          fechaCierre: input.fechaCierre,
        },
      })
    } else {
      const estadoVol = resultado === "COMPLETADO" ? "COMPLETADO" : "RETIRADO"
      await tx.asignacionCurso.updateMany({
        where: { id: asig.id },
        data: {
          estadoVoluntario: estadoVol,
          fechaCierre: input.fechaCierre,
        },
      })
    }
    await tx.historicoEstadoAsignacion.create({
      data: {
        asignacionId: asig.id,
        estadoAnterior,
        estadoNuevo,
        motivo: input.motivo,
        autorUsuarioId: input.autorUsuarioId,
        logCambioCursoId: input.logCambioCursoId,
      },
    })
    aplicadas.push({
      asignacionId: asig.id,
      accion,
      resultadoFinal: resultado,
      notas,
    })
  }
  return aplicadas
}

/**
 * Revierte una asignación a su estado anterior al cierre, restableciendo
 * `fechaCierre = null` y registrando un nuevo `HistoricoEstadoAsignacion`
 * apuntando al `logCambioCursoId` del log DESHACER_CIERRE.
 *
 * El estado registrado como `estadoAnterior` del histórico es el literal
 * del cierre que se está deshaciendo (`APTO_NO_APTO` para asignados,
 * `COMPLETADO` para voluntarios), conservando el invariante existente.
 *
 * Sin cambios funcionales respecto a la versión previa que vivía como método
 * privado en `CursosService` (extracción organizativa Slice 11 §5.124).
 */
export async function revertirAsignacionParaDeshacer(
  tx: PrismaTx,
  input: {
    readonly asignacion: AsignacionParaRevertir
    readonly autorUsuarioId: string
    readonly motivo: string
    readonly logCambioCursoId: string
  },
): Promise<void> {
  const { id, rol, estadoAnterior } = input.asignacion
  if (rol === RolAsignacion.ASIGNADO) {
    await tx.asignacionCurso.updateMany({
      where: { id },
      data: {
        estadoAsignado:
          estadoAnterior as Prisma.AsignacionCursoUpdateManyMutationInput["estadoAsignado"],
        fechaCierre: null,
      },
    })
  } else {
    await tx.asignacionCurso.updateMany({
      where: { id },
      data: {
        estadoVoluntario:
          estadoAnterior as Prisma.AsignacionCursoUpdateManyMutationInput["estadoVoluntario"],
        fechaCierre: null,
      },
    })
  }
  await tx.historicoEstadoAsignacion.create({
    data: {
      asignacionId: id,
      estadoAnterior: rol === RolAsignacion.ASIGNADO ? "APTO_NO_APTO" : "COMPLETADO",
      estadoNuevo: estadoAnterior,
      motivo: input.motivo,
      autorUsuarioId: input.autorUsuarioId,
      logCambioCursoId: input.logCambioCursoId,
    },
  })
}

/**
 * Construye el payload JSONB que se persiste en `CursoFotografiaCierre.snapshot`.
 * Pura: no toca BD, solo proyecta los inputs al shape estable v1.
 *
 * Sin cambios funcionales respecto a la versión previa que vivía como función
 * módulo-nivel en `cursos.service.ts` (extracción organizativa Slice 11 §5.124).
 */
export function construirSnapshotCierre(input: {
  readonly curso: CursoSnapshotCierre
  readonly asignaciones: readonly AsignacionCierreRow[]
  readonly decisionesAplicadas: readonly DecisionAplicada[]
  readonly fechaCierre: Date
  readonly motivo: string
  readonly autorAdminId: string
}): Record<string, unknown> {
  const aplicadasPorAsignacion = new Map<string, DecisionAplicada>(
    input.decisionesAplicadas.map((d) => [d.asignacionId, d]),
  )
  return {
    versionSnapshot: 1,
    fechaCierre: input.fechaCierre.toISOString(),
    motivo: input.motivo,
    autorAdminId: input.autorAdminId,
    curso: {
      id: input.curso.id,
      titulo: input.curso.titulo,
      clienteId: input.curso.clienteId,
      fechaInicio: input.curso.fechaInicio.toISOString().slice(0, 10),
      fechaDeadline: input.curso.fechaDeadline.toISOString().slice(0, 10),
      configuracion: {
        areas: input.curso.areasExigidas.map((a) => ({
          areaId: a.areaId,
          peso: Number(a.peso),
          puntajeObjetivo: Number(a.puntajeObjetivo),
        })),
        skillsExigidas: input.curso.skillsExigidas.map((s) => ({
          skillId: s.skillId,
          etiquetaVisible: s.skill.etiquetaVisible,
          notaMinima: Number(s.notaMinima),
        })),
        modulosHabilitados: input.curso.modulosHabilitados.map((m) => m.moduloId),
        pesos: {
          bloques: Number(input.curso.pesoBloques),
          transversal: Number(input.curso.pesoTransversal),
          entrevista: Number(input.curso.pesoEntrevista),
        },
        umbralesLogro: input.curso.umbralesLogro,
        transversalActivo: input.curso.transversalId !== null,
        entrevistaIaActiva: input.curso.entrevistaIaId !== null,
      },
    },
    asignaciones: input.asignaciones.map((a) => {
      const aplicada = aplicadasPorAsignacion.get(a.id)
      const notasPersistidas =
        aplicada?.notas.map((n) => ({
          skillId: n.skillId,
          caracter: n.caracter,
          notaActual: n.notaActual,
          umbralCumple: n.umbralCumple,
        })) ?? []
      return {
        asignacionId: a.id,
        colaborador: {
          id: a.colaborador.id,
          nombre: a.colaborador.nombre,
          email: a.colaborador.email,
        },
        rol: a.rol,
        decisionAplicada: aplicada?.accion ?? null,
        resultadoFinal: aplicada?.resultadoFinal ?? null,
        estadoPrevio: a.rol === RolAsignacion.ASIGNADO ? a.estadoAsignado : a.estadoVoluntario,
        // DEUDA-B26-1: la nota global se calcula y persiste AHORA, al cerrar.
        // Es la fuente de verdad inmutable del veredicto final — si la formula
        // cambia despues, los cursos ya cerrados conservan su nota original.
        // Hoy promedio simple de notas OBLIGATORIAS con `notaActual !== null`;
        // si en el futuro se quiere ponderacion por areas, se cambia aqui sin
        // afectar a snapshots historicos.
        notaGlobalFinal: calcularNotaGlobalFinal(notasPersistidas),
        notasPorSkill: notasPersistidas,
      }
    }),
  }
}

function calcularNotaGlobalFinal(
  notas: ReadonlyArray<{
    readonly caracter: "OBLIGATORIA" | "OPCIONAL"
    readonly notaActual: number | null
  }>,
): number | null {
  const valores = notas
    .filter((n) => n.caracter === "OBLIGATORIA" && n.notaActual !== null)
    .map((n) => n.notaActual as number)
  if (valores.length === 0) {
    return null
  }
  const suma = valores.reduce((acc, n) => acc + n, 0)
  return Math.round(suma / valores.length)
}
