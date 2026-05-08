import {
  type ModuloInmersivoResponse,
  moduloInmersivoResponseSchema,
} from "@nexott-learn/shared-types"
import { mockModuloInmersivo } from "./mock-modulo-inmersivo"

// S1 · S2 corren contra mock — el back de runtime aun no existe. Cuando se
// publique `GET /participante/cursos/:slug/modulos/:moduloId/inmersivo`, este
// archivo cambia el cuerpo por `httpClient.get(...)` con la url adecuada.
// El contrato Zod ya esta listo para validar la respuesta real.

const LATENCIA_SIMULADA_MS = 280

export async function obtenerModuloInmersivo(
  slug: string,
  moduloId: string,
): Promise<ModuloInmersivoResponse> {
  await new Promise((resolve) => setTimeout(resolve, LATENCIA_SIMULADA_MS))

  // El mock es un solo modulo demo: ignoramos slug/moduloId y devolvemos la
  // misma data — pero validamos siempre con el schema real. Sirve de smoke
  // test del contrato cada vez que se actualiza el mock.
  const _slug = slug
  const _moduloId = moduloId

  const result = moduloInmersivoResponseSchema.safeParse(mockModuloInmersivo)
  if (!result.success) {
    console.error("[modulo-inmersivo] Mock no cumple el contrato Zod", {
      issues: result.error.issues,
    })
    throw new Error(
      `Mock del modulo inmersivo invalido: ${result.error.issues
        .slice(0, 3)
        .map((i) => `${i.path.join(".")} → ${i.message}`)
        .join(" · ")}`,
    )
  }
  return result.data
}
