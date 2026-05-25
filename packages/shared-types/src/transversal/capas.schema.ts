import { z } from "zod"

/**
 * Bodies de carga de capa del intento transversal (Slice 8 P8b, D-S8-C2/C4).
 *
 * - `tests` recibe la nota y un `detalle` libre (proviene del CI externo, D-S8-C2).
 * - `cualitativa` recibe la nota + comentario textual + nivel de confianza.
 * - `comprension` recibe la nota + la transcripcion de la mini-entrevista IA.
 *
 * Los 3 schemas son `.strict()` para rechazar payloads con campos extra y se
 * reutilizan tanto en el controller admin como en el job worker interno.
 */

const notaCapaSchema = z.number().min(0).max(100)

export const cargarCapaTestsSchema = z
  .object({
    nota: notaCapaSchema,
    detalle: z.record(z.unknown()),
  })
  .strict()

export type CargarCapaTestsInput = z.infer<typeof cargarCapaTestsSchema>

export const cargarCapaCualitativaSchema = z
  .object({
    nota: notaCapaSchema,
    detalle: z
      .object({
        comentario: z.string().max(4000).trim(),
        confianza: z.enum(["BAJA", "MEDIA", "ALTA"]),
      })
      .strict(),
  })
  .strict()

export type CargarCapaCualitativaInput = z.infer<typeof cargarCapaCualitativaSchema>

export const cargarCapaComprensionSchema = z
  .object({
    nota: notaCapaSchema,
    detalle: z
      .object({
        transcripcion: z
          .array(
            z
              .object({
                rol: z.enum(["ASISTENTE", "COLABORADOR"]),
                mensaje: z.string().max(4000),
              })
              .strict(),
          )
          .max(50),
      })
      .strict(),
  })
  .strict()

export type CargarCapaComprensionInput = z.infer<typeof cargarCapaComprensionSchema>
