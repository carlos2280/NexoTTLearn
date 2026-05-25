import type { AuditoriaResumen } from "@nexott-learn/shared-types"

/**
 * Slice 12 P12 — D-S12-A5 / R-S12-5.
 *
 * Export CSV del visor de auditoria. Columnas explicitas en orden fijo:
 *   id, actorEmail, actorNombre, accion, recursoTipo, recursoId, exito, ip, createdAt.
 *
 * `metadata`, `userAgent` y `requestId` NUNCA se incluyen — el metadata JSONB
 * puede contener payloads estructurales con informacion que el visor no debe
 * exportar plano (R-S12-5). Si en el futuro se pide exponer metadata, se hace
 * con D-PRIV-1 review caso por caso.
 */

interface ColumnaCsv {
  readonly header: string
  readonly value: (fila: AuditoriaResumen) => string
}

const COLUMNAS_CSV: readonly ColumnaCsv[] = [
  { header: "id", value: (f) => f.id },
  { header: "actorEmail", value: (f) => f.actorEmail ?? "" },
  { header: "actorNombre", value: (f) => f.actorNombre ?? "" },
  { header: "accion", value: (f) => f.accion },
  { header: "recursoTipo", value: (f) => f.recursoTipo ?? "" },
  { header: "recursoId", value: (f) => f.recursoId ?? "" },
  { header: "exito", value: (f) => (f.exito ? "true" : "false") },
  { header: "ip", value: (f) => f.ip ?? "" },
  { header: "createdAt", value: (f) => f.createdAt },
]

/**
 * Construye el contenido CSV (UTF-8, sin BOM) con escape RFC4180:
 *   - Cualquier celda que contenga `,`, `"` o un salto de linea se rodea con
 *     comillas dobles.
 *   - Las comillas dobles internas se escapan duplicandolas (`"` -> `""`).
 *
 * El caller (controller) decide el filename y Content-Disposition.
 */
export function exportarAuditoriaACsv(filas: readonly AuditoriaResumen[]): string {
  const lineas: string[] = []
  lineas.push(COLUMNAS_CSV.map((col) => escaparCsv(col.header)).join(","))
  for (const fila of filas) {
    lineas.push(COLUMNAS_CSV.map((col) => escaparCsv(col.value(fila))).join(","))
  }
  return `${lineas.join("\n")}\n`
}

/**
 * Numero maximo de filas que el endpoint de exportacion acepta sin rechazar.
 * Cubre 24 meses de auditoria normal sin saturar el endpoint (D-S12-A5).
 */
export const LIMITE_FILAS_EXPORTACION = 50_000

function escaparCsv(valor: string): string {
  if (valor.includes(",") || valor.includes('"') || valor.includes("\n") || valor.includes("\r")) {
    return `"${valor.replace(/"/g, '""')}"`
  }
  return valor
}
