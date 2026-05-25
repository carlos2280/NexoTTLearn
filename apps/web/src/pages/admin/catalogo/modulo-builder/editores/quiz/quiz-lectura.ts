import type { ConfigQuiz, SolucionVisible } from "./quiz-config"
import type { PreguntaQuiz } from "./quiz-tipos"

export interface BorradorQuiz {
  readonly config: ConfigQuiz
  readonly preguntas: readonly PreguntaQuiz[]
}

/**
 * Construye el borrador inicial del editor a partir del JSONB persistido en
 * `Bloque.contenido`. Tolerante con preguntas legacy (anteriores al
 * discriminated union por `tipo`): las completa con defaults para que el
 * editor pueda renderizarlas y el autoguardado emita un payload válido para
 * `contenidoQuizSchema`.
 */
export function leerInicial(contenido: Record<string, unknown> | null): BorradorQuiz {
  const intentosMax =
    contenido?.intentosMax === null
      ? null
      : typeof contenido?.intentosMax === "number"
        ? contenido.intentosMax
        : null
  const solucion: SolucionVisible =
    contenido?.solucionVisible === "tras_intento" ||
    contenido?.solucionVisible === "al_aprobar" ||
    contenido?.solucionVisible === "al_cerrar"
      ? (contenido.solucionVisible as SolucionVisible)
      : "al_aprobar"
  const ordenAleatorio =
    typeof contenido?.ordenAleatorio === "boolean" ? contenido.ordenAleatorio : false
  const notaMinima = typeof contenido?.notaMinima === "number" ? contenido.notaMinima : 60
  const preguntas: PreguntaQuiz[] = Array.isArray(contenido?.preguntas)
    ? (contenido.preguntas as Record<string, unknown>[])
        .map(adaptarPregunta)
        .filter((p): p is PreguntaQuiz => p !== null)
    : []
  return {
    config: { intentosMax, solucionVisible: solucion, ordenAleatorio, notaMinima },
    preguntas,
  }
}

function adaptarPregunta(p: Record<string, unknown>): PreguntaQuiz | null {
  const id = typeof p.id === "string" ? p.id : null
  if (id === null) {
    return null
  }
  const base = {
    id,
    enunciado: typeof p.enunciado === "string" ? p.enunciado : "",
    pesoPunto: typeof p.pesoPunto === "number" ? p.pesoPunto : 1,
    explicacion: typeof p.explicacion === "string" ? p.explicacion : "",
  }
  const tipo = p.tipo
  if (tipo === "VERDADERO_FALSO") {
    return { ...base, tipo, correcta: typeof p.correcta === "boolean" ? p.correcta : true }
  }
  if (tipo === "RESPUESTA_CORTA") {
    return construirRespuestaCorta(base, p)
  }
  const opciones = Array.isArray(p.opciones)
    ? (p.opciones as Record<string, unknown>[])
        .filter((o) => typeof o.id === "string")
        .map((o) => ({
          id: o.id as string,
          texto: typeof o.texto === "string" ? o.texto : "",
          esCorrecta: typeof o.esCorrecta === "boolean" ? o.esCorrecta : false,
        }))
    : []
  if (tipo === "OPCION_MULTIPLE") {
    return {
      ...base,
      tipo,
      opciones,
      puntuacionParcial: typeof p.puntuacionParcial === "boolean" ? p.puntuacionParcial : false,
    }
  }
  return { ...base, tipo: "OPCION_UNICA", opciones }
}

function construirRespuestaCorta(
  base: {
    readonly id: string
    readonly enunciado: string
    readonly pesoPunto: number
    readonly explicacion: string
  },
  p: Record<string, unknown>,
): PreguntaQuiz {
  const respuestas = Array.isArray(p.respuestasAceptadas)
    ? (p.respuestasAceptadas as unknown[]).filter((r): r is string => typeof r === "string")
    : []
  const norm = (p.normalizacion ?? {}) as Record<string, unknown>
  return {
    ...base,
    tipo: "RESPUESTA_CORTA",
    respuestasAceptadas: respuestas.length > 0 ? respuestas : ["Respuesta aceptada"],
    normalizacion: {
      trim: typeof norm.trim === "boolean" ? norm.trim : true,
      ignorarMayusculas:
        typeof norm.ignorarMayusculas === "boolean" ? norm.ignorarMayusculas : true,
      ignorarAcentos: typeof norm.ignorarAcentos === "boolean" ? norm.ignorarAcentos : true,
      ignorarEspaciosDobles:
        typeof norm.ignorarEspaciosDobles === "boolean" ? norm.ignorarEspaciosDobles : true,
    },
  }
}
