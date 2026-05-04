import {
  type LecturaContenido,
  type RecursoContenido,
  type VideoContenido,
  lecturaContenidoSchema,
  recursoContenidoSchema,
  videoContenidoSchema,
} from "@nexott-learn/shared-types"

export type LecturaPayload = LecturaContenido["contenido"]
export type VideoPayload = VideoContenido["contenido"]
export type RecursoPayload = RecursoContenido["contenido"]

// Defaults espejo de los que aplica el back en getDefaultsByTipo cuando crea
// un bloque sin payload. Se usan como fallback cuando el contenido viene
// corrupto desde BD (no deberia pasar, pero el endpoint lo declara unknown).

export function defaultLecturaPayload(): LecturaPayload {
  return { cuerpo: "" }
}

export function defaultVideoPayload(): VideoPayload {
  return { url: "", proveedor: "youtube" }
}

export function defaultRecursoPayload(): RecursoPayload {
  return { tipoRecurso: "link", url: "" }
}

// Parsea el campo `contenido` (unknown desde back) con el schema del tipo y
// cae al default si la forma no es la esperada. console.warn — el admin no
// necesita un toast por un payload legacy.
export function parseLecturaPayload(raw: unknown): LecturaPayload {
  const parsed = lecturaContenidoSchema.shape.contenido.safeParse(raw)
  if (parsed.success) {
    return parsed.data
  }
  console.warn("[BloqueLectura] payload invalido, usando default", parsed.error)
  return defaultLecturaPayload()
}

export function parseVideoPayload(raw: unknown): VideoPayload {
  const parsed = videoContenidoSchema.shape.contenido.safeParse(raw)
  if (parsed.success) {
    return parsed.data
  }
  console.warn("[BloqueVideo] payload invalido, usando default", parsed.error)
  return defaultVideoPayload()
}

export function parseRecursoPayload(raw: unknown): RecursoPayload {
  const parsed = recursoContenidoSchema.shape.contenido.safeParse(raw)
  if (parsed.success) {
    return parsed.data
  }
  console.warn("[BloqueRecurso] payload invalido, usando default", parsed.error)
  return defaultRecursoPayload()
}

// Equals profundo via JSON.stringify para los payloads de F5.B. Suficiente
// porque todos los payloads son objetos planos sin orden no-determinista y
// sin valores no-serializables. Evita meter una dep nueva como fast-deep-equal.
export function jsonEquals<T>(a: T, b: T): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}
