// Selector puro: VitrinaQueryResult -> CatalogoVitrinaResponse.
//
// Doc canonico: DOCUMENTOS/doc/v2/3-pantallas/participante/catalogo/vitrina.md
//
// Reglas:
//   - gradiente e icono se derivan del slug (helpers compartidos con mis-cursos).
//   - descripcionCorta truncada a 160 chars; fallback "Curso para {empresa}".
//   - esRecomendado siempre false en MVP (gap: schema sin campo `recomendado`).
//   - href: /catalogo/{slug}. La ficha decide la redireccion final.

import type {
  CatalogoFiltroDuracion,
  CatalogoVitrinaItem,
  CatalogoVitrinaResponse,
} from "@nexott-learn/shared-types"
import {
  descripcionCorta,
  gradienteParaCurso,
  iconoParaCurso,
} from "../mis-cursos/mis-cursos.types"
import type { VitrinaQueryResult } from "./catalogo.vitrina.query"

const DURACIONES: ReadonlyArray<CatalogoFiltroDuracion> = [
  { id: "CORTA", label: "Menos de 5 horas" },
  { id: "MEDIA", label: "Entre 5 y 15 horas" },
  { id: "LARGA", label: "Mas de 15 horas" },
]

export function construirVitrinaResponse(data: VitrinaQueryResult): CatalogoVitrinaResponse {
  const items: CatalogoVitrinaItem[] = data.rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    titulo: row.titulo,
    descripcionCorta: descripcionCorta(row.descripcion, `Curso para ${row.empresaCliente}`),
    gradiente: gradienteParaCurso(row.slug),
    icono: iconoParaCurso(row.slug),
    area: row.areaPrincipal
      ? {
          id: row.areaPrincipal.id,
          nombre: row.areaPrincipal.nombre,
          colorHex: row.areaPrincipal.color,
        }
      : null,
    totalModulos: row.totalModulos,
    duracionEstimada: row.duracionEstimada,
    instructorEmpresa: row.empresaCliente,
    esRecomendado: false,
    href: `/catalogo/${row.slug}`,
  }))

  return {
    items,
    nextCursor: data.nextCursor,
    totalDisponibles: data.totalDisponibles,
    totalSinFiltros: data.totalSinFiltros,
    filtros: {
      areas: data.areasDisponibles.map((a) => ({
        id: a.id,
        nombre: a.nombre,
        colorHex: a.color,
      })),
      duraciones: [...DURACIONES],
    },
  }
}
