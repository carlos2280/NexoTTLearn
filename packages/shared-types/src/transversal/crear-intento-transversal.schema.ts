import { z } from "zod"
import { repoOArtefactoSchema } from "./transversal-response.types"

/**
 * Body de `POST /api/v1/asignaciones/:asignacionId/intentos-transversal`
 * (Slice 8 P8a — D-S8-C1).
 *
 * `.strict()` rechaza propiedades extra (en particular `colaboradorId`: la
 * identidad SIEMPRE viene de la sesion — OWASP A01). En MVP solo se acepta
 * `URL_GIT` apuntando a github.com o gitlab.com. Multipart con zip queda
 * fuera del MVP (D-S8-C1).
 */
const githubOrGitlabRegex = /^https:\/\/(github|gitlab)\.com\//

export const crearIntentoTransversalSchema = z
  .object({
    repoOArtefacto: z
      .object({
        tipo: z.literal("URL_GIT"),
        url: z.string().url().regex(githubOrGitlabRegex, {
          message: "La URL debe apuntar a github.com o gitlab.com (HTTPS).",
        }),
      })
      .strict(),
    comentarioColaborador: z.string().max(2000).trim().optional(),
  })
  .strict()

export type CrearIntentoTransversalInput = z.infer<typeof crearIntentoTransversalSchema>

/**
 * Helper para detectar si una URL ya viene saneada — el service lo usa antes
 * de persistir como `Json` para asegurar tipos consistentes.
 */
export { repoOArtefactoSchema }
