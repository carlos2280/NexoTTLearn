import { z } from "zod"
import {
  contenidoCodigoIlustrativoSchema,
  contenidoDiagramaSchema,
  contenidoParrafoSchema,
  contenidoRecursoSchema,
  contenidoTipSchema,
  contenidoVideoSchema,
} from "../catalogo/bloques/contenido"
import {
  contenidoCodigoPreguntasSchema,
  contenidoQuizSchema,
  testStdinStdoutSchema,
} from "../intentos-bloque"
import { desbloqueoCursoSchema } from "./curso.types"

/**
 * Schemas del flujo "Importar curso desde Markdown" (D-IMP-1).
 *
 * El admin escribe un archivo `.md` con frontmatter YAML + bloques `:::` en
 * un editor externo (VS Code, Obsidian, Notion). El backend parsea ese MD a
 * la estructura `ImportarCursoInput` (validada con estos schemas) y luego la
 * persiste en una transacción que crea `Curso + Modulo[] + Seccion[] +
 * Bloque[] + CursoModuloHabilitado[]`.
 *
 * Reusa los `contenido*Schema` de cada `TipoBloque`: el contenido validado
 * aquí es exactamente el JSONB que termina en `Bloque.contenido`.
 *
 * El tipo lógico `CODIGO` agrupa reto + tests en una sola unidad. El service
 * los desempareja en dos `Bloque` consecutivos: primero `CODIGO_PREGUNTAS`
 * (la BD asigna el UUID), luego `CODIGO_TESTS` apuntando a ese UUID via
 * `codigoPreguntasId`.
 */

const bloqueImportadoSchema = z.discriminatedUnion("tipo", [
  z
    .object({
      tipo: z.literal("PARRAFO"),
      contenido: contenidoParrafoSchema,
    })
    .strict(),
  z
    .object({
      tipo: z.literal("TIP"),
      contenido: contenidoTipSchema,
    })
    .strict(),
  z
    .object({
      tipo: z.literal("CODIGO_ILUSTRATIVO"),
      contenido: contenidoCodigoIlustrativoSchema,
    })
    .strict(),
  z
    .object({
      tipo: z.literal("RECURSO"),
      contenido: contenidoRecursoSchema,
    })
    .strict(),
  z
    .object({
      tipo: z.literal("VIDEO"),
      contenido: contenidoVideoSchema,
    })
    .strict(),
  z
    .object({
      tipo: z.literal("DIAGRAMA"),
      contenido: contenidoDiagramaSchema,
    })
    .strict(),
  z
    .object({
      tipo: z.literal("QUIZ"),
      contenido: contenidoQuizSchema,
    })
    .strict(),
  z
    .object({
      tipo: z.literal("CODIGO"),
      contenidoReto: contenidoCodigoPreguntasSchema,
      solucionReferencia: z.string().max(50_000).default(""),
      tests: z.array(testStdinStdoutSchema).min(1).max(40),
    })
    .strict(),
])
export type BloqueImportado = z.infer<typeof bloqueImportadoSchema>

const seccionImportadaSchema = z
  .object({
    titulo: z.string().trim().min(1).max(200),
    bloques: z.array(bloqueImportadoSchema).min(1).max(50),
  })
  .strict()
export type SeccionImportada = z.infer<typeof seccionImportadaSchema>

const moduloImportadoSchema = z
  .object({
    titulo: z.string().trim().min(1).max(200),
    descripcion: z.string().max(2_000).default(""),
    secciones: z.array(seccionImportadaSchema).min(1).max(30),
  })
  .strict()
export type ModuloImportado = z.infer<typeof moduloImportadoSchema>

const fechaDiaSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/u, "Debe ser fecha en formato YYYY-MM-DD")

const cursoImportadoMetaSchema = z
  .object({
    titulo: z.string().trim().min(1).max(200),
    cliente: z.string().trim().min(1).max(200),
    fechaInicio: fechaDiaSchema,
    fechaDeadline: fechaDiaSchema,
    desbloqueo: desbloqueoCursoSchema.optional(),
  })
  .strict()
export type CursoImportadoMeta = z.infer<typeof cursoImportadoMetaSchema>

/**
 * Resultado del parser: estructura tipada y validada lista para persistir.
 * El service consume este shape directamente.
 */
export const importarCursoSchema = z
  .object({
    curso: cursoImportadoMetaSchema,
    modulos: z.array(moduloImportadoSchema).min(1).max(50),
  })
  .strict()
export type ImportarCursoInput = z.infer<typeof importarCursoSchema>

/**
 * Body del endpoint `POST /api/v1/admin/cursos/importar`. El admin sube el
 * texto del `.md`; el backend lo parsea, valida y persiste.
 */
export const importarCursoBodySchema = z
  .object({
    contenidoMd: z.string().min(1).max(2_000_000),
  })
  .strict()
export type ImportarCursoBody = z.infer<typeof importarCursoBodySchema>

/**
 * Respuesta del endpoint de importación. Devuelve identificadores de lo
 * creado para que el frontend pueda redirigir al detalle del curso.
 */
export interface ImportarCursoResponse {
  readonly cursoId: string
  readonly modulosCreados: number
  readonly seccionesCreadas: number
  readonly bloquesCreados: number
}
