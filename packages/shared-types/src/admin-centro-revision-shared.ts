import { z } from "zod"

// Helpers Zod compartidos entre Centro de Revisión · entregas de bloque
// (Iter 9.A) y entregas de proyecto (Iter 9.B). MAESTRO §17.2 (motivo
// obligatorio en ajuste manual A26), §17.9 (notas en [0, 100]).

export const NOTA_MIN = 0
export const NOTA_MAX = 100
export const NOTA_DECIMALES = 2

export const TEXTO_LIBRE_MAX = 4000
export const MOTIVO_MIN = 10
export const MOTIVO_MAX = 1000

export const notaSchema = z
  .number()
  .min(NOTA_MIN, "La nota debe ser >= 0")
  .max(NOTA_MAX, "La nota debe ser <= 100")
  .refine(
    (n) => {
      const factor = 10 ** NOTA_DECIMALES
      return Math.round(n * factor) === n * factor
    },
    { message: "La nota admite hasta 2 decimales" },
  )

// Texto libre cualitativo (feedback de bloque, fortalezas/areasMejora/etc.
// de proyecto). Trim aplicado en el schema; el servicio aplica semántica
// PATCH (undefined preserva, null borra).
export const textoLibreCualitativoSchema = z
  .string()
  .trim()
  .max(TEXTO_LIBRE_MAX, `El texto no puede exceder ${TEXTO_LIBRE_MAX} caracteres`)

// Motivo de ajuste manual (A26). NO se permite vacío tras trim.
export const motivoAjusteSchema = z
  .string()
  .trim()
  .min(MOTIVO_MIN, `El motivo debe tener al menos ${MOTIVO_MIN} caracteres`)
  .max(MOTIVO_MAX, `El motivo no puede exceder ${MOTIVO_MAX} caracteres`)
