import { randomBytes } from "node:crypto"

// Genera password temporal segura (≥12 chars, cumple regla del schema:
// mayúscula + minúscula + número). Formato amigable de copiar/pegar:
// 3 grupos separados por guiones (Xy7-PqL2-9bN).
//
// MAESTRO §8.1: el usuario llega con debeCambiarPassword=true, así que
// esta password vive solo hasta el primer login; no necesita ser memorable.
// biome-ignore lint/nursery/noSecrets: alfabeto para password aleatoria, no es un secreto
const ALFABETO_MAYUS = "ABCDEFGHJKLMNPQRSTUVWXYZ" // sin I, O para evitar confusión visual
// biome-ignore lint/nursery/noSecrets: alfabeto para password aleatoria, no es un secreto
const ALFABETO_MINUS = "abcdefghjkmnpqrstuvwxyz" // sin i, l, o
const ALFABETO_NUM = "23456789" // sin 0, 1

const GRUPOS = 3
const CHARS_POR_GRUPO = 4

const RE_MAYUS = /[A-Z]/
const RE_MINUS = /[a-z]/
const RE_NUM = /[0-9]/

export function generarPasswordTemporal(): string {
  const grupos: string[] = []
  for (let g = 0; g < GRUPOS; g++) {
    grupos.push(grupoAleatorio())
  }
  return garantizarComplejidad(grupos.join("-"))
}

function grupoAleatorio(): string {
  const alfabeto = ALFABETO_MAYUS + ALFABETO_MINUS + ALFABETO_NUM
  const bytes = randomBytes(CHARS_POR_GRUPO)
  let out = ""
  for (let i = 0; i < CHARS_POR_GRUPO; i++) {
    const byte = bytes[i] ?? 0
    out += alfabeto[byte % alfabeto.length]
  }
  return out
}

// El alfabeto mixto casi siempre cumple, pero ante el caso patológico
// (todo el azar cayó en una sola clase) forzamos al menos uno de cada.
function garantizarComplejidad(password: string): string {
  const tieneMayus = RE_MAYUS.test(password)
  const tieneMinus = RE_MINUS.test(password)
  const tieneNum = RE_NUM.test(password)
  if (tieneMayus && tieneMinus && tieneNum) {
    return password
  }
  return generarPasswordTemporal()
}
