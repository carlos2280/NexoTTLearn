import type { CargarCapaComprensionInput } from "@nexott-learn/shared-types"

export const NOTA_MIN = 0
export const NOTA_MAX = 100
export const TURNOS_MAX = 50
export const MENSAJE_MAX = 4000

export type RolTurno = "ASISTENTE" | "COLABORADOR"
export interface TurnoBorrador {
  readonly rol: RolTurno
  readonly mensaje: string
}

export interface ErroresComprension {
  readonly nota: string | null
  readonly turnos: string | null
  readonly general: string | null
}

export const ERRORES_COMPRENSION_VACIOS: ErroresComprension = {
  nota: null,
  turnos: null,
  general: null,
}

export function validarComprension(
  notaTxt: string,
  turnos: readonly TurnoBorrador[],
): { errores: ErroresComprension; body?: CargarCapaComprensionInput } {
  const notaNum = Number(notaTxt)
  if (!Number.isInteger(notaNum) || notaNum < NOTA_MIN || notaNum > NOTA_MAX) {
    return {
      errores: {
        ...ERRORES_COMPRENSION_VACIOS,
        nota: `Ingresa un entero entre ${NOTA_MIN} y ${NOTA_MAX}.`,
      },
    }
  }
  const limpios = turnos
    .map((t) => ({ rol: t.rol, mensaje: t.mensaje.trim() }))
    .filter((t) => t.mensaje.length > 0)
  if (limpios.length === 0) {
    return {
      errores: { ...ERRORES_COMPRENSION_VACIOS, turnos: "Agrega al menos un turno con mensaje." },
    }
  }
  if (limpios.some((t) => t.mensaje.length > MENSAJE_MAX)) {
    return {
      errores: {
        ...ERRORES_COMPRENSION_VACIOS,
        turnos: `Cada mensaje admite máximo ${MENSAJE_MAX} caracteres.`,
      },
    }
  }
  return {
    errores: ERRORES_COMPRENSION_VACIOS,
    body: { nota: notaNum, detalle: { transcripcion: limpios } },
  }
}
