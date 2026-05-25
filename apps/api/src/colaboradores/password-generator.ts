import { randomInt } from "node:crypto"

// biome-ignore lint/nursery/noSecrets: alfabeto deterministico para generador de passwords aleatorios.
const MINUSCULAS = "abcdefghijkmnopqrstuvwxyz"
// biome-ignore lint/nursery/noSecrets: alfabeto deterministico para generador de passwords aleatorios.
const MAYUSCULAS = "ABCDEFGHJKLMNPQRSTUVWXYZ"
const DIGITOS = "23456789"
const SIMBOLOS = "!@#$%&*"
const ALFABETO_COMPLETO = MINUSCULAS + MAYUSCULAS + DIGITOS + SIMBOLOS
const LONGITUD_PASSWORD = 12

function caracterAleatorio(alfabeto: string): string {
  const idx = randomInt(0, alfabeto.length)
  return alfabeto.charAt(idx)
}

function mezclar(caracteres: readonly string[]): string {
  const arr = [...caracteres]
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = randomInt(0, i + 1)
    const tmp = arr[i] as string
    arr[i] = arr[j] as string
    arr[j] = tmp
  }
  return arr.join("")
}

/**
 * Genera una contrasena temporal de 12 caracteres garantizando ≥1 minuscula,
 * ≥1 mayuscula, ≥1 digito y ≥1 simbolo del set permitido. El resultado SIEMPRE
 * cumple la regex de fortaleza usada en `cambiarPasswordSchema`.
 *
 * Se excluyen caracteres ambiguos (`l`, `I`, `O`, `0`, `1`) para evitar errores
 * cuando el admin entrega la password en modo MANUAL escribiendola a mano.
 */
export function generarPasswordSegura(): string {
  const obligatorios: readonly string[] = [
    caracterAleatorio(MINUSCULAS),
    caracterAleatorio(MAYUSCULAS),
    caracterAleatorio(DIGITOS),
    caracterAleatorio(SIMBOLOS),
  ]
  const restoLongitud = LONGITUD_PASSWORD - obligatorios.length
  const resto: string[] = []
  for (let i = 0; i < restoLongitud; i += 1) {
    resto.push(caracterAleatorio(ALFABETO_COMPLETO))
  }
  return mezclar([...obligatorios, ...resto])
}
