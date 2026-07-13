import { Prisma } from "@prisma/client"

/**
 * Selects explicitos reutilizados por el ReportesService (convenciones §03-PRISMA).
 * Centralizar evita olvidar campos sensibles en una query y duplicar la lista.
 */

export const SELECT_COLABORADOR_EMBED_FIELDS = {
  id: true,
  email: true,
  nombre: true,
} as const satisfies Prisma.ColaboradorSelect

export const SELECT_ASIGNACION_AVANCE_FIELDS = {
  id: true,
  rol: true,
  estadoAsignado: true,
  estadoVoluntario: true,
  fechaInicio: true,
  fechaCierre: true,
  cursoId: true,
  colaboradorId: true,
  colaborador: { select: SELECT_COLABORADOR_EMBED_FIELDS },
  plan: { select: { id: true, estaDesactualizado: true } },
} as const satisfies Prisma.AsignacionCursoSelect

export const SELECT_ITEM_PLAN_FIELDS = {
  id: true,
  moduloId: true,
  seccionId: true,
  caracter: true,
  razon: true,
  modulo: { select: { id: true, titulo: true } },
  seccion: { select: { id: true, orden: true, moduloId: true } },
} as const satisfies Prisma.ItemPlanSelect

export const SELECT_INTENTO_BLOQUE_RESUMEN_FIELDS = {
  id: true,
  bloqueId: true,
  fecha: true,
  nota: true,
  estaInvalidado: true,
} as const satisfies Prisma.IntentoBloqueSelect

export const SELECT_INTENTO_TRANSVERSAL_RESUMEN_FIELDS = {
  id: true,
  estado: true,
  fecha: true,
  fechaFinalizacion: true,
  notaCapaTests: true,
  notaCapaCualitativa: true,
  notaCapaComprension: true,
} as const satisfies Prisma.IntentoTransversalSelect

export const SELECT_INTENTO_ENTREVISTA_IA_RESUMEN_FIELDS = {
  id: true,
  estado: true,
  fecha: true,
  fechaFinalizacion: true,
  notaGlobal: true,
  notaAjustadaAdmin: true,
} as const satisfies Prisma.IntentoEntrevistaIASelect

/**
 * Tope de items "ultimos N" por categoria en `detalle-colaborador` (D-S11-B3).
 * Se pide 1 extra (`TOPE + 1`) para detectar `hayMas` sin un `count` adicional.
 */
export const TOPE_ULTIMOS_INTENTOS = 20

/**
 * Ventana de "actividad reciente" para alertas (D-S11-B2).
 */
export const ALERTA_SIN_ACTIVIDAD_DIAS = 7
export const ALERTA_INTENTO_INVALIDADO_DIAS = 30

/**
 * Umbrales fijos para reclasificacion cualitativa de `inventario-skills` (P11c).
 * El `umbralCumple` del query controla la frontera SOLIDO/EN_DESARROLLO; los
 * dos siguientes son fijos (D-S11-C3 vecindad):
 *   nota >= 85               -> excelencia
 *   85 > nota >= umbralCumple -> solido
 *   umbralCumple > nota >= 50 -> enDesarrollo
 *   nota < 50  o nota null    -> noCumple
 */
export const UMBRAL_INVENTARIO_EXCELENCIA = 85
export const UMBRAL_INVENTARIO_NO_CUMPLE = 50

/**
 * Snapshot v1 de `cursos_fotografia_cierre.snapshot` (D-S11-A1).
 * Estructura minima necesaria para reconstruir `FilaAvanceCurso[]` en la vista
 * FOTOGRAFIA_CIERRE. El service hace type guard antes de leer.
 */
export interface SnapshotFotografiaV1 {
  readonly versionSnapshot: 1
  readonly asignaciones: ReadonlyArray<{
    readonly asignacionId: string
    readonly colaborador: { id: string; nombre: string; email: string }
    readonly estado: string
    readonly porcentajeAvance: number
  }>
}

export function esSnapshotFotografiaV1(value: unknown): value is SnapshotFotografiaV1 {
  if (value === null || typeof value !== "object") {
    return false
  }
  const obj = value as Record<string, unknown>
  if (obj.versionSnapshot !== 1 || !Array.isArray(obj.asignaciones)) {
    return false
  }
  for (const fila of obj.asignaciones) {
    if (fila === null || typeof fila !== "object") {
      return false
    }
    const f = fila as Record<string, unknown>
    if (
      typeof f.asignacionId !== "string" ||
      typeof f.estado !== "string" ||
      typeof f.porcentajeAvance !== "number" ||
      f.colaborador === null ||
      typeof f.colaborador !== "object"
    ) {
      return false
    }
    const c = f.colaborador as Record<string, unknown>
    if (typeof c.id !== "string" || typeof c.nombre !== "string" || typeof c.email !== "string") {
      return false
    }
  }
  return true
}
