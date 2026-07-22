import type { RespuestaPregunta, RespuestasIntento } from "@nexott-learn/shared-types"
import type { UseQuizRespuestasResult } from "./use-quiz-respuestas"

/**
 * Adaptador de SOLO LECTURA: expone las respuestas guardadas de un intento como
 * un `UseQuizRespuestasResult` para reusar el render de <PreguntaItem> en modo
 * revision (P13). Los setters son no-op — los inputs se pintan `bloqueado`, solo
 * se consultan los getters. Puro y testeable.
 *
 * Si `respuestas` no es de tipo QUIZ (o es `undefined`), devuelve un adaptador
 * vacio: la vista cae al modo interactivo normal.
 */
export function construirRespuestasRevision(
  respuestas: RespuestasIntento | undefined,
): UseQuizRespuestasResult {
  const mapa = new Map<string, RespuestaPregunta>()
  if (respuestas?.tipo === "QUIZ") {
    for (const r of respuestas.preguntas) {
      mapa.set(r.preguntaId, r)
    }
  }
  const noop = (): void => {
    /* solo lectura: en revisión los inputs van bloqueados, nada que escribir */
  }
  return {
    opcionUnica: (id) => {
      const r = mapa.get(id)
      return r?.tipo === "OPCION_UNICA" ? r.opcionElegidaId : null
    },
    opcionMultiple: (id) => {
      const r = mapa.get(id)
      return r?.tipo === "OPCION_MULTIPLE" ? r.opcionesElegidasIds : []
    },
    vf: (id) => {
      const r = mapa.get(id)
      return r?.tipo === "VERDADERO_FALSO" ? r.valor : null
    },
    texto: (id) => {
      const r = mapa.get(id)
      return r?.tipo === "RESPUESTA_CORTA" ? r.texto : ""
    },
    setOpcionUnica: noop,
    toggleOpcionMultiple: noop,
    setVerdaderoFalso: noop,
    setTexto: noop,
    construirEnvio: () => [],
    contestadas: mapa.size,
    limpiar: noop,
  }
}
