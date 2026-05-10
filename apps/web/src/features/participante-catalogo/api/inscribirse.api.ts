import { httpClient } from "@/shared/api/http-client"
import {
  type CatalogoInscribirmeResponse,
  catalogoInscribirmeResponseSchema,
} from "@nexott-learn/shared-types"

export async function inscribirseEnCurso(slug: string): Promise<CatalogoInscribirmeResponse> {
  const data = await httpClient.post<CatalogoInscribirmeResponse>(
    `/participante/catalogo/${encodeURIComponent(slug)}/inscribirme`,
    {},
  )
  return catalogoInscribirmeResponseSchema.parse(data)
}
