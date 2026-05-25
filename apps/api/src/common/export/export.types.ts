/**
 * Tipos del helper transversal de exportacion (Slice 11 P11c — D-S11-C7).
 *
 * Cada formato devuelve un buffer en memoria + mime + extension. El controller
 * decide el `Content-Disposition: attachment; filename=...` a partir de
 * `extension`.
 */

export type FormatoColumna = "texto" | "numero" | "porcentaje" | "fecha"

/**
 * Definicion de columna desacoplada del shape concreto. `key` se usa via lookup
 * en runtime contra `Record<string, unknown>` (el caller normaliza la fila
 * antes de pasarla). Mantener generico `T` permite que el caller pase tipos
 * fuertes y obtenga validacion en compile-time sobre las keys disponibles.
 */
export interface ColumnaDef<T> {
  readonly key: keyof T & string
  readonly header: string
  readonly formato?: FormatoColumna
}

/**
 * Resultado uniforme de los 3 metodos del `ExportService`. El controller
 * setea Content-Type al `mime` y `filename` usando `extension`.
 */
export interface ExportResult {
  readonly buffer: Buffer
  readonly mime: string
  readonly extension: "csv" | "xlsx" | "pdf"
}
