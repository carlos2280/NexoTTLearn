// Selector puro: CursoFichaRow -> CatalogoFichaResponse.
//
// Doc canonico: DOCUMENTOS/doc/v2/3-pantallas/participante/catalogo/ficha-curso-libre.md
//
// Reglas:
//   - hero.gradiente / hero.icono derivados del slug.
//   - descripcionCorta truncada a 160; fallback "Curso para {empresa}".
//   - descripcionLarga: el campo `Curso.descripcion` completo (sin truncar).
//   - objetivos: el schema MVP no los modela en columna dedicada -> null.
//     Cuando se agregue, este selector se actualiza sin tocar el contrato.
//   - hitos: derivados de pesos del curso (no de entidades aun no migradas).
//   - vistaCursoHref solo si yaInscritoActivo.

import type { CatalogoFichaResponse } from "@nexott-learn/shared-types"
import {
  descripcionCorta,
  gradienteParaCurso,
  iconoParaCurso,
} from "../mis-cursos/mis-cursos.types"
import type { CursoFichaRow } from "./catalogo.types"

export function construirFichaResponse(row: CursoFichaRow): CatalogoFichaResponse {
  return {
    hero: {
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
    },
    descripcionLarga: row.descripcion,
    objetivos: null,
    areasConModulos: row.areasConModulos.map((a) => ({
      areaId: a.areaId,
      nombre: a.nombre,
      colorHex: a.color,
      modulos: a.modulos.map((m) => ({
        id: m.id,
        titulo: m.titulo,
        orden: m.orden,
        cantidadSecciones: m.cantidadSecciones,
      })),
    })),
    hitos: {
      tieneTransversal: row.tieneTransversal,
      tieneEntrevistaIA: row.tieneEntrevistaIA,
    },
    yaInscrito: row.yaInscritoActivo,
    vistaCursoHref: row.yaInscritoActivo ? `/cursos/${row.slug}` : null,
  }
}
