import { ApiError } from "@/shared/api/api-error"
import { z } from "zod"

/**
 * Una precondicion D63 que impide publicar el curso. El backend las manda TODAS
 * (sin early-exit) en el 422 `details.validacionesFallidas`; aca solo las leemos
 * de forma segura para pintarlas como checklist en el dialogo de publicacion.
 */
export interface PrecondicionFallida {
  readonly codigo: string
  readonly mensaje: string
  readonly detalle?: string
}

const validacionFallidaSchema = z.object({
  codigo: z.string(),
  mensaje: z.string(),
  detalles: z.record(z.unknown()).optional(),
})

const detailsSchema = z.object({
  validacionesFallidas: z.array(validacionFallidaSchema),
})

/**
 * Extrae las precondiciones fallidas de un error de publicacion. Devuelve `[]`
 * si el error no es un 422 con ese shape (ej. 409 de estado, error de red) para
 * que el dialogo caiga al mensaje generico. No lanza nunca.
 */
export function extraerPrecondicionesFallidas(err: unknown): readonly PrecondicionFallida[] {
  if (!(err instanceof ApiError)) {
    return []
  }
  const parsed = detailsSchema.safeParse(err.details)
  if (!parsed.success) {
    return []
  }
  return parsed.data.validacionesFallidas.map((v) => ({
    codigo: v.codigo,
    mensaje: v.mensaje,
    detalle: resumirDetalle(v.detalles),
  }))
}

/**
 * Convierte el `detalles` estructurado del backend en una linea legible para el
 * admin. Cubre los casos mas utiles (suma de pesos y skills sin cobertura); el
 * resto se apoya en el `mensaje`, que ya es autoexplicativo.
 */
function resumirDetalle(detalles?: Record<string, unknown>): string | undefined {
  if (!detalles) {
    return undefined
  }
  if (typeof detalles.sumaActual === "number") {
    return `Suma actual: ${detalles.sumaActual}.`
  }
  const skills = extraerEtiquetas(detalles.skills)
  if (skills.length > 0) {
    return `Skills sin cubrir: ${skills.join(", ")}.`
  }
  return undefined
}

function extraerEtiquetas(valor: unknown): readonly string[] {
  if (!Array.isArray(valor)) {
    return []
  }
  return valor
    .map((item) =>
      typeof item === "object" && item !== null && "etiquetaVisible" in item
        ? String((item as { etiquetaVisible: unknown }).etiquetaVisible)
        : null,
    )
    .filter((etiqueta): etiqueta is string => etiqueta !== null)
}
