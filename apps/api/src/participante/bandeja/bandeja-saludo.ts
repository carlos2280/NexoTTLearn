// §4.1 · saludo dinamico segun hora local. Pure helper, sin dependencias.

import type { BandejaSaludo } from "@nexott-learn/shared-types"
import { SALUDO_MANANA_HASTA, SALUDO_TARDE_HASTA } from "./bandeja.types"

const RE_ESPACIOS = /\s+/

export function calcularSaludo(ahora: Date): BandejaSaludo {
  const hora = ahora.getHours()
  if (hora < SALUDO_MANANA_HASTA) {
    return "MANANA"
  }
  if (hora < SALUDO_TARDE_HASTA) {
    return "TARDE"
  }
  return "NOCHE"
}

export function extraerPrimerNombre(nombreCompleto: string): string {
  const trimmed = nombreCompleto.trim()
  if (trimmed.length === 0) {
    return ""
  }
  return trimmed.split(RE_ESPACIOS)[0] ?? trimmed
}
