import { z } from "zod"
import {
  estadoAsignadoSchema,
  estadoVoluntarioSchema,
  rolAsignacionSchema,
} from "../asignaciones/asignacion.types"
import type {
  EstadoAsignado,
  EstadoVoluntario,
  RolAsignacion,
} from "../asignaciones/asignacion.types"
import { paginacionQuerySchema } from "../catalogo/paginacion"
import { estadoCursoSchema } from "../cursos/curso.types"
import type { EstadoCurso } from "../cursos/curso.types"

/**
 * `GET /api/v1/me/cursos` (FIX-pre-S12) — listado paginado de las asignaciones
 * del colaborador en sesion. Filtros opcionales por `estado` (estado del
 * curso) y `rol` (asignado/voluntario). El porcentaje proviene del motor
 * `PlanPersonalService.obtenerPorcentajeAvance` para asignaciones con plan;
 * voluntarios sin plan devuelven 0 (defensivo — D-AS-1).
 */
export interface MeCursoResumen {
  readonly asignacionId: string
  readonly cursoId: string
  readonly cursoTitulo: string
  readonly cursoEstado: EstadoCurso
  readonly rol: RolAsignacion
  readonly estadoAsignado: EstadoAsignado | null
  readonly estadoVoluntario: EstadoVoluntario | null
  readonly fechaInscripcion: string
  readonly fechaDeadline: string
  readonly porcentajeAvance: number
  /**
   * B-2: numero de skills del catalogo del curso que aun no superan el
   * `notaMinima` exigido. `0` cuando todas demostradas (no `null`).
   */
  readonly skillsPendientesCount: number
  /**
   * B-extra.1: area mas representada en el catalogo de skills del curso
   * (slug). `null` si el curso aun no declara skills.
   */
  readonly areaCodigo: string | null
  readonly areaNombre: string | null
}

const filtroEstadoCursoSchema = z.union([estadoCursoSchema, z.literal("TODOS")]).default("TODOS")
const filtroRolSchema = z.union([rolAsignacionSchema, z.literal("TODOS")]).default("TODOS")

export const meCursosQuerySchema = paginacionQuerySchema.extend({
  estado: filtroEstadoCursoSchema,
  rol: filtroRolSchema,
})

export type MeCursosQuery = z.infer<typeof meCursosQuerySchema>

export { estadoAsignadoSchema, estadoVoluntarioSchema, rolAsignacionSchema, estadoCursoSchema }

/**
 * `GET /api/v1/me/ficha/exportar` (FIX-pre-S12) — formato pedido por el
 * participante para portabilidad RGPD (D90 §20.3). El controller setea
 * `Content-Disposition: attachment` y devuelve el binario directamente; no
 * hay JSON envelope.
 */
export const formatoExportFichaSchema = z.enum(["csv", "pdf"])
export type FormatoExportFicha = z.infer<typeof formatoExportFichaSchema>

export const exportarFichaQuerySchema = z.object({
  formato: formatoExportFichaSchema,
})
export type ExportarFichaQuery = z.infer<typeof exportarFichaQuerySchema>

/**
 * `GET /api/v1/me/ficha/historial` (B-24) — timeline cronologico unificado del
 * colaborador para la seccion "Tu historial" de /mi-ficha. UNION de
 * `historico_notas_skill` + hitos de cada `AsignacionCurso` (iniciado /
 * completado), ordenado por fecha DESC.
 *
 * Paginacion: por ahora solo `limite` (default 50, max 100). El frontend
 * pagina en memoria. La paginacion cursor real se anadira si surge necesidad
 * por volumen — el shape soporta el cursor opcional.
 */
export const historialFichaQuerySchema = z.object({
  cursor: z.string().min(1).optional(),
  limite: z.coerce.number().int().min(1).max(100).default(50),
})
export type HistorialFichaQuery = z.infer<typeof historialFichaQuerySchema>
