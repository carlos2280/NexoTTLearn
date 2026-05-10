import { httpClient } from "@/shared/api/http-client"
import { type CatalogoFichaResponse, catalogoFichaResponseSchema } from "@nexott-learn/shared-types"

export async function obtenerFicha(slug: string): Promise<CatalogoFichaResponse> {
  const data = await httpClient.get<CatalogoFichaResponse>(
    `/participante/catalogo/${encodeURIComponent(slug)}`,
  )
  const result = catalogoFichaResponseSchema.safeParse(data)
  if (!result.success) {
    console.error("[catalogo-ficha] Zod parse fallo", {
      slug,
      raw: data,
      issues: result.error.issues,
    })
    throw new Error(
      `Respuesta del back no cumple el contrato: ${result.error.issues
        .slice(0, 3)
        .map((i) => `${i.path.join(".")} → ${i.message}`)
        .join(" · ")}`,
    )
  }
  return result.data
}
