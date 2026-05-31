import { httpClient } from "@/shared/api/http-client"
import type { ImportarCursoBody, ImportarCursoResponse } from "@nexott-learn/shared-types"

/**
 * Envia el contenido `.md` al endpoint de importación. El backend parsea,
 * valida y persiste curso + módulos + secciones + bloques en una transacción.
 */
export function importarCurso(body: ImportarCursoBody): Promise<ImportarCursoResponse> {
  return httpClient.post<ImportarCursoResponse>("/admin/cursos/importar", body)
}

/**
 * Descarga el `.md` de plantilla del backend como texto plano. La página
 * crea un Blob y dispara la descarga al click.
 */
export async function descargarPlantillaCurso(): Promise<string> {
  const base = (import.meta.env.VITE_API_URL ?? "/api/v1") as string
  const response = await fetch(`${base}/admin/cursos/importar/plantilla`, {
    method: "GET",
    credentials: "include",
  })
  if (!response.ok) {
    throw new Error(`No se pudo descargar la plantilla (HTTP ${response.status}).`)
  }
  return await response.text()
}
