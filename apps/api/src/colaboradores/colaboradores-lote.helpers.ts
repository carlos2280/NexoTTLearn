import type { ColaboradorLoteRechazado } from "@nexott-learn/shared-types"

interface FilaLote {
  readonly email: string
  readonly nombre: string
}

export interface LotePreparado {
  readonly validos: readonly FilaLote[]
  readonly rechazados: readonly ColaboradorLoteRechazado[]
}

function dominioDe(email: string): string {
  const idx = email.lastIndexOf("@")
  return idx === -1 ? "" : email.slice(idx + 1)
}

/**
 * Normaliza (email a minusculas + trim, nombre trim), descarta filas cuyo
 * dominio no este permitido y deduplica por email dentro de la tanda. Puro y
 * testeable: no toca BD ni env.
 *
 * `dominiosPermitidos` con `*` deja pasar cualquier dominio. Prioridad de
 * rechazo: dominio antes que duplicado (una fila con dominio invalido y
 * repetida se reporta como `dominio_no_permitido`).
 */
export function prepararLoteColaboradores(
  colaboradores: readonly FilaLote[],
  dominiosPermitidos: readonly string[],
): LotePreparado {
  const permiteCualquiera = dominiosPermitidos.includes("*")
  const validos: FilaLote[] = []
  const rechazados: ColaboradorLoteRechazado[] = []
  const vistos = new Set<string>()

  for (const fila of colaboradores) {
    const email = fila.email.trim().toLowerCase()
    const nombre = fila.nombre.trim()
    if (!(permiteCualquiera || dominiosPermitidos.includes(dominioDe(email)))) {
      rechazados.push({ email, nombre, motivo: "dominio_no_permitido" })
      continue
    }
    if (vistos.has(email)) {
      rechazados.push({ email, nombre, motivo: "duplicado_en_lote" })
      continue
    }
    vistos.add(email)
    validos.push({ email, nombre })
  }

  return { validos, rechazados }
}
