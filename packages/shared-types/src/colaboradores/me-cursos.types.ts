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
