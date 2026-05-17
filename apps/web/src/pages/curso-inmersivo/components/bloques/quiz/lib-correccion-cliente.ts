import type { PreguntaQuiz } from "@nexott-learn/shared-types"
import type { UseQuizRespuestasResult } from "./use-quiz-respuestas"

const RGX_DIACRITICOS = /\p{M}/gu
const RGX_ESPACIOS_DOBLES = /\s+/g

function normalizar(valor: string): string {
  return valor
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(RGX_DIACRITICOS, "")
    .replace(RGX_ESPACIOS_DOBLES, " ")
}

function setsIguales(a: ReadonlySet<string>, b: ReadonlySet<string>): boolean {
  if (a.size !== b.size) {
    return false
  }
  for (const id of a) {
    if (!b.has(id)) {
      return false
    }
  }
  return true
}

/**
 * Decide localmente si la respuesta del usuario a una pregunta es correcta.
 * Espejo de la logica que vive en el server (handlers-intentos-bloque en
 * mock; modulo de auto-correccion en backend real). El cliente puede
 * recomputarlo gracias a que `opcion.esCorrecta`, `pregunta.correcta` y
 * `respuestasAceptadas` viajan en el contenido del bloque.
 *
 * Uso: cumplir 04 R6/R7 sin pedir backend nuevo — esconder marca verde y
 * explicacion en las preguntas que el participante ya acerto, dejando el
 * cierre pedagogico solo donde falto algo (manifiesto: "cumplido se desvanece").
 */
export function esPreguntaAcertada(
  pregunta: PreguntaQuiz,
  respuestas: UseQuizRespuestasResult,
): boolean {
  switch (pregunta.tipo) {
    case "OPCION_UNICA": {
      const correcta = pregunta.opciones.find((o) => o.esCorrecta)
      return Boolean(correcta && correcta.id === respuestas.opcionUnica(pregunta.id))
    }
    case "OPCION_MULTIPLE": {
      const correctas = new Set(pregunta.opciones.filter((o) => o.esCorrecta).map((o) => o.id))
      const elegidas = new Set(respuestas.opcionMultiple(pregunta.id))
      return setsIguales(correctas, elegidas)
    }
    case "VERDADERO_FALSO":
      return respuestas.vf(pregunta.id) === pregunta.correcta
    case "RESPUESTA_CORTA": {
      const texto = normalizar(respuestas.texto(pregunta.id))
      if (texto.length === 0) {
        return false
      }
      return pregunta.respuestasAceptadas.some((r) => normalizar(r) === texto)
    }
    default:
      return false
  }
}
