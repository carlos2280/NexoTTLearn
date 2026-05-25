import type { ContenidoQuiz, PreguntaQuiz, RespuestaPregunta } from "@nexott-learn/shared-types"
import { useCallback, useMemo, useState } from "react"

/**
 * Estado local del quiz: respuestas indexadas por `preguntaId`. Vive en
 * memoria mientras el participante completa el quiz; el server es la fuente
 * de verdad de la nota final, no este estado.
 */
export interface UseQuizRespuestasResult {
  readonly opcionUnica: (preguntaId: string) => string | null
  readonly opcionMultiple: (preguntaId: string) => readonly string[]
  readonly vf: (preguntaId: string) => boolean | null
  readonly texto: (preguntaId: string) => string
  readonly setOpcionUnica: (preguntaId: string, opcionId: string) => void
  readonly toggleOpcionMultiple: (preguntaId: string, opcionId: string) => void
  readonly setVerdaderoFalso: (preguntaId: string, valor: boolean) => void
  readonly setTexto: (preguntaId: string, texto: string) => void
  readonly construirEnvio: (preguntas: readonly PreguntaQuiz[]) => readonly RespuestaPregunta[]
  readonly contestadas: number
  readonly limpiar: () => void
}

type Estado = ReadonlyMap<string, RespuestaPregunta>

function reemplazar(estado: Estado, respuesta: RespuestaPregunta): Estado {
  const next = new Map(estado)
  next.set(respuesta.preguntaId, respuesta)
  return next
}

export function useQuizRespuestas(_contenido: ContenidoQuiz): UseQuizRespuestasResult {
  const [estado, setEstado] = useState<Estado>(new Map())

  const opcionUnica = useCallback(
    (preguntaId: string): string | null => {
      const r = estado.get(preguntaId)
      return r?.tipo === "OPCION_UNICA" ? r.opcionElegidaId : null
    },
    [estado],
  )
  const opcionMultiple = useCallback(
    (preguntaId: string): readonly string[] => {
      const r = estado.get(preguntaId)
      return r?.tipo === "OPCION_MULTIPLE" ? r.opcionesElegidasIds : []
    },
    [estado],
  )
  const vf = useCallback(
    (preguntaId: string): boolean | null => {
      const r = estado.get(preguntaId)
      return r?.tipo === "VERDADERO_FALSO" ? r.valor : null
    },
    [estado],
  )
  const texto = useCallback(
    (preguntaId: string): string => {
      const r = estado.get(preguntaId)
      return r?.tipo === "RESPUESTA_CORTA" ? r.texto : ""
    },
    [estado],
  )

  const setOpcionUnica = useCallback((preguntaId: string, opcionId: string): void => {
    setEstado((prev) =>
      reemplazar(prev, { preguntaId, tipo: "OPCION_UNICA", opcionElegidaId: opcionId }),
    )
  }, [])

  const toggleOpcionMultiple = useCallback((preguntaId: string, opcionId: string): void => {
    setEstado((prev) => {
      const r = prev.get(preguntaId)
      const actual = r?.tipo === "OPCION_MULTIPLE" ? r.opcionesElegidasIds : []
      const next = actual.includes(opcionId)
        ? actual.filter((id) => id !== opcionId)
        : [...actual, opcionId]
      return reemplazar(prev, { preguntaId, tipo: "OPCION_MULTIPLE", opcionesElegidasIds: next })
    })
  }, [])

  const setVerdaderoFalso = useCallback((preguntaId: string, valor: boolean): void => {
    setEstado((prev) => reemplazar(prev, { preguntaId, tipo: "VERDADERO_FALSO", valor }))
  }, [])

  const setTexto = useCallback((preguntaId: string, valor: string): void => {
    setEstado((prev) => reemplazar(prev, { preguntaId, tipo: "RESPUESTA_CORTA", texto: valor }))
  }, [])

  const limpiar = useCallback((): void => {
    setEstado(new Map())
  }, [])

  const construirEnvio = useCallback(
    (preguntas: readonly PreguntaQuiz[]): readonly RespuestaPregunta[] => {
      return preguntas.map((pregunta) => {
        const existente = estado.get(pregunta.id)
        if (existente) {
          return existente
        }
        return defaultRespuestaPara(pregunta)
      })
    },
    [estado],
  )

  const contestadas = useMemo(() => estado.size, [estado])

  return {
    opcionUnica,
    opcionMultiple,
    vf,
    texto,
    setOpcionUnica,
    toggleOpcionMultiple,
    setVerdaderoFalso,
    setTexto,
    construirEnvio,
    contestadas,
    limpiar,
  }
}

function defaultRespuestaPara(pregunta: PreguntaQuiz): RespuestaPregunta {
  switch (pregunta.tipo) {
    case "OPCION_UNICA":
      return { preguntaId: pregunta.id, tipo: "OPCION_UNICA", opcionElegidaId: "" }
    case "OPCION_MULTIPLE":
      return { preguntaId: pregunta.id, tipo: "OPCION_MULTIPLE", opcionesElegidasIds: [] }
    case "VERDADERO_FALSO":
      return { preguntaId: pregunta.id, tipo: "VERDADERO_FALSO", valor: false }
    case "RESPUESTA_CORTA":
      return { preguntaId: pregunta.id, tipo: "RESPUESTA_CORTA", texto: "" }
    default: {
      const _exhaustivo: never = pregunta
      throw new Error(`Pregunta no manejada: ${JSON.stringify(_exhaustivo)}`)
    }
  }
}
