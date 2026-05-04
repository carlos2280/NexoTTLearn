import { z } from "zod"

// Espejo del enum Prisma TipoContenido. Mantener sincronizado con schema.prisma.
// Se define aqui (y no en admin-contenidos) porque el GET de secciones embebe
// cabeceras de contenido y necesita el enum. admin-contenidos lo reexporta.
export const tipoContenidoSchema = z.enum([
  "LECTURA",
  "EJEMPLO_CODIGO",
  "EJERCICIO",
  "TEST",
  "VIDEO",
  "RECURSO",
])
export type TipoContenido = z.infer<typeof tipoContenidoSchema>

// ─────────────────────────────────────────────────────────────────
// Contenido embebido (cabecera) dentro de SeccionAdminItem
// ─────────────────────────────────────────────────────────────────

// Cabecera ligera del contenido. NO incluye el campo `contenido` (Json grande
// con RichText/quiz/IDE) — eso solo se devuelve en el endpoint de detalle del
// Sprint 2. `metadata` se devuelve permisivo (z.record) en este sprint; la
// validacion estricta por tipo vive en admin-contenidos (Sprint 2).
export const contenidoEmbebidoSchema = z.object({
  id: z.string(),
  seccionId: z.string(),
  tipo: tipoContenidoSchema,
  titulo: z.string(),
  orden: z.number().int().min(1),
  // Derivado de metadata.duracionEstimada para que el front lo lea sin parsear.
  // Null cuando el tipo no maneja duracion (RECURSO con duracion=0 sigue siendo 0).
  duracionEstimada: z.number().int().min(0).nullable(),
  metadata: z.record(z.unknown()).nullable(),
  archivado: z.boolean(),
  creadoEn: z.string(),
  actualizadoEn: z.string(),
})
export type ContenidoEmbebido = z.infer<typeof contenidoEmbebidoSchema>

// ─────────────────────────────────────────────────────────────────
// Seccion — item de la lista del Tab Modulos > Modulo abierto
// ─────────────────────────────────────────────────────────────────

export const seccionAdminItemSchema = z.object({
  id: z.string(),
  moduloId: z.string(),
  titulo: z.string(),
  orden: z.number().int().min(1),
  creadoEn: z.string(),
  actualizadoEn: z.string(),
  contenidos: z.array(contenidoEmbebidoSchema),
})
export type SeccionAdminItem = z.infer<typeof seccionAdminItemSchema>

export const obtenerSeccionesAdminResponseSchema = z.object({
  items: z.array(seccionAdminItemSchema),
})
export type ObtenerSeccionesAdminResponse = z.infer<typeof obtenerSeccionesAdminResponseSchema>

// ─────────────────────────────────────────────────────────────────
// Crear / Actualizar
// ─────────────────────────────────────────────────────────────────

export const crearSeccionInputSchema = z.object({
  titulo: z
    .string()
    .min(3, "El titulo debe tener al menos 3 caracteres")
    .max(200, "El titulo no puede exceder 200 caracteres"),
})
export type CrearSeccionInput = z.infer<typeof crearSeccionInputSchema>

// PATCH parcial. Mismo patron que actualizarModuloInputSchema: campos ausentes
// no se tocan. Por ahora solo `titulo` es editable; el orden se cambia via
// endpoint de reorder.
export const actualizarSeccionInputSchema = z
  .object({
    titulo: z.string().min(3).max(200),
  })
  .partial()
export type ActualizarSeccionInput = z.infer<typeof actualizarSeccionInputSchema>

// ─────────────────────────────────────────────────────────────────
// Reordenar
// ─────────────────────────────────────────────────────────────────

export const reordenarSeccionesInputSchema = z.object({
  // IDs en el nuevo orden deseado. La posicion 0 se vuelve orden=1, etc.
  // Debe contener EXACTAMENTE los IDs de todas las secciones del modulo, sin
  // duplicados ni faltantes. El service valida.
  ids: z.array(z.string().min(1)).min(1, "Lista de ids vacia"),
})
export type ReordenarSeccionesInput = z.infer<typeof reordenarSeccionesInputSchema>
