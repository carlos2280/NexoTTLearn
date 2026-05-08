// Tipos internos del feature `catalogo` (cursos libres autoinscribibles).
//
// Doc canonico: DOCUMENTOS/doc/v2/3-pantallas/participante/catalogo/

import type { CatalogoDuracionBanda } from "@nexott-learn/shared-types"

export interface AreaResumenRow {
  readonly id: string
  readonly nombre: string
  /** color HEX del area. */
  readonly color: string
}

export interface CursoCatalogoRow {
  readonly id: string
  readonly slug: string
  readonly titulo: string
  readonly descripcion: string | null
  readonly empresaCliente: string
  readonly duracionEstimada: string | null
  /** Total de modulos no archivados. */
  readonly totalModulos: number
  /** Area principal (la del primer modulo por orden). null si no hay modulos. */
  readonly areaPrincipal: AreaResumenRow | null
}

export interface CursoFichaRow extends CursoCatalogoRow {
  /** Area + sus modulos asignados al curso, ordenadas por CursoArea.orden. */
  readonly areasConModulos: ReadonlyArray<{
    readonly areaId: string
    readonly nombre: string
    readonly color: string
    readonly modulos: ReadonlyArray<{
      readonly id: string
      readonly titulo: string
      readonly orden: number
      readonly cantidadSecciones: number
    }>
  }>
  /** True si hay Proyecto Transversal activo (peso > 0). */
  readonly tieneTransversal: boolean
  /** True si hay Entrevista IA activa (peso > 0). */
  readonly tieneEntrevistaIA: boolean
  /** True si el participante tiene una Inscripcion ACTIVA en este curso. */
  readonly yaInscritoActivo: boolean
}

/**
 * Convierte el texto libre `Curso.duracionEstimada` en una banda. Heuristica
 * MVP: extrae el primer numero del texto y aplica los rangos de §3 vitrina.md
 * ("Menos de 5h / 5-15h / Mas de 15h"). Si el texto contiene "dia" o "dias",
 * se asume jornada de 8h y se multiplica.
 *
 * Si no se puede inferir → null (queda fuera del filtro por duracion).
 */
export function bandaDuracion(texto: string | null): CatalogoDuracionBanda | null {
  if (!texto) {
    return null
  }
  const match = texto.match(/(\d+(?:[.,]\d+)?)/)
  const numero = match?.[1]
  if (!numero) {
    return null
  }
  const valor = Number.parseFloat(numero.replace(",", "."))
  if (Number.isNaN(valor) || valor <= 0) {
    return null
  }
  const horas = /d[ií]as?/i.test(texto) ? valor * 8 : valor
  if (horas < 5) {
    return "CORTA"
  }
  if (horas <= 15) {
    return "MEDIA"
  }
  return "LARGA"
}
