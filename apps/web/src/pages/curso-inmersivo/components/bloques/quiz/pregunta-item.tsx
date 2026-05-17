import { sanitizarHtml } from "@/shared/lib/sanitize-html"
import type { PreguntaQuiz } from "@nexott-learn/shared-types"
import { QuizPreguntaOpcionMultiple } from "./quiz-pregunta-opcion-multiple"
import { QuizPreguntaOpcionUnica } from "./quiz-pregunta-opcion-unica"
import { QuizPreguntaRespuestaCorta } from "./quiz-pregunta-respuesta-corta"
import { QuizPreguntaVerdaderoFalso } from "./quiz-pregunta-verdadero-falso"
import type { UseQuizRespuestasResult } from "./use-quiz-respuestas"

interface PreguntaItemProps {
  readonly numero: number
  readonly pregunta: PreguntaQuiz
  readonly respuestas: UseQuizRespuestasResult
  readonly bloqueado: boolean
  readonly mostrarSolucion: boolean
}

export function PreguntaItem({
  numero,
  pregunta,
  respuestas,
  bloqueado,
  mostrarSolucion,
}: PreguntaItemProps) {
  return (
    <li className="flex flex-col gap-3">
      <div className="flex items-baseline gap-3">
        <span className="tabular shrink-0 font-mono font-semibold text-caption text-text-tertiary">
          {String(numero).padStart(2, "0")}
        </span>
        <p className="text-body text-text-primary">{pregunta.enunciado}</p>
      </div>
      <ContenidoPregunta
        pregunta={pregunta}
        respuestas={respuestas}
        bloqueado={bloqueado}
        mostrarSolucion={mostrarSolucion}
      />
      {mostrarSolucion && pregunta.explicacion ? (
        <aside className="flex flex-col gap-1.5 rounded-xl border border-border bg-subtle p-3">
          <span className="nx-eyebrow text-text-tertiary">Por qué esto es correcto</span>
          <div
            className="text-body-sm text-text-secondary"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: explicación del admin, sanitizada.
            dangerouslySetInnerHTML={{ __html: sanitizarHtml(pregunta.explicacion) }}
          />
        </aside>
      ) : null}
    </li>
  )
}

interface ContenidoPreguntaProps {
  readonly pregunta: PreguntaQuiz
  readonly respuestas: UseQuizRespuestasResult
  readonly bloqueado: boolean
  readonly mostrarSolucion: boolean
}

function ContenidoPregunta({
  pregunta,
  respuestas,
  bloqueado,
  mostrarSolucion,
}: ContenidoPreguntaProps) {
  switch (pregunta.tipo) {
    case "OPCION_UNICA":
      return (
        <QuizPreguntaOpcionUnica
          pregunta={pregunta}
          opcionElegidaId={respuestas.opcionUnica(pregunta.id)}
          onCambiar={(opcionId) => respuestas.setOpcionUnica(pregunta.id, opcionId)}
          bloqueado={bloqueado}
          opcionCorrectaId={pregunta.opciones.find((o) => o.esCorrecta)?.id ?? null}
          mostrarSolucion={mostrarSolucion}
        />
      )
    case "OPCION_MULTIPLE":
      return (
        <QuizPreguntaOpcionMultiple
          pregunta={pregunta}
          opcionesElegidasIds={respuestas.opcionMultiple(pregunta.id)}
          onToggle={(opcionId) => respuestas.toggleOpcionMultiple(pregunta.id, opcionId)}
          bloqueado={bloqueado}
          opcionesCorrectasIds={pregunta.opciones.filter((o) => o.esCorrecta).map((o) => o.id)}
          mostrarSolucion={mostrarSolucion}
        />
      )
    case "VERDADERO_FALSO":
      return (
        <QuizPreguntaVerdaderoFalso
          pregunta={pregunta}
          valor={respuestas.vf(pregunta.id)}
          onCambiar={(valor) => respuestas.setVerdaderoFalso(pregunta.id, valor)}
          bloqueado={bloqueado}
          mostrarSolucion={mostrarSolucion}
        />
      )
    case "RESPUESTA_CORTA":
      return (
        <QuizPreguntaRespuestaCorta
          pregunta={pregunta}
          texto={respuestas.texto(pregunta.id)}
          onCambiar={(texto) => respuestas.setTexto(pregunta.id, texto)}
          bloqueado={bloqueado}
          mostrarSolucion={mostrarSolucion}
        />
      )
    default: {
      const _exhaustivo: never = pregunta
      throw new Error(`Pregunta no manejada: ${JSON.stringify(_exhaustivo)}`)
    }
  }
}
