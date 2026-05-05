import { z } from "zod"

// Espejo del enum Prisma EstadoModulo. Mantener sincronizado con schema.prisma.
export const estadoModuloSchema = z.enum(["BORRADOR", "PUBLICADO"])
export type EstadoModuloApi = z.infer<typeof estadoModuloSchema>

// Subset de areaColor que entiende <NxlCourseModuleAdmin>.
// Mantener sincronizado con AreaColor del componente nexott-ui.
export const areaColorSchema = z.enum([
  "indigo",
  "emerald",
  "violet",
  "amber",
  "rose",
  "cyan",
  "slate",
])
export type AreaColor = z.infer<typeof areaColorSchema>

// Slug normalizado: solo minusculas, numeros y guiones. Mismo regex que cursos
// para que el round-trip con el slugify del frontend sea estable.
const slugSchema = z
  .string()
  .min(1, "El slug es obligatorio")
  .max(120, "El slug no puede exceder 120 caracteres")
  .regex(/^[a-z0-9-]+$/, "El slug solo admite minusculas, numeros y guiones")

// ─────────────────────────────────────────────────────────────────
// Area de competencia (catalogo solo-lectura)
// ─────────────────────────────────────────────────────────────────

export const areaCompetenciaItemSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  descripcion: z.string().optional(),
  // Color del DS para la UI. Si la BD trae null o un valor no mapeable,
  // el mapper devuelve "slate" (fallback neutro).
  color: areaColorSchema,
  orden: z.number().int().nullable(),
})
export type AreaCompetenciaItem = z.infer<typeof areaCompetenciaItemSchema>

export const obtenerAreasCompetenciaResponseSchema = z.object({
  items: z.array(areaCompetenciaItemSchema),
})
export type ObtenerAreasCompetenciaResponse = z.infer<typeof obtenerAreasCompetenciaResponseSchema>

// ─────────────────────────────────────────────────────────────────
// Modulo — item de la lista del Tab Modulos
// ─────────────────────────────────────────────────────────────────

export const moduloAdminItemSchema = z.object({
  id: z.string(),
  cursoId: z.string(),
  titulo: z.string(),
  slug: z.string(),
  descripcion: z.string().optional(),
  orden: z.number().int().min(1),
  estado: estadoModuloSchema,
  duracionEstimada: z.number().int().min(0).nullable(),
  peso: z.number().min(0).max(100).nullable(),
  puntajeObjetivo: z.number().min(0).max(100).nullable(),
  area: z
    .object({
      id: z.string(),
      nombre: z.string(),
      color: areaColorSchema,
    })
    .nullable(),
  sectionsCount: z.number().int().min(0),
  contentsCount: z.number().int().min(0),
})
export type ModuloAdminItem = z.infer<typeof moduloAdminItemSchema>

export const obtenerModulosAdminResponseSchema = z.object({
  items: z.array(moduloAdminItemSchema),
  // Suma de pesos definidos. Si todos son null, devuelve null.
  // El frontend usa esto para el chip "Peso total: X%".
  pesoTotal: z.number().nullable(),
})
export type ObtenerModulosAdminResponse = z.infer<typeof obtenerModulosAdminResponseSchema>

// ─────────────────────────────────────────────────────────────────
// Crear / Actualizar
// ─────────────────────────────────────────────────────────────────

export const crearModuloInputSchema = z.object({
  titulo: z
    .string()
    .min(3, "El titulo debe tener al menos 3 caracteres")
    .max(200, "El titulo no puede exceder 200 caracteres"),
  slug: slugSchema,
  descripcion: z.string().max(2000).optional(),
  duracionEstimada: z.number().int().min(0).max(100000).nullable().optional(),
  peso: z.number().min(0).max(100).nullable().optional(),
  puntajeObjetivo: z.number().min(0).max(100).nullable().optional(),
  areaId: z.string().min(1).nullable().optional(),
  estado: estadoModuloSchema.default("BORRADOR"),
})
export type CrearModuloInput = z.infer<typeof crearModuloInputSchema>

// PATCH parcial: todos los campos son opcionales. El service solo aplica los
// que vienen definidos. `null` en campos nullables borra el valor; `undefined`
// (campo ausente) significa "no tocar".
export const actualizarModuloInputSchema = z
  .object({
    titulo: z.string().min(3).max(200),
    slug: slugSchema,
    descripcion: z.string().max(2000).nullable(),
    duracionEstimada: z.number().int().min(0).max(100000).nullable(),
    peso: z.number().min(0).max(100).nullable(),
    puntajeObjetivo: z.number().min(0).max(100).nullable(),
    areaId: z.string().min(1).nullable(),
    estado: estadoModuloSchema,
  })
  .partial()
export type ActualizarModuloInput = z.infer<typeof actualizarModuloInputSchema>

// ─────────────────────────────────────────────────────────────────
// Reordenar
// ─────────────────────────────────────────────────────────────────

export const reordenarModulosInputSchema = z.object({
  // IDs en el nuevo orden deseado. La posicion 0 del array se vuelve orden=1, etc.
  // Debe contener EXACTAMENTE los IDs de todos los modulos del curso, sin
  // duplicados ni faltantes. El service valida.
  ids: z.array(z.string().min(1)).min(1, "Lista de ids vacia"),
})
export type ReordenarModulosInput = z.infer<typeof reordenarModulosInputSchema>

// ─────────────────────────────────────────────────────────────────
// Clonar
// ─────────────────────────────────────────────────────────────────

export const clonarModuloInputSchema = z.object({
  // Modulo origen del que se copia la cabecera (titulo, descripcion, duracion,
  // peso, puntajeObjetivo, areaId). NO se copian secciones ni contenidos.
  moduloOrigenId: z.string().min(1),
})
export type ClonarModuloInput = z.infer<typeof clonarModuloInputSchema>
