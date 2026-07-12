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
const notaDimensionSchema = z.number().min(0).max(100).nullable()

export const cargarCapaTestsSchema = z
  .object({
    nota: notaCapaSchema,
    detalle: z.record(z.unknown()),
  })
  .strict()

export type CargarCapaTestsInput = z.infer<typeof cargarCapaTestsSchema>

/**
 * Una dimension del informe estructurado (Slice 8 Fase 2). Los ejes son las
 * skills que el transversal declara (`TransversalSkill`): puntuar contra ellas
 * hace comparables dos repos distintos. `nota` es `null` cuando la IA no pudo
 * evaluar esa dimension (repo parcial, evidencia ausente).
 */
export const dimensionInformeSchema = z
  .object({
    dimension: z.string().min(1).max(200),
    nota: notaDimensionSchema,
    comentario: z.string().max(1000),
  })
  .strict()

export type DimensionInforme = z.infer<typeof dimensionInformeSchema>

export const puntoAReforzarSchema = z
  .object({
    que: z.string().min(1).max(300),
    sugerencia: z.string().min(1).max(500),
  })
  .strict()

export type PuntoAReforzar = z.infer<typeof puntoAReforzarSchema>

/**
 * Informe de la "Revisión con IA" = `detalle` de la capa cualitativa.
 * `comentario` + `confianza` son el contrato original (D-S8-C2). Los campos del
 * informe estructurado (Fase 2) son **opcionales y aditivos**: los emite el
 * motor IA nuevo, pero un detalle legacy (solo comentario/confianza) sigue
 * siendo valido. El `veredicto` se deriva aguas arriba de
 * `nota >= umbralAprobacion`, no lo decide la IA.
 *
 * Fuente única: se usa como body de escritura (`cargarCapaCualitativaSchema`) y
 * como shape de lectura (`IntentoTransversalAdminResponse.revisionIa`).
 */
export const revisionIaSchema = z
  .object({
    comentario: z.string().max(4000).trim(),
    confianza: z.enum(["BAJA", "MEDIA", "ALTA"]),
    veredicto: z.enum(["apto", "necesita_ajustes"]).optional(),
    resumen: z.string().max(2000).optional(),
    queReviso: z.string().max(500).optional(),
    queNoReviso: z.string().max(500).optional(),
    porDimension: z.array(dimensionInformeSchema).max(30).optional(),
    fortalezas: z.array(z.string().min(1).max(300)).max(5).optional(),
    aReforzar: z.array(puntoAReforzarSchema).max(5).optional(),
  })
  .strict()

export type RevisionIa = z.infer<typeof revisionIaSchema>

export const cargarCapaCualitativaSchema = z
  .object({
    nota: notaCapaSchema,
    detalle: revisionIaSchema,
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
