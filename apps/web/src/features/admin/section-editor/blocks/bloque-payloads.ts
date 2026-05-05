import {
  type EjemploCodigoContenido,
  type EjercicioContenido,
  type LecturaContenido,
  type RecursoContenido,
  type TestContenido,
  type VideoContenido,
  ejemploCodigoContenidoSchema,
  ejercicioContenidoSchema,
  lecturaContenidoSchema,
  recursoContenidoSchema,
  testContenidoSchema,
  videoContenidoSchema,
} from "@nexott-learn/shared-types"

export type LecturaPayload = LecturaContenido["contenido"]
export type VideoPayload = VideoContenido["contenido"]
export type RecursoPayload = RecursoContenido["contenido"]
export type EjemploCodigoPayload = EjemploCodigoContenido["contenido"]
export type EjercicioPayload = EjercicioContenido["contenido"]
export type TestPayload = TestContenido["contenido"]

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

export function defaultEjemploCodigoPayload(): EjemploCodigoPayload {
  return {
    explicacion: "",
    lenguaje: "javascript",
    codigo: "",
    esInteractivo: false,
    preguntasComprension: [],
  }
}

// Espejo exacto del default que aplica el back en defaults-by-tipo.ts para
// EJERCICIO. Mantener el orden de claves identico al back y al schema para
// que jsonEquals (sensible al orden) no produzca falsos positivos al cargar.
export function defaultEjercicioPayload(): EjercicioPayload {
  return {
    modo: "guiado",
    lenguaje: "javascript",
    archivosIniciales: [],
    tests: [],
    enunciado: "",
    solucionReferencia: "",
    pistas: [],
    restricciones: [],
    criteriosEvaluacion: [],
  }
}

// Espejo exacto del default que aplica el back en defaults-by-tipo.ts para
// TEST. F7 expone los 4 campos del schema (preguntas + 3 flags) en la UI.
export function defaultTestPayload(): TestPayload {
  return {
    preguntas: [],
    aleatorizar: false,
    mostrarResultadoInmediato: true,
    intentosPermitidos: 3,
  }
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

export function parseEjemploCodigoPayload(raw: unknown): EjemploCodigoPayload {
  const parsed = ejemploCodigoContenidoSchema.shape.contenido.safeParse(raw)
  if (parsed.success) {
    return parsed.data
  }
  // biome-ignore lint/nursery/noSecrets: mensaje de log en espanol, no es un secret
  console.warn("[BloqueEjemploCodigo] payload invalido, usando default", parsed.error)
  return defaultEjemploCodigoPayload()
}

export function parseEjercicioPayload(raw: unknown): EjercicioPayload {
  const parsed = ejercicioContenidoSchema.shape.contenido.safeParse(raw)
  if (parsed.success) {
    return parsed.data
  }
  console.warn("[BloqueEjercicio] payload invalido, usando default", parsed.error)
  return defaultEjercicioPayload()
}

export function parseTestPayload(raw: unknown): TestPayload {
  const parsed = testContenidoSchema.shape.contenido.safeParse(raw)
  if (parsed.success) {
    return parsed.data
  }
  console.warn("[BloqueTest] payload invalido, usando default", parsed.error)
  return defaultTestPayload()
}

// Equals profundo via JSON.stringify para los payloads de F5.B. Suficiente
// porque todos los payloads son objetos planos sin orden no-determinista y
// sin valores no-serializables. Evita meter una dep nueva como fast-deep-equal.
export function jsonEquals<T>(a: T, b: T): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}
