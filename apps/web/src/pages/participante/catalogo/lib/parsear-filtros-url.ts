// Bridge entre URLSearchParams (react-router) y CatalogoVitrinaQuery (Zod).
// Mantiene la URL como single source of truth para los filtros (V-04 doc vitrina).

import {
  type CatalogoDuracionBanda,
  type CatalogoVitrinaQuery,
  catalogoDuracionBandaSchema,
} from "@nexott-learn/shared-types"

export const FILTRO_DEFAULT = "todos"

export type FiltroPestana = "todos" | "recomendados"

export interface FiltrosVitrina {
  readonly q: string
  readonly area: string | null
  readonly duracion: CatalogoDuracionBanda | null
  readonly pestana: FiltroPestana
}

export function leerFiltrosDesdeUrl(params: URLSearchParams): FiltrosVitrina {
  const duracionRaw = params.get("duracion")
  const duracion = duracionRaw ? catalogoDuracionBandaSchema.safeParse(duracionRaw) : null
  return {
    q: params.get("q") ?? "",
    area: params.get("area"),
    duracion: duracion?.success ? duracion.data : null,
    pestana: params.get("pestana") === "recomendados" ? "recomendados" : "todos",
  }
}

export function escribirFiltrosEnUrl(filtros: FiltrosVitrina): URLSearchParams {
  const next = new URLSearchParams()
  if (filtros.q.trim().length > 0) {
    next.set("q", filtros.q.trim())
  }
  if (filtros.area) {
    next.set("area", filtros.area)
  }
  if (filtros.duracion) {
    next.set("duracion", filtros.duracion)
  }
  if (filtros.pestana !== "todos") {
    next.set("pestana", filtros.pestana)
  }
  return next
}

export function filtrosAQuery(filtros: FiltrosVitrina): CatalogoVitrinaQuery {
  const query: CatalogoVitrinaQuery = {}
  if (filtros.q.trim().length > 0) {
    query.q = filtros.q.trim()
  }
  if (filtros.area) {
    query.area = filtros.area
  }
  if (filtros.duracion) {
    query.duracion = filtros.duracion
  }
  if (filtros.pestana === "recomendados") {
    query.recomendados = true
  }
  return query
}

export function filtrosVacios(filtros: FiltrosVitrina): boolean {
  return (
    filtros.q.trim().length === 0 &&
    filtros.area === null &&
    filtros.duracion === null &&
    filtros.pestana === "todos"
  )
}
