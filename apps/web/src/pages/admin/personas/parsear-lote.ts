/**
 * Parseo (cliente) del textarea de carga masiva: cada línea es
 * `email, nombre` (acepta coma, punto y coma o tab como separador — pegar desde
 * Excel usa tab). Normaliza el email a minúsculas. La validación fuerte la hace
 * el backend (Zod + dominio); esto solo evita enviar basura y da feedback por
 * línea. Puro y testeable.
 */

const SEPARADOR = /[,;\t]/
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u
const RE_CABECERA_NOMBRE = /^nombre/iu
const RE_SALTO_LINEA = /\r?\n/u

export interface FilaLoteParseada {
  readonly email: string
  readonly nombre: string
}

export interface LoteParseado {
  readonly filas: readonly FilaLoteParseada[]
  readonly errores: readonly string[]
}

function esCabecera(numero: number, email: string, nombre: string): boolean {
  return numero === 1 && email === "email" && RE_CABECERA_NOMBRE.test(nombre)
}

export function parsearLoteColaboradores(texto: string): LoteParseado {
  const filas: FilaLoteParseada[] = []
  const errores: string[] = []
  const lineas = texto.split(RE_SALTO_LINEA)

  for (let i = 0; i < lineas.length; i += 1) {
    const numero = i + 1
    const linea = (lineas[i] ?? "").trim()
    if (linea.length === 0) {
      continue
    }
    const sep = linea.search(SEPARADOR)
    if (sep === -1) {
      errores.push(`Línea ${numero}: falta el nombre (usa "email, nombre").`)
      continue
    }
    const email = linea.slice(0, sep).trim().toLowerCase()
    const nombre = linea.slice(sep + 1).trim()
    if (esCabecera(numero, email, nombre)) {
      continue
    }
    if (!EMAIL_REGEX.test(email)) {
      errores.push(`Línea ${numero}: "${email || linea}" no es un email válido.`)
      continue
    }
    if (nombre.length === 0) {
      errores.push(`Línea ${numero}: falta el nombre de ${email}.`)
      continue
    }
    filas.push({ email, nombre })
  }

  return { filas, errores }
}
