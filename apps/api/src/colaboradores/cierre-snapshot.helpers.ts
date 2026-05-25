import type { EtiquetaCualitativa } from "@nexott-learn/shared-types"
import { z } from "zod"

/**
 * Helpers compartidos para interpretar el `CursoFotografiaCierre.snapshot`
 * desde el lado del participante. Centraliza:
 *   - schema Zod del snapshot (fuente unica para validar el JSONB opaco que
 *     viene de Prisma; reemplaza los type-guards manuales que vivian en
 *     `me-resumen-cierre.service.ts` y `me-avance.service.ts`),
 *   - umbrales cualitativos finales,
 *   - mapeo nota -> EtiquetaCualitativa,
 *   - resolucion de `notaGlobalFinal` con fallback para snapshots legacy
 *     (DEUDA-B26-1: snapshots construidos antes del fix no la persisten).
 *
 * Es la fuente unica para `me-resumen-cierre.service.ts` (ceremonia de
 * cierre) y `me-avance.service.ts` (lectura activa). Sin este helper, ambos
 * lados divergian: resumen-cierre aplicaba fallback, /me/avance no — el
 * participante veia su curso CERRADO sin nota ni etiqueta (BUG-QA-2).
 */

/** Umbrales cap. 9.1 para la etiqueta cualitativa final del curso. */
export const UMBRAL_EXCELENCIA_FINAL = 85
export const UMBRAL_SOLIDO_FINAL = 70
export const UMBRAL_DESARROLLO_FINAL = 50

// --- Schema Zod del snapshot -------------------------------------------------

/**
 * Una nota por skill dentro del snapshot del cierre. `caracter` es opcional
 * para soportar snapshots legacy anteriores a DEUDA-B26-1 que no lo persistian.
 * `passthrough` para no perder campos extra del snapshot real.
 */
const notaSkillSnapshotSchema = z
  .object({
    skillId: z.string(),
    notaActual: z.number().nullable(),
    umbralCumple: z.number(),
    caracter: z.enum(["OBLIGATORIA", "OPCIONAL"]).optional(),
  })
  .passthrough()

const asignacionSnapshotSchema = z
  .object({
    asignacionId: z.string(),
    resultadoFinal: z.string().nullable().optional(),
    notaGlobalFinal: z.number().optional(),
    // Defensivo: snapshots legacy pueden no traer `notasPorSkill`.
    // `default([])` deja al helper `resolverNotaGlobalFinal` decidir (devuelve
    // null si no hay notas inferibles).
    notasPorSkill: z.array(notaSkillSnapshotSchema).default([]),
  })
  .passthrough()

const skillExigidaSnapshotSchema = z.object({ skillId: z.string() }).passthrough()

export const cierreSnapshotSchema = z
  .object({
    curso: z
      .object({
        titulo: z.string(),
        configuracion: z
          .object({
            skillsExigidas: z.array(skillExigidaSnapshotSchema),
          })
          .passthrough(),
      })
      .passthrough(),
    asignaciones: z.array(asignacionSnapshotSchema),
  })
  .passthrough()

/**
 * Variante minima usada por `/me/avance`: solo necesita la lista de
 * asignaciones. Asi /avance no falla si el snapshot tiene huecos en la
 * configuracion del curso (que la ceremonia de cierre si exige).
 */
export const cierreSnapshotMinimoSchema = z
  .object({
    asignaciones: z.array(asignacionSnapshotSchema),
  })
  .passthrough()

export type CierreSnapshot = z.infer<typeof cierreSnapshotSchema>
export type CierreSnapshotMinimo = z.infer<typeof cierreSnapshotMinimoSchema>
export type AsignacionSnapshotCierre = z.infer<typeof asignacionSnapshotSchema>
export type NotaSkillSnapshotCierre = z.infer<typeof notaSkillSnapshotSchema>

export function parseCierreSnapshot(value: unknown): CierreSnapshot | null {
  const result = cierreSnapshotSchema.safeParse(value)
  return result.success ? result.data : null
}

export function parseCierreSnapshotMinimo(value: unknown): CierreSnapshotMinimo | null {
  const result = cierreSnapshotMinimoSchema.safeParse(value)
  return result.success ? result.data : null
}

// --- Resolucion de la nota global final --------------------------------------

/**
 * Resuelve la nota global final de una asignacion en el snapshot de cierre.
 *
 * - Camino principal (snapshots post DEUDA-B26-1): `fila.notaGlobalFinal`
 *   viene persistida. Fuente de verdad inmutable del veredicto.
 * - Fallback (snapshots legacy que no la persistian): promedio simple de
 *   notas OBLIGATORIAS con `notaActual !== null`. Si el snapshot tampoco
 *   tiene `caracter` por nota, cae a todas las notas no nulas.
 * - Cuando NO hay notas validas devuelve `null`. Cada call site decide
 *   como reaccionar (resumen-cierre cae a 0/noCumple; /me/avance omite los
 *   campos `notaGlobalFinal`/`etiquetaCualitativaFinal` del response).
 */
export function resolverNotaGlobalFinal(fila: AsignacionSnapshotCierre): number | null {
  if (typeof fila.notaGlobalFinal === "number") {
    return fila.notaGlobalFinal
  }
  const conCaracter = fila.notasPorSkill.some((n) => n.caracter !== undefined)
  const elegibles = conCaracter
    ? fila.notasPorSkill.filter((n) => n.caracter === "OBLIGATORIA")
    : fila.notasPorSkill
  const valores = elegibles.map((n) => n.notaActual).filter((n): n is number => n !== null)
  if (valores.length === 0) {
    return null
  }
  const suma = valores.reduce((acc, n) => acc + n, 0)
  return Math.round(suma / valores.length)
}

export function etiquetaCualitativaPorNota(nota: number): EtiquetaCualitativa {
  if (nota >= UMBRAL_EXCELENCIA_FINAL) {
    return "excelencia"
  }
  if (nota >= UMBRAL_SOLIDO_FINAL) {
    return "solido"
  }
  if (nota >= UMBRAL_DESARROLLO_FINAL) {
    return "enDesarrollo"
  }
  return "noCumple"
}
