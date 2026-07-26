import type { ColaboradorLoteCreado } from "@nexott-learn/shared-types"

/** BOM UTF-8: hace que Excel abra el CSV con los acentos correctos. */
const BOM = String.fromCharCode(0xfeff)
const RE_CSV_ESPECIAL = /[",\n\r]/u
const RE_COMILLA = /"/gu
const RE_FORMULA = /^[=+\-@\t\r]/u

/**
 * OWASP CSV/Formula Injection: un campo que empieza por `= + - @` (o tab/CR) lo
 * interpreta Excel/Sheets como fórmula al abrir el archivo. El `nombre` viene de
 * planillas externas, así que se prefija con comilla simple para inutilizarlo.
 */
function neutralizarFormula(valor: string): string {
  return RE_FORMULA.test(valor) ? `'${valor}` : valor
}

function escaparCampoCsv(valor: string): string {
  const seguro = neutralizarFormula(valor)
  if (RE_CSV_ESPECIAL.test(seguro)) {
    return `"${seguro.replace(RE_COMILLA, '""')}"`
  }
  return seguro
}

/**
 * CSV `nombre,email,password` de las cuentas creadas, para entregar las
 * credenciales. Cabecera + CRLF (estándar CSV) + BOM UTF-8. Se arma en cliente
 * desde la respuesta (las passwords no se persisten): si no se descarga ahora,
 * se pierden. Puro.
 */
export function construirCsvCredenciales(creados: readonly ColaboradorLoteCreado[]): string {
  const cabecera = "nombre,email,password"
  const filas = creados.map(
    (c) =>
      `${escaparCampoCsv(c.nombre)},${escaparCampoCsv(c.email)},${escaparCampoCsv(c.passwordTemporal)}`,
  )
  return `${BOM}${[cabecera, ...filas].join("\r\n")}\r\n`
}
