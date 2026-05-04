import { z } from "zod"

// Subset de iconColor que entiende <NxlCourseCardAdmin> en nexott-ui.
// Mantener sincronizado con IconColor del componente.
const iconColorSchema = z.enum(["indigo", "emerald", "violet", "amber", "rose", "cyan"])

export const cursoStatusSchema = z.enum(["draft", "published", "disabled"])
export type CursoStatus = z.infer<typeof cursoStatusSchema>

export const cursoAdminItemSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  description: z.string().optional(),
  iconInitials: z.string().min(1).max(3),
  iconColor: iconColorSchema,
  modules: z.number().int().min(0),
  status: cursoStatusSchema,
  participantsCount: z.number().int().min(0),
  // Tasa de completitud del grupo 0-100. 0 cuando no hay participantes.
  completionRate: z.number().int().min(0).max(100),
})
export type CursoAdminItem = z.infer<typeof cursoAdminItemSchema>

export const obtenerCursosAdminResponseSchema = z.object({
  items: z.array(cursoAdminItemSchema),
})
export type ObtenerCursosAdminResponse = z.infer<typeof obtenerCursosAdminResponseSchema>

// ─────────────────────────────────────────────────────────────────
// Detalle del curso (AD03 — Editar Curso, tab General)
// ─────────────────────────────────────────────────────────────────

// Espejo del enum Prisma NivelCurso. Se mantiene en shared-types para que el
// frontend no dependa de @prisma/client.
export const nivelCursoSchema = z.enum(["BASICO", "INTERMEDIO", "AVANZADO"])
export type NivelCurso = z.infer<typeof nivelCursoSchema>

// Estado nativo Prisma EstadoCurso. El detalle expone el enum BD directamente
// (a diferencia de cursoAdminItemSchema que mapea a "draft"/"published"/...).
// Razon: el formulario de edicion necesita el valor exacto de la BD para
// poder enviarlo de vuelta sin re-mapear.
export const estadoCursoSchema = z.enum(["BORRADOR", "PUBLICADO", "DESHABILITADO"])
export type EstadoCursoApi = z.infer<typeof estadoCursoSchema>

// Slug normalizado: solo minusculas, numeros y guiones. Mismo regex que el
// usado por el slugify del frontend para que el round-trip sea estable.
const slugSchema = z
  .string()
  .min(1, "El slug es obligatorio")
  .max(120, "El slug no puede exceder 120 caracteres")
  .regex(/^[a-z0-9-]+$/, "El slug solo admite minusculas, numeros y guiones")

const umbralSchema = z
  .number()
  .min(0, "El umbral no puede ser menor a 0")
  .max(100, "El umbral no puede exceder 100")

export const cursoAdminDetalleSchema = cursoAdminItemSchema.extend({
  nivel: nivelCursoSchema,
  estado: estadoCursoSchema,
  umbralExcelencia: umbralSchema,
  umbralAprobado: umbralSchema,
  umbralEnDesarrollo: umbralSchema,
})
export type CursoAdminDetalle = z.infer<typeof cursoAdminDetalleSchema>

// Defaults alineados con el modelo Prisma (Curso.umbral* @default(...)).
// Si la BD cambia, actualizar aqui tambien.
export const UMBRAL_EXCELENCIA_DEFAULT = 90
export const UMBRAL_APROBADO_DEFAULT = 70
export const UMBRAL_EN_DESARROLLO_DEFAULT = 50

export const crearCursoInputSchema = z.object({
  titulo: z
    .string()
    .min(3, "El titulo debe tener al menos 3 caracteres")
    .max(200, "El titulo no puede exceder 200 caracteres"),
  slug: slugSchema,
  descripcion: z.string().max(2000).optional(),
  nivel: nivelCursoSchema.default("BASICO"),
  umbralExcelencia: umbralSchema.default(UMBRAL_EXCELENCIA_DEFAULT),
  umbralAprobado: umbralSchema.default(UMBRAL_APROBADO_DEFAULT),
  umbralEnDesarrollo: umbralSchema.default(UMBRAL_EN_DESARROLLO_DEFAULT),
})
export type CrearCursoInput = z.infer<typeof crearCursoInputSchema>

// PATCH parcial: todos los campos son opcionales. El service solo aplica los
// que vienen definidos. No incluye `estado` aqui — la transicion de estado
// (publicar / deshabilitar) se hara en endpoints dedicados con sus propias
// reglas de negocio (al menos 1 modulo + 1 seccion + 1 contenido).
export const actualizarCursoInputSchema = z
  .object({
    titulo: z.string().min(3).max(200),
    slug: slugSchema,
    descripcion: z.string().max(2000).nullable(),
    nivel: nivelCursoSchema,
    umbralExcelencia: umbralSchema,
    umbralAprobado: umbralSchema,
    umbralEnDesarrollo: umbralSchema,
  })
  .partial()
export type ActualizarCursoInput = z.infer<typeof actualizarCursoInputSchema>
