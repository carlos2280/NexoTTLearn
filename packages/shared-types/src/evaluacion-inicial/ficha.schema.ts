import { z } from "zod"

/**
 * Replica del enum Prisma `OrigenNotaSkill`. Mantener sincronizado.
 */
export const origenNotaSkillSchema = z.enum([
  "ENTREVISTA_INICIAL",
  "BLOQUE",
  "TRANSVERSAL",
  "ENTREVISTA_IA",
  "MANUAL",
])
export type OrigenNotaSkill = z.infer<typeof origenNotaSkillSchema>

/**
 * Item de la ficha por skill (`GET /colaboradores/:id/ficha`).
 *
 * `notaActual` puede ser `null` (sin evidencia) y nunca debe confundirse con
 * `0`. Igual aplica a `origenActual`. `etiquetaCualitativa` se omite por ahora:
 * los umbrales viven a nivel de curso (`Curso.umbralesLogro`) y la ficha es
 * global, sin contexto de curso. La etiqueta se reintroducira en S11/S12
 * cuando se vincule la ficha al avance por curso.
 */
export interface FichaSkillItem {
  readonly skillId: string
  readonly etiquetaVisible: string
  readonly areaId: string
  readonly areaNombre: string
  readonly notaActual: number | null
  readonly origenActual: Record<string, unknown> | null
  // TODO B-23: backend debe devolver la fecha del ultimo cambio de nota por
  // skill para la pantalla "Mi ficha" (hero "Ultima habilidad" + drill-down).
  readonly fechaUltimoCambio?: string | null
}

/**
 * Nivel cualitativo de un area en la ficha del colaborador. El backend lo
 * deriva del promedio y/o de la distribucion de notas de las skills del area;
 * el frontend nunca calcula esto desde notas crudas en produccion. La etiqueta
 * `sinTocar` indica que el colaborador no tiene ninguna skill demostrada en
 * esa area, pero el area sigue presente en el catalogo.
 */
export type NivelCualitativoArea = "excelencia" | "solido" | "enDesarrollo" | "inicial" | "sinTocar"

/**
 * Skill del catalogo del area (demostrada o no), usada en la pantalla
 * "Mi ficha" para listar las habilidades "Por explorar" dentro de cada area.
 */
export interface FichaSkillCatalogoItem {
  readonly skillId: string
  readonly etiquetaVisible: string
}

export interface FichaPorAreaItem {
  readonly areaId: string
  readonly nombre: string
  readonly promedio: number | null
  readonly skillsConNota: number
  readonly skillsTotales: number
  // TODO B-21: backend debe devolver el nivel cualitativo por area (derivado
  // del promedio y la distribucion de notas), para que el frontend no infiera
  // desde umbrales locales en la pantalla "Mi ficha".
  readonly nivelCualitativo?: NivelCualitativoArea
  // TODO B-22: backend debe devolver el catalogo completo de skills del area
  // (incluso las que el colaborador aun no ha demostrado), para la seccion
  // "Por explorar" del acordeon en la pantalla "Mi ficha".
  readonly skillsCatalogo?: readonly FichaSkillCatalogoItem[]
}

export interface FichaResponse {
  readonly colaboradorId: string
  readonly skills: readonly FichaSkillItem[]
  readonly porArea: readonly FichaPorAreaItem[]
}

/**
 * Evento agregado del historial cronologico del colaborador (`GET
 * /me/ficha/historial`). Union discriminada por `tipo`. El backend agrega
 * cambios de skill + hitos de curso en una sola vista ordenada por fecha.
 *
 * TODO B-24: backend debe implementar este endpoint con paginacion (cursor
 * o `?limite=N&desde=...`). El mock devuelve la coleccion completa y el
 * frontend pagina en memoria hasta que B-24 este listo.
 */
export type EventoHistorialFicha =
  | {
      readonly tipo: "SKILL_DEMOSTRADA"
      readonly id: string
      readonly fecha: string
      readonly skillId: string
      readonly skillNombre: string
      readonly areaId: string
      readonly areaNombre: string
      readonly nivelCualitativo: NivelCualitativoArea
      readonly origenNarrativo: string
    }
  | {
      readonly tipo: "CURSO_INICIADO"
      readonly id: string
      readonly fecha: string
      readonly cursoId: string
      readonly cursoTitulo: string
    }
  | {
      readonly tipo: "CURSO_COMPLETADO"
      readonly id: string
      readonly fecha: string
      readonly cursoId: string
      readonly cursoTitulo: string
    }

/**
 * Entrada del historico de una skill especifica. Append-only desde
 * `historico_notas_skill`. `valor` puede ser null para representar la marca
 * "sin evidencia" cuando una edicion manual reseteo la nota.
 */
export interface EntradaHistoricoNotaSkill {
  readonly id: string
  readonly fecha: string
  readonly valor: number | null
  readonly origen: OrigenNotaSkill
  readonly referencia: Record<string, unknown> | null
  readonly autorUsuarioId: string | null
}
