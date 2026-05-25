import { ConflictException } from "@nestjs/common"
import {
  RubricaSnapshotV1,
  SnapshotSeccionesBaseV1,
  TipoBloqueSnapshot,
  rubricaSnapshotV1Schema,
  snapshotSeccionesBaseV1Schema,
} from "@nexott-learn/shared-types"
import { Prisma } from "@prisma/client"
import { apiErrorCodes } from "../common/errors/api-error.codes"

const MAX_RESUMEN_LEN = 500

/**
 * Mapeo de tipos de bloque (enum Prisma) a tipo del snapshot (enum del
 * shared-types). Tipos no soportados se mapean a `CONTENIDO_TEXTO` para mantener
 * el shape valido sin romper la entrevista (la IA recibe el titulo + resumen
 * igual).
 */
function mapearTipoBloque(tipo: string): TipoBloqueSnapshot {
  switch (tipo) {
    case "TIP":
      return "TIPS"
    case "VIDEO":
      return "CONTENIDO_VIDEO"
    case "QUIZ":
      return "QUIZ"
    case "CODIGO_PREGUNTAS":
      return "CODIGO_PREGUNTAS"
    case "CODIGO_TESTS":
      return "CODIGO_TESTS"
    default:
      // PARRAFO, RECURSO, CODIGO_ILUSTRATIVO, futuros valores -> texto.
      return "CONTENIDO_TEXTO"
  }
}

export interface BloqueParaSnapshot {
  readonly id: string
  readonly tipo: string
  readonly contenido: Prisma.JsonValue
  readonly seccion: {
    readonly id: string
    readonly titulo: string
    readonly modulo: { readonly titulo: string }
    readonly skills: ReadonlyArray<{
      readonly skill: {
        readonly id: string
        readonly etiquetaVisible: string
        readonly areaId: string
      }
    }>
  }
}

export interface SeccionParaSnapshot {
  readonly id: string
  readonly titulo: string
  readonly modulo: { readonly titulo: string }
  readonly skills: ReadonlyArray<{
    readonly skill: {
      readonly id: string
      readonly etiquetaVisible: string
      readonly areaId: string
    }
  }>
  readonly bloques: ReadonlyArray<{
    readonly id: string
    readonly tipo: string
    readonly contenido: Prisma.JsonValue
  }>
}

/**
 * Construye `secciones_base_snapshot` (Zod v1 D-S8-D1) a partir de las secciones
 * recorridas por el colaborador. Trunca el resumen del bloque a 500 chars y
 * lanza 409 PLAN_VACIO_PARA_ENTREVISTA si el set de secciones esta vacio.
 */
export function construirSnapshotSeccionesBase(
  secciones: readonly SeccionParaSnapshot[],
): SnapshotSeccionesBaseV1 {
  if (secciones.length === 0) {
    throw new ConflictException({
      code: apiErrorCodes.planVacioParaEntrevista,
      message: "El colaborador aun no ha recorrido secciones del plan personal.",
    })
  }
  const payload: SnapshotSeccionesBaseV1 = {
    version: 1,
    secciones: secciones.map((s) => ({
      seccionId: s.id,
      titulo: s.titulo,
      moduloTitulo: s.modulo.titulo,
      skillsEnsenadas: s.skills.map((ss) => ({
        skillId: ss.skill.id,
        nombre: ss.skill.etiquetaVisible,
        areaId: ss.skill.areaId,
      })),
      bloques: s.bloques.map((b) => ({
        bloqueId: b.id,
        tipo: mapearTipoBloque(b.tipo),
        titulo: extraerTituloBloque(b.contenido),
        resumen: extraerResumenBloque(b.contenido),
      })),
    })),
  }
  // Defense in depth: validamos contra el schema canonico antes de devolver.
  const parsed = snapshotSeccionesBaseV1Schema.safeParse(payload)
  if (!parsed.success) {
    throw new ConflictException({
      code: apiErrorCodes.planVacioParaEntrevista,
      message: "El snapshot del plan personal es invalido.",
    })
  }
  return parsed.data
}

/**
 * Construye `rubrica_snapshot` (Zod v1) a partir de la rubrica vigente de la
 * entrevista IA. Lanza 409 RUBRICA_NO_CONFIGURADA si no hay areas declaradas.
 */
export function construirRubricaSnapshot(input: {
  readonly umbralAprobacion: number
  readonly filosofia: "PREPARACION" | "FILTRO"
  readonly profundidad: "JUNIOR" | "SEMI_SENIOR" | "SENIOR"
  readonly duracionMinutos: number
  readonly tono: "CONVERSACIONAL" | "FORMAL"
  readonly areas: ReadonlyArray<{ readonly areaId: string; readonly peso: number }>
}): RubricaSnapshotV1 {
  if (input.areas.length === 0) {
    throw new ConflictException({
      code: apiErrorCodes.rubricaNoConfigurada,
      message: "La entrevista IA no tiene rubrica configurada (sin areas).",
    })
  }
  const payload: RubricaSnapshotV1 = {
    version: 1,
    umbralAprobacion: input.umbralAprobacion,
    filosofia: input.filosofia,
    profundidad: input.profundidad,
    duracionMinutos: input.duracionMinutos,
    tono: input.tono,
    areas: input.areas.map((a) => ({ areaId: a.areaId, peso: a.peso })),
  }
  const parsed = rubricaSnapshotV1Schema.safeParse(payload)
  if (!parsed.success) {
    throw new ConflictException({
      code: apiErrorCodes.rubricaNoConfigurada,
      message: "Rubrica vigente con shape invalido.",
    })
  }
  return parsed.data
}

function extraerTituloBloque(contenido: Prisma.JsonValue): string {
  if (contenido !== null && typeof contenido === "object" && !Array.isArray(contenido)) {
    const obj = contenido as Record<string, unknown>
    const candidatos = ["titulo", "title", "encabezado", "nombre"]
    for (const k of candidatos) {
      const v = obj[k]
      if (typeof v === "string" && v.length > 0) {
        return v
      }
    }
  }
  return "Bloque sin titulo"
}

function extraerResumenBloque(contenido: Prisma.JsonValue): string {
  if (contenido === null || typeof contenido !== "object" || Array.isArray(contenido)) {
    return "Sin resumen"
  }
  const obj = contenido as Record<string, unknown>
  const candidatos = ["resumen", "summary", "descripcion", "texto", "enunciado"]
  for (const k of candidatos) {
    const v = obj[k]
    if (typeof v === "string" && v.length > 0) {
      return truncar(v)
    }
  }
  // Fallback: truncado del titulo si no hay resumen explicito.
  return truncar(extraerTituloBloque(contenido))
}

function truncar(s: string): string {
  if (s.length <= MAX_RESUMEN_LEN) {
    return s
  }
  return `${s.slice(0, MAX_RESUMEN_LEN - 3)}...`
}
