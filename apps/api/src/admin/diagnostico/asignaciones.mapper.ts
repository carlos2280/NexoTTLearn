import type {
  AsignacionConfirmada,
  AsignacionModulo,
  CandidatoAsignacion,
  MatrizAsignacionesContadores,
} from "@nexott-learn/shared-types"
import { Prisma } from "@prisma/client"
import { calcularSugerencias } from "./asignaciones.sugerencias"

// =============================================================================
// ASIGNACIONES · selects de Prisma + map de filas a contratos shared-types.
// La logica de calculo de sugerencias vive en asignaciones.sugerencias.ts.
// =============================================================================

export const CURSO_AREA_ASIGN_SELECT = {
  id: true,
  areaId: true,
  puntajeObjetivo: true,
  orden: true,
  area: { select: { id: true, nombre: true, color: true } },
} satisfies Prisma.CursoAreaSelect

export type CursoAreaAsignRow = Prisma.CursoAreaGetPayload<{
  select: typeof CURSO_AREA_ASIGN_SELECT
}>

export const MODULO_ASIGN_SELECT = {
  id: true,
  titulo: true,
  orden: true,
  areaId: true,
  archivadoAt: true,
} satisfies Prisma.ModuloSelect

export type ModuloAsignRow = Prisma.ModuloGetPayload<{ select: typeof MODULO_ASIGN_SELECT }>

export const INSCRIPCION_ASIGN_SELECT = {
  id: true,
  tipo: true,
  participante: { select: { id: true, nombre: true, apellido: true, email: true } },
  evaluacionesIniciales: { select: { areaId: true, puntaje: true } },
  asignaciones: {
    select: { moduloId: true, tipo: true, asignadaAt: true, modificadaAt: true },
  },
} satisfies Prisma.InscripcionSelect

export type InscripcionAsignRow = Prisma.InscripcionGetPayload<{
  select: typeof INSCRIPCION_ASIGN_SELECT
}>

export function mapModulo(row: ModuloAsignRow): AsignacionModulo {
  return { id: row.id, titulo: row.titulo, orden: row.orden, areaId: row.areaId }
}

export function mapConfirmadas(
  asignaciones: InscripcionAsignRow["asignaciones"],
): AsignacionConfirmada[] {
  return asignaciones.map((a) => ({
    moduloId: a.moduloId,
    tipo: a.tipo,
    asignadaAt: a.asignadaAt.toISOString(),
    modificadaAt: a.modificadaAt ? a.modificadaAt.toISOString() : null,
  }))
}

interface MapCandidatoArgs {
  readonly inscripcion: InscripcionAsignRow
  readonly cursoAreas: readonly CursoAreaAsignRow[]
  readonly modulos: readonly ModuloAsignRow[]
  readonly umbralBrechaNoCumple: number
}

export function mapCandidato(args: MapCandidatoArgs): CandidatoAsignacion {
  const { inscripcion } = args
  const calc = calcularSugerencias(args)
  return {
    inscripcionId: inscripcion.id,
    participante: inscripcion.participante,
    tieneEvaluacion: calc.tieneEvaluacion,
    sugerencias: calc.sugerencias,
    confirmadas: mapConfirmadas(inscripcion.asignaciones),
    cumple: calc.cumple,
  }
}

export function calcularContadores(
  candidatos: readonly CandidatoAsignacion[],
): MatrizAsignacionesContadores {
  let conSugerencia = 0
  let cumplenTodo = 0
  let sinEvaluacion = 0
  let yaConfirmados = 0
  for (const c of candidatos) {
    if (!c.tieneEvaluacion) {
      sinEvaluacion += 1
    } else if (c.sugerencias.length === 0) {
      cumplenTodo += 1
    } else {
      conSugerencia += 1
    }
    if (c.confirmadas.length > 0) {
      yaConfirmados += 1
    }
  }
  return {
    candidatos: candidatos.length,
    conSugerencia,
    cumplenTodo,
    sinEvaluacion,
    yaConfirmados,
  }
}
