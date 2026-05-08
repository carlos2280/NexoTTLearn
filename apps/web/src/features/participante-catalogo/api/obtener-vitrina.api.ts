import { httpClient } from "@/shared/api/http-client"
import {
  type CatalogoVitrinaQuery,
  type CatalogoVitrinaResponse,
  catalogoVitrinaResponseSchema,
} from "@nexott-learn/shared-types"

export async function obtenerVitrina(
  query: CatalogoVitrinaQuery,
): Promise<CatalogoVitrinaResponse> {
  const params = new URLSearchParams()
  if (query.q) {
    params.set("q", query.q)
  }
  if (query.area) {
    params.set("area", query.area)
  }
  if (query.duracion) {
    params.set("duracion", query.duracion)
  }
  if (query.cursor) {
    params.set("cursor", query.cursor)
  }
  if (query.limite !== undefined) {
    params.set("limite", String(query.limite))
  }
  const queryString = params.toString()
  const path = queryString ? `/participante/catalogo?${queryString}` : "/participante/catalogo"
  const data = await httpClient.get<CatalogoVitrinaResponse>(path)
  const result = catalogoVitrinaResponseSchema.safeParse(data)
  if (!result.success) {
    console.error("[catalogo-vitrina] Zod parse fallo", { raw: data, issues: result.error.issues })
    throw new Error(
      `Respuesta del back no cumple el contrato: ${result.error.issues
        .slice(0, 3)
        .map((i) => `${i.path.join(".")} → ${i.message}`)
        .join(" · ")}`,
    )
  }
  return result.data
}
