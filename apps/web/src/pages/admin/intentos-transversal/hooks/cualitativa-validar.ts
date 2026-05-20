import type { CargarCapaCualitativaInput } from "@nexott-learn/shared-types"

export const NOTA_MIN = 0
export const NOTA_MAX = 100
export const COMENTARIO_MAX = 4000
export type Confianza = "BAJA" | "MEDIA" | "ALTA"

export interface ErroresCualitativa {
  readonly nota: string | null
  readonly comentario: string | null
  readonly general: string | null
}

export const ERRORES_CUALITATIVA_VACIOS: ErroresCualitativa = {
  nota: null,
  comentario: null,
  general: null,
}

export function validarCualitativa(
  notaTxt: string,
  comentario: string,
  confianza: Confianza,
): { errores: ErroresCualitativa; body?: CargarCapaCualitativaInput } {
  const notaNum = Number(notaTxt)
  if (!Number.isInteger(notaNum) || notaNum < NOTA_MIN || notaNum > NOTA_MAX) {
    return {
      errores: {
        ...ERRORES_CUALITATIVA_VACIOS,
        nota: `Ingresa un entero entre ${NOTA_MIN} y ${NOTA_MAX}.`,
      },
    }
  }
  const txt = comentario.trim()
  if (txt.length === 0) {
    return {
      errores: { ...ERRORES_CUALITATIVA_VACIOS, comentario: "El comentario es obligatorio." },
    }
  }
  if (txt.length > COMENTARIO_MAX) {
    return {
      errores: {
        ...ERRORES_CUALITATIVA_VACIOS,
        comentario: `Máximo ${COMENTARIO_MAX} caracteres.`,
      },
    }
  }
  return {
    errores: ERRORES_CUALITATIVA_VACIOS,
    body: { nota: notaNum, detalle: { comentario: txt, confianza } },
  }
}
