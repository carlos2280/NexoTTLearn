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
 *
 * `fechaUltimoCambio` es ISO-8601 cuando la skill tiene `NotaSkill`, `null`
 * cuando aun no hay evidencia. Usa `NotaSkill.updatedAt` directamente (el
 * modelo solo guarda `notaActual` y `origenActual`, asi que cualquier
 * mutacion equivale a un cambio de nota).
 */
export interface FichaSkillItem {
  readonly skillId: string
  readonly etiquetaVisible: string
  readonly areaId: string
  readonly areaNombre: string
  readonly notaActual: number | null
  readonly origenActual: Record<string, unknown> | null
  readonly fechaUltimoCambio: string | null
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
  /**
   * Derivado por el backend desde `promedio` y `skillsConNota` con la escala
   * canonica (`nivel-cualitativo.helpers.ts`). `sinTocar` cuando el area no
   * tiene ninguna skill con nota; en caso contrario se clasifica por promedio.
   */
  readonly nivelCualitativo: NivelCualitativoArea
  /**
   * Catalogo completo de skills del area (incluyendo las que el colaborador
   * aun no ha demostrado). Usado por la seccion "Por explorar" del acordeon
   * en la pantalla "Mi ficha".
   */
  readonly skillsCatalogo: readonly FichaSkillCatalogoItem[]
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
 * El endpoint acepta `limite` (default 100); la paginacion cursor real
 * sigue como deuda (`DEUDA-B24-2` en el inventario). El frontend pagina en
 * memoria de 5 en 5, suficiente para colaboradores reales.
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
      /**
       * Tipo de evento que demostro la skill (TRANSVERSAL, ENTREVISTA_IA,
       * BLOQUE, MANUAL, ENTREVISTA_INICIAL). El frontend lo usa para enchufar
       * acciones contextuales — p.ej. abrir el drawer "Releer la entrevista"
       * cuando es ENTREVISTA_IA y `referenciaIntentoIaId` esta presente.
       */
      readonly origen: OrigenNotaSkill
      /**
       * ID del intento de entrevista IA cuando `origen === "ENTREVISTA_IA"`.
       * Permite abrir el drawer "Releer la entrevista" desde el timeline de
       * /mi-ficha sin un round-trip extra.
       */
      readonly referenciaIntentoIaId?: string
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
