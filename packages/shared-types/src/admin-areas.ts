import { z } from "zod"
import { areaColorSchema } from "./admin-modulos"

// MAESTRO §4.1, §14.3 · catálogo global de áreas. Estados ACTIVA/OBSOLETA
// (formaliza T01·Q1.2). Una OBSOLETA no se asigna en cursos BORRADOR nuevos
// (I23, validado en aplicación).

export const estadoAreaSchema = z.enum(["ACTIVA", "OBSOLETA"])
export type EstadoArea = z.infer<typeof estadoAreaSchema>

// Color del área. Acepta dos formatos:
//   1. Nombre del DS (areaColor de admin-modulos): indigo, emerald, violet…
//   2. HEX literal (#RRGGBB) para casos en que el cliente quiera un color
//      fuera de la paleta del DS.
// El frontend mapea el primero a tokens del DS y renderiza el segundo tal cual.
const colorHexSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, "El color debe ser un HEX #RRGGBB o un nombre del DS valido")
export const areaColorInputSchema = z.union([areaColorSchema, colorHexSchema])
export type AreaColorInput = z.infer<typeof areaColorInputSchema>

const nombreSchema = z
  .string()
  .trim()
  .min(2, "El nombre debe tener al menos 2 caracteres")
  .max(80, "El nombre no puede exceder 80 caracteres")

const descripcionSchema = z
  .string()
  .trim()
  .max(500, "La descripcion no puede exceder 500 caracteres")

const ordenSchema = z.number().int().min(0, "El orden debe ser un entero >= 0")

// ─────────────────────────────────────────────────────────────────
// Item del catálogo (lectura)
// ─────────────────────────────────────────────────────────────────

export const areaSchema = z.object({
  id: z.string(),
  nombre: z.string(),
  color: z.string(),
  descripcion: z.string().nullable(),
  orden: z.number().int(),
  estado: estadoAreaSchema,
  obsoletaAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type Area = z.infer<typeof areaSchema>

export const areaConContadoresSchema = areaSchema.extend({
  _count: z.object({
    cursoAreas: z.number().int().min(0),
    modulos: z.number().int().min(0),
  }),
})
export type AreaConContadores = z.infer<typeof areaConContadoresSchema>

export const areaListResponseSchema = z.object({
  items: z.array(areaSchema),
  total: z.number().int().min(0),
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
})
export type AreaListResponse = z.infer<typeof areaListResponseSchema>

export const areaDeleteResponseSchema = z.object({
  tipo: z.enum(["OBSOLETADA", "ELIMINADA"]),
})
export type AreaDeleteResponse = z.infer<typeof areaDeleteResponseSchema>

// ─────────────────────────────────────────────────────────────────
// Query de listado (GET /)
// ─────────────────────────────────────────────────────────────────

export const listarAreasQuerySchema = z.object({
  // Default ACTIVA: el caso de uso principal es seleccionar áreas para un curso.
  // El admin que quiera ver obsoletas pasa estado=OBSOLETA explícitamente.
  estado: estadoAreaSchema.optional(),
  q: z.string().trim().min(1).max(80).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})
export type ListarAreasQuery = z.infer<typeof listarAreasQuerySchema>

// ─────────────────────────────────────────────────────────────────
// Crear / Actualizar
// ─────────────────────────────────────────────────────────────────

// MAESTRO §4.1: el catálogo solo guarda nombre, color, descripción, orden.
// El estado se controla con DELETE/restaurar, no se setea en POST/PATCH.
// `.strict()` rechaza claves desconocidas (incluido "estado") con 400, así
// el cliente recibe error explícito en lugar de un update silencioso vacío.
export const crearAreaSchema = z
  .object({
    nombre: nombreSchema,
    color: areaColorInputSchema,
    descripcion: descripcionSchema.optional(),
    orden: ordenSchema.default(0),
  })
  .strict()
export type CrearAreaInput = z.infer<typeof crearAreaSchema>

// PATCH parcial. Mismo set que crear pero todos opcionales. `estado` no se
// permite porque su transición va por DELETE (→ OBSOLETA) y POST /restaurar
// (→ ACTIVA). `.strict()` lo rechaza con 400 si el cliente lo envía.
export const actualizarAreaSchema = z
  .object({
    nombre: nombreSchema,
    color: areaColorInputSchema,
    descripcion: descripcionSchema.nullable(),
    orden: ordenSchema,
  })
  .partial()
  .strict()
export type ActualizarAreaInput = z.infer<typeof actualizarAreaSchema>
