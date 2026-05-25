import type {
  HistoricoEstadoAsignacionResumen,
  LogAjustePlanResumen,
  LogCambioCursoResumen,
  LogConsultaResumen,
  LogModuloEstadoResumen,
  LogSkillEventoResumen,
} from "@nexott-learn/shared-types"
import type { ColumnaDef } from "../common/export/export.types"

/**
 * Helpers locales del modulo Logs (Slice futuro B P-B-c).
 *
 * Centraliza:
 *   - 6 definiciones `ColumnaDef<T>` que el `LogsController` pasa al
 *     `ExportService.aCsv` / `aXlsx`. Orden fijo de columnas por dominio
 *     (R-S12-5: nunca exponer metadatos sensibles ni JSONB anidado plano).
 *   - `nombreArchivoExport(dominio, extension)` para construir el
 *     `Content-Disposition: attachment; filename=...` de forma estable
 *     (`logs-<dominio>-YYYYMMDD.<csv|xlsx>`).
 *
 * Mantiene el dominio acoplado al shape ya proyectado por `LogsService`. Si
 * algun visor cambia su shape, este helper es el unico lugar a actualizar.
 *
 * El JSONB `previewImpacto` de cursos y `queryParams` de consultas se
 * estabiliza a `JSON.stringify` (CSV/XLSX no soportan estructura anidada).
 * Estabilizar evita que un objeto se serialice como `[object Object]` en CSV.
 */

export const COLUMNAS_LOGS_CURSOS: readonly ColumnaDef<FilaCurso>[] = [
  { key: "id", header: "id" },
  { key: "cursoId", header: "cursoId" },
  { key: "cursoTitulo", header: "cursoTitulo" },
  { key: "fecha", header: "fecha", formato: "fecha" },
  { key: "autorUsuarioId", header: "autorUsuarioId" },
  { key: "autorEmail", header: "autorEmail" },
  { key: "autorNombre", header: "autorNombre" },
  { key: "accion", header: "accion" },
  { key: "motivo", header: "motivo" },
  { key: "previewImpacto", header: "previewImpacto" },
]

export const COLUMNAS_LOGS_ASIGNACIONES: readonly ColumnaDef<FilaAsignacion>[] = [
  { key: "id", header: "id" },
  { key: "asignacionId", header: "asignacionId" },
  { key: "fecha", header: "fecha", formato: "fecha" },
  { key: "autorUsuarioId", header: "autorUsuarioId" },
  { key: "autorEmail", header: "autorEmail" },
  { key: "autorNombre", header: "autorNombre" },
  { key: "estadoAnterior", header: "estadoAnterior" },
  { key: "estadoNuevo", header: "estadoNuevo" },
  { key: "motivo", header: "motivo" },
  // biome-ignore lint/nursery/noSecrets: nombre de columna del visor, no es un secreto.
  { key: "logCambioCursoId", header: "logCambioCursoId" },
]

export const COLUMNAS_LOGS_SKILLS: readonly ColumnaDef<FilaSkill>[] = [
  { key: "id", header: "id" },
  { key: "skillId", header: "skillId" },
  { key: "fecha", header: "fecha", formato: "fecha" },
  { key: "autorUsuarioId", header: "autorUsuarioId" },
  { key: "autorEmail", header: "autorEmail" },
  { key: "autorNombre", header: "autorNombre" },
  { key: "tipoEvento", header: "tipoEvento" },
  { key: "motivo", header: "motivo" },
  { key: "etiquetaAnterior", header: "etiquetaAnterior" },
  { key: "etiquetaNueva", header: "etiquetaNueva" },
  { key: "areaAnteriorId", header: "areaAnteriorId" },
  { key: "areaNuevaId", header: "areaNuevaId" },
]

export const COLUMNAS_LOGS_MODULOS: readonly ColumnaDef<FilaModulo>[] = [
  { key: "id", header: "id" },
  { key: "moduloId", header: "moduloId" },
  { key: "fecha", header: "fecha", formato: "fecha" },
  { key: "autorUsuarioId", header: "autorUsuarioId" },
  { key: "autorEmail", header: "autorEmail" },
  { key: "autorNombre", header: "autorNombre" },
  { key: "estadoAnterior", header: "estadoAnterior" },
  { key: "estadoNuevo", header: "estadoNuevo" },
  { key: "motivo", header: "motivo" },
]

export const COLUMNAS_LOGS_AJUSTES_PLAN: readonly ColumnaDef<FilaAjustePlan>[] = [
  { key: "id", header: "id" },
  { key: "planId", header: "planId" },
  { key: "fecha", header: "fecha", formato: "fecha" },
  { key: "autorUsuarioId", header: "autorUsuarioId" },
  { key: "autorEmail", header: "autorEmail" },
  { key: "autorNombre", header: "autorNombre" },
  { key: "accion", header: "accion" },
  { key: "motivo", header: "motivo" },
  { key: "seccionId", header: "seccionId" },
]

export const COLUMNAS_LOGS_CONSULTAS: readonly ColumnaDef<FilaConsulta>[] = [
  { key: "id", header: "id" },
  { key: "fecha", header: "fecha", formato: "fecha" },
  { key: "autorUsuarioId", header: "autorUsuarioId" },
  { key: "autorEmail", header: "autorEmail" },
  { key: "autorNombre", header: "autorNombre" },
  { key: "endpoint", header: "endpoint" },
  { key: "queryParams", header: "queryParams" },
  { key: "latenciaMs", header: "latenciaMs", formato: "numero" },
]

/**
 * Construye el filename para `Content-Disposition`. Formato estable:
 * `logs-<dominio>-YYYYMMDD.<csv|xlsx>`.
 */
export function nombreArchivoExport(
  dominio: DominioLogs,
  extension: "csv" | "xlsx",
  fecha: Date = new Date(),
): string {
  const ymd = fecha.toISOString().slice(0, 10).replace(/-/g, "")
  return `logs-${dominio}-${ymd}.${extension}`
}

export type DominioLogs =
  | "cursos"
  | "asignaciones"
  | "skills"
  | "modulos"
  | "ajustes-plan"
  | "consultas"

/**
 * Filas planas listas para `ExportService`. JSONB anidados (`previewImpacto`,
 * `queryParams`) se estabilizan a string para que CSV/XLSX puedan emitirlos.
 */
export interface FilaCurso extends Omit<LogCambioCursoResumen, "previewImpacto"> {
  readonly previewImpacto: string
}

export type FilaAsignacion = HistoricoEstadoAsignacionResumen
export type FilaSkill = LogSkillEventoResumen
export type FilaModulo = LogModuloEstadoResumen
export type FilaAjustePlan = LogAjustePlanResumen

export interface FilaConsulta extends Omit<LogConsultaResumen, "queryParams"> {
  readonly queryParams: string
}

export function aplanarFilaCurso(fila: LogCambioCursoResumen): FilaCurso {
  return {
    ...fila,
    previewImpacto: fila.previewImpacto === null ? "" : JSON.stringify(fila.previewImpacto),
  }
}

export function aplanarFilaConsulta(fila: LogConsultaResumen): FilaConsulta {
  return {
    ...fila,
    queryParams: JSON.stringify(fila.queryParams),
  }
}
