import { CheckCheck, CircleDot, type LucideIcon, PenLine, ToggleRight } from "lucide-react"

export type TipoPreguntaQuiz =
  | "OPCION_UNICA"
  | "OPCION_MULTIPLE"
  | "VERDADERO_FALSO"
  | "RESPUESTA_CORTA"

export interface PreguntaOpcion {
  readonly id: string
  readonly texto: string
  readonly esCorrecta: boolean
}

export interface NormalizacionRespuestaCorta {
  readonly trim: boolean
  readonly ignorarMayusculas: boolean
  readonly ignorarAcentos: boolean
  readonly ignorarEspaciosDobles: boolean
}

interface PreguntaBase {
  readonly id: string
  readonly enunciado: string
  readonly pesoPunto: number
  readonly explicacion?: string
}

export interface PreguntaOpcionUnica extends PreguntaBase {
  readonly tipo: "OPCION_UNICA"
  readonly opciones: readonly PreguntaOpcion[]
}

export interface PreguntaOpcionMultiple extends PreguntaBase {
  readonly tipo: "OPCION_MULTIPLE"
  readonly opciones: readonly PreguntaOpcion[]
  readonly puntuacionParcial: boolean
}

export interface PreguntaVerdaderoFalso extends PreguntaBase {
  readonly tipo: "VERDADERO_FALSO"
  readonly correcta: boolean
}

export interface PreguntaRespuestaCorta extends PreguntaBase {
  readonly tipo: "RESPUESTA_CORTA"
  readonly respuestasAceptadas: readonly string[]
  readonly normalizacion: NormalizacionRespuestaCorta
}

export type PreguntaQuiz =
  | PreguntaOpcionUnica
  | PreguntaOpcionMultiple
  | PreguntaVerdaderoFalso
  | PreguntaRespuestaCorta

export interface TipoPreguntaMeta {
  readonly tipo: TipoPreguntaQuiz
  readonly etiqueta: string
  readonly descripcion: string
  readonly icono: LucideIcon
}

export const TIPOS_PREGUNTA_META: ReadonlyArray<TipoPreguntaMeta> = [
  {
    tipo: "OPCION_UNICA",
    etiqueta: "Opción única",
    descripcion: "Varias opciones, una sola correcta. Auto-corregido.",
    icono: CircleDot,
  },
  {
    tipo: "OPCION_MULTIPLE",
    etiqueta: "Opción múltiple",
    descripcion: "Varias opciones, una o más correctas. Auto-corregido.",
    icono: CheckCheck,
  },
  {
    tipo: "VERDADERO_FALSO",
    etiqueta: "Verdadero o falso",
    descripcion: "Una afirmación, dos respuestas. Auto-corregido.",
    icono: ToggleRight,
  },
  {
    tipo: "RESPUESTA_CORTA",
    etiqueta: "Respuesta corta",
    descripcion: "Texto libre comparado contra una lista de respuestas aceptadas.",
    icono: PenLine,
  },
]

export function metaDeTipo(tipo: TipoPreguntaQuiz): TipoPreguntaMeta {
  const encontrada = TIPOS_PREGUNTA_META.find((m) => m.tipo === tipo)
  if (!encontrada) {
    throw new Error(`Tipo de pregunta desconocido: ${tipo}`)
  }
  return encontrada
}

export function nuevoId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 12)
}

/**
 * Indica si la pregunta cumple las invariantes que el backend valida en
 * `contenidoQuizSchema.superRefine` y por `min/uuid/etc.`. Si no cumple, el
 * editor pinta el chip "Pendiente" en la cabecera (no es un error duro: el
 * autoguardado igual escribe y el participante no podrá pasar el quiz hasta
 * que el admin la complete).
 */
export function preguntaEstaCompleta(pregunta: PreguntaQuiz): boolean {
  if (pregunta.enunciado.trim().length === 0) {
    return false
  }
  switch (pregunta.tipo) {
    case "OPCION_UNICA": {
      const correctas = pregunta.opciones.filter((o) => o.esCorrecta).length
      return (
        pregunta.opciones.length >= 2 &&
        pregunta.opciones.every((o) => o.texto.trim().length > 0) &&
        correctas === 1
      )
    }
    case "OPCION_MULTIPLE": {
      const correctas = pregunta.opciones.filter((o) => o.esCorrecta).length
      return (
        pregunta.opciones.length >= 2 &&
        pregunta.opciones.every((o) => o.texto.trim().length > 0) &&
        correctas >= 1
      )
    }
    case "VERDADERO_FALSO":
      return typeof pregunta.correcta === "boolean"
    case "RESPUESTA_CORTA":
      return (
        pregunta.respuestasAceptadas.length >= 1 &&
        pregunta.respuestasAceptadas.every((r) => r.trim().length > 0)
      )
  }
}

const NORMALIZACION_POR_DEFECTO: NormalizacionRespuestaCorta = {
  trim: true,
  ignorarMayusculas: true,
  ignorarAcentos: true,
  ignorarEspaciosDobles: true,
}

/**
 * Crea una pregunta vacía válida según su tipo, lista para auto-guardar.
 * Cada shape cumple el contrato Zod del backend al primer guardado: el enunciado
 * y los textos placeholder son obvios para que el admin los reemplace.
 */
export function preguntaVacia(tipo: TipoPreguntaQuiz): PreguntaQuiz {
  const base = {
    id: nuevoId(),
    enunciado: "Nueva pregunta",
    pesoPunto: 1,
    explicacion: "",
  }
  switch (tipo) {
    case "OPCION_UNICA":
      return {
        ...base,
        tipo: "OPCION_UNICA",
        opciones: [
          { id: nuevoId(), texto: "Opción correcta", esCorrecta: true },
          { id: nuevoId(), texto: "Opción incorrecta", esCorrecta: false },
        ],
      }
    case "OPCION_MULTIPLE":
      return {
        ...base,
        tipo: "OPCION_MULTIPLE",
        opciones: [
          { id: nuevoId(), texto: "Opción correcta", esCorrecta: true },
          { id: nuevoId(), texto: "Otra opción correcta", esCorrecta: true },
          { id: nuevoId(), texto: "Opción incorrecta", esCorrecta: false },
        ],
        puntuacionParcial: false,
      }
    case "VERDADERO_FALSO":
      return {
        ...base,
        tipo: "VERDADERO_FALSO",
        correcta: true,
      }
    case "RESPUESTA_CORTA":
      return {
        ...base,
        tipo: "RESPUESTA_CORTA",
        respuestasAceptadas: ["Respuesta aceptada"],
        normalizacion: NORMALIZACION_POR_DEFECTO,
      }
  }
}

/**
 * Convierte una pregunta a otro tipo preservando lo común (enunciado, peso,
 * explicación). Lo específico se inicializa con valores razonables; cuando
 * encaja (opción única ↔ múltiple) se mantienen las opciones existentes.
 */
export function convertirTipo(pregunta: PreguntaQuiz, nuevoTipo: TipoPreguntaQuiz): PreguntaQuiz {
  if (pregunta.tipo === nuevoTipo) {
    return pregunta
  }
  const base = {
    id: pregunta.id,
    enunciado: pregunta.enunciado,
    pesoPunto: pregunta.pesoPunto,
    explicacion: pregunta.explicacion,
  }
  const opcionesPrevias =
    pregunta.tipo === "OPCION_UNICA" || pregunta.tipo === "OPCION_MULTIPLE"
      ? pregunta.opciones
      : null
  switch (nuevoTipo) {
    case "OPCION_UNICA": {
      const opciones = opcionesPrevias ?? [
        { id: nuevoId(), texto: "Opción correcta", esCorrecta: true },
        { id: nuevoId(), texto: "Opción incorrecta", esCorrecta: false },
      ]
      const correctaIdx = opciones.findIndex((o) => o.esCorrecta)
      const conUnaCorrecta = opciones.map((o, idx) => ({
        ...o,
        esCorrecta: idx === (correctaIdx >= 0 ? correctaIdx : 0),
      }))
      return { ...base, tipo: "OPCION_UNICA", opciones: conUnaCorrecta }
    }
    case "OPCION_MULTIPLE":
      return {
        ...base,
        tipo: "OPCION_MULTIPLE",
        opciones: opcionesPrevias ?? [
          { id: nuevoId(), texto: "Opción correcta", esCorrecta: true },
          { id: nuevoId(), texto: "Otra opción correcta", esCorrecta: true },
          { id: nuevoId(), texto: "Opción incorrecta", esCorrecta: false },
        ],
        puntuacionParcial: false,
      }
    case "VERDADERO_FALSO":
      return { ...base, tipo: "VERDADERO_FALSO", correcta: true }
    case "RESPUESTA_CORTA":
      return {
        ...base,
        tipo: "RESPUESTA_CORTA",
        respuestasAceptadas: ["Respuesta aceptada"],
        normalizacion: NORMALIZACION_POR_DEFECTO,
      }
  }
}
