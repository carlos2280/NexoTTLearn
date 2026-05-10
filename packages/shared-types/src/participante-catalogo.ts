// Participante · Catalogo de cursos libres.
// Doc canonico: DOCUMENTOS/doc/v2/3-pantallas/participante/catalogo/
//   - vitrina.md       -> GET /participante/catalogo
//   - ficha-curso-libre.md -> GET /participante/catalogo/:slug
//                          -> POST /participante/catalogo/:slug/inscribirme
//
// Reglas de negocio derivadas del README de la seccion:
//   - El catalogo solo muestra Curso.permiteInscripcionLibre = true y estado ACTIVO.
//   - El curso no aparece si el participante ya tiene una Inscripcion ACTIVA en el.
//   - Auto-inscripcion sin confirmacion (CAT-03), redirige a /cursos/{slug} (CAT-04).

import { z } from "zod"
import { gradientePresetSchema, iconoCursoPresetSchema } from "./participante-mis-cursos"

// ───── Filtros y query ──────────────────────────────────────────────────────

/**
 * Banda de duracion estimada del curso. El back convierte el texto libre de
 * Curso.duracionEstimada en una de estas tres bandas.
 */
export const catalogoDuracionBandaSchema = z.enum(["CORTA", "MEDIA", "LARGA"])
export type CatalogoDuracionBanda = z.infer<typeof catalogoDuracionBandaSchema>

export const catalogoVitrinaQuerySchema = z.object({
  /** Texto libre, busca en titulo + descripcion. Trim + lowercase del lado del back. */
  q: z.string().trim().max(120).optional(),
  /** UUID del area filtrada. */
  area: z.string().uuid().optional(),
  /** Banda de duracion. */
  duracion: catalogoDuracionBandaSchema.optional(),
  /** Solo cursos recomendados para el participante (MVP: siempre vacio). */
  recomendados: z.coerce.boolean().optional(),
  /** Cursor de paginacion: id del ultimo item recibido. */
  cursor: z.string().uuid().optional(),
  /** Cantidad por pagina, default 18 (V-02 doc vitrina §1). */
  limite: z.coerce.number().int().min(1).max(50).optional(),
})
export type CatalogoVitrinaQuery = z.infer<typeof catalogoVitrinaQuerySchema>

// ───── Vitrina · item de la grilla (§2 vitrina.md) ──────────────────────────

export const catalogoAreaResumenSchema = z.object({
  id: z.string().uuid(),
  nombre: z.string().min(1),
  /** Color HEX del catalogo de areas. */
  colorHex: z.string().min(1),
})
export type CatalogoAreaResumen = z.infer<typeof catalogoAreaResumenSchema>

export const catalogoVitrinaItemSchema = z.object({
  id: z.string().uuid(),
  slug: z.string().min(1),
  titulo: z.string().min(1),
  /** Truncada a 160 caracteres. */
  descripcionCorta: z.string().min(1),
  gradiente: gradientePresetSchema,
  icono: iconoCursoPresetSchema,
  /** Area principal del curso (la del primer modulo). null si el curso no tiene modulos. */
  area: catalogoAreaResumenSchema.nullable(),
  totalModulos: z.number().int().min(0),
  /** Texto original del curso ("8 horas", "3 dias"). null si no esta seteado. */
  duracionEstimada: z.string().min(1).nullable(),
  /** Empresa cliente — usado como "instructor / equipo" en la card. */
  instructorEmpresa: z.string().min(1),
  /** MVP: siempre false (el schema no tiene campo `recomendado` aun, ver gaps). */
  esRecomendado: z.boolean(),
  /** href listo para usar en el front: /catalogo/{slug}. */
  href: z.string().min(1),
})
export type CatalogoVitrinaItem = z.infer<typeof catalogoVitrinaItemSchema>

export const catalogoFiltroDuracionSchema = z.object({
  id: catalogoDuracionBandaSchema,
  label: z.string().min(1),
})
export type CatalogoFiltroDuracion = z.infer<typeof catalogoFiltroDuracionSchema>

export const catalogoFiltrosDisponiblesSchema = z.object({
  areas: z.array(catalogoAreaResumenSchema),
  duraciones: z.array(catalogoFiltroDuracionSchema),
})
export type CatalogoFiltrosDisponibles = z.infer<typeof catalogoFiltrosDisponiblesSchema>

export const catalogoVitrinaResponseSchema = z.object({
  items: z.array(catalogoVitrinaItemSchema),
  /** id del ultimo curso de la pagina; null si ya no hay mas. */
  nextCursor: z.string().uuid().nullable(),
  /** Total disponibles tras filtros (sin paginar). */
  totalDisponibles: z.number().int().min(0),
  /** Total visible sin filtros aplicados (para detectar "catalogo vacio" vs "sin resultados"). */
  totalSinFiltros: z.number().int().min(0),
  filtros: catalogoFiltrosDisponiblesSchema,
})
export type CatalogoVitrinaResponse = z.infer<typeof catalogoVitrinaResponseSchema>

// ───── Ficha del curso libre (§2 ficha-curso-libre.md) ──────────────────────

export const catalogoFichaHeroSchema = z.object({
  id: z.string().uuid(),
  slug: z.string().min(1),
  titulo: z.string().min(1),
  /** Descripcion corta, max 160. */
  descripcionCorta: z.string().min(1),
  gradiente: gradientePresetSchema,
  icono: iconoCursoPresetSchema,
  area: catalogoAreaResumenSchema.nullable(),
  totalModulos: z.number().int().min(0),
  duracionEstimada: z.string().min(1).nullable(),
  instructorEmpresa: z.string().min(1),
  esRecomendado: z.boolean(),
})
export type CatalogoFichaHero = z.infer<typeof catalogoFichaHeroSchema>

export const catalogoFichaModuloSchema = z.object({
  id: z.string().uuid(),
  titulo: z.string().min(1),
  orden: z.number().int().min(0),
  /** Cantidad de secciones del modulo (no archivadas). */
  cantidadSecciones: z.number().int().min(0),
})
export type CatalogoFichaModulo = z.infer<typeof catalogoFichaModuloSchema>

export const catalogoFichaAreaSchema = z.object({
  areaId: z.string().uuid(),
  nombre: z.string().min(1),
  colorHex: z.string().min(1),
  modulos: z.array(catalogoFichaModuloSchema),
})
export type CatalogoFichaArea = z.infer<typeof catalogoFichaAreaSchema>

export const catalogoFichaHitosSchema = z.object({
  /** True si el curso tiene Proyecto Transversal activo (pesoProyectoTransversal > 0). */
  tieneTransversal: z.boolean(),
  /** True si el curso tiene Entrevista IA activa (pesoEntrevistaIA > 0). */
  tieneEntrevistaIA: z.boolean(),
})
export type CatalogoFichaHitos = z.infer<typeof catalogoFichaHitosSchema>

export const catalogoFichaResponseSchema = z.object({
  hero: catalogoFichaHeroSchema,
  /** Descripcion larga del curso (rich text plano por ahora; MVP §2.1). */
  descripcionLarga: z.string().nullable(),
  /** Lista de objetivos de aprendizaje. null si no hay (no se renderiza la lista). */
  objetivos: z.array(z.string().min(1)).nullable(),
  /** Areas del curso con sus modulos, ordenadas por CursoArea.orden. */
  areasConModulos: z.array(catalogoFichaAreaSchema),
  hitos: catalogoFichaHitosSchema,
  /** True si el participante ya esta inscrito ACTIVA en este curso. */
  yaInscrito: z.boolean(),
  /** href a /cursos/{slug} cuando yaInscrito = true. null si no aplica. */
  vistaCursoHref: z.string().min(1).nullable(),
})
export type CatalogoFichaResponse = z.infer<typeof catalogoFichaResponseSchema>

// ───── Auto-inscripcion (POST inscribirme, §3 ficha-curso-libre.md) ─────────

export const catalogoInscribirmeResponseSchema = z.object({
  /** Id de la inscripcion creada. */
  inscripcionId: z.string().uuid(),
  cursoSlug: z.string().min(1),
  /** href a /cursos/{slug} para redirigir al participante. */
  vistaCursoHref: z.string().min(1),
  /** Texto del toast: "Inscrito en {titulo}". */
  mensaje: z.string().min(1),
})
export type CatalogoInscribirmeResponse = z.infer<typeof catalogoInscribirmeResponseSchema>
