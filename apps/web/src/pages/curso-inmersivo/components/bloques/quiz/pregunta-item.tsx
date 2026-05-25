import { sanitizarHtml } from "@/shared/lib/sanitize-html"
import type { PreguntaQuiz } from "@nexott-learn/shared-types"
import { Check, X } from "lucide-react"
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
  /** Controlado por `solucionVisible` del quiz: revela respuestas correctas + explicación. */
  readonly verSolucion: boolean
  /**
   * Ids de preguntas falladas en el último intento (server). `undefined` ⇒ aún
   * no se envió ningún intento; los componentes se renderizan en modo "edición".
   */
  readonly preguntasFalladas?: ReadonlySet<string>
}

export function PreguntaItem({
  numero,
  pregunta,
  respuestas,
  bloqueado,
  verSolucion,
  preguntasFalladas,
}: PreguntaItemProps) {
  // Feedback acierto/fallo SIEMPRE tras intento (independiente de verSolucion).
  // Saber si acerté es derecho mínimo del participante; revelar la respuesta
  // correcta depende del modo `solucionVisible` configurado por el admin.
  const hayIntento = preguntasFalladas !== undefined
  const acertada: boolean | null = hayIntento ? !preguntasFalladas.has(pregunta.id) : null
  // Explicación solo cuando se revela la solución Y la falló (en aciertos el
  // "por qué" sería ruido: ya lo sabes).
  const verExplicacion = verSolucion && acertada === false

  return (
    <li className="flex flex-col gap-3">
      <div className="flex items-baseline gap-3">
        <span className="tabular shrink-0 font-mono font-semibold text-caption text-text-tertiary">
          {String(numero).padStart(2, "0")}
        </span>
        <div
          className="flex-1 text-body text-text-primary [&_code]:rounded [&_code]:bg-subtle [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-body-sm"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: enunciado del admin, sanitizado.
          dangerouslySetInnerHTML={{ __html: sanitizarHtml(pregunta.enunciado) }}
        />
        {acertada !== null ? <BadgeAcierto acertada={acertada} /> : null}
      </div>
      <ContenidoPregunta
        pregunta={pregunta}
        respuestas={respuestas}
        bloqueado={bloqueado}
        acertada={acertada}
        verSolucion={verSolucion}
      />
      {verExplicacion && pregunta.explicacion ? (
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

function BadgeAcierto({ acertada }: { readonly acertada: boolean }) {
  if (acertada) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-pill border border-success/30 bg-success-soft px-2 py-0.5 font-mono text-[10px] text-success-on-soft uppercase tracking-wider">
        <Check className="h-3 w-3" aria-hidden={true} />
        Acertaste
      </span>
    )
  }
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-pill border border-warmth/30 bg-warning-soft px-2 py-0.5 font-mono text-[10px] text-warning-on-soft uppercase tracking-wider">
      <X className="h-3 w-3" aria-hidden={true} />
      Falló
    </span>
  )
}

interface ContenidoPreguntaProps {
  readonly pregunta: PreguntaQuiz
  readonly respuestas: UseQuizRespuestasResult
  readonly bloqueado: boolean
  readonly acertada: boolean | null
  readonly verSolucion: boolean
}

function ContenidoPregunta({
  pregunta,
  respuestas,
  bloqueado,
  acertada,
  verSolucion,
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
          acertada={acertada}
          verSolucion={verSolucion}
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
          acertada={acertada}
          verSolucion={verSolucion}
        />
      )
    case "VERDADERO_FALSO":
      return (
        <QuizPreguntaVerdaderoFalso
          pregunta={pregunta}
          valor={respuestas.vf(pregunta.id)}
          onCambiar={(valor) => respuestas.setVerdaderoFalso(pregunta.id, valor)}
          bloqueado={bloqueado}
          acertada={acertada}
          verSolucion={verSolucion}
        />
      )
    case "RESPUESTA_CORTA":
      return (
        <QuizPreguntaRespuestaCorta
          pregunta={pregunta}
          texto={respuestas.texto(pregunta.id)}
          onCambiar={(texto) => respuestas.setTexto(pregunta.id, texto)}
          bloqueado={bloqueado}
          acertada={acertada}
          verSolucion={verSolucion}
        />
      )
    default: {
      const _exhaustivo: never = pregunta
      throw new Error(`Pregunta no manejada: ${JSON.stringify(_exhaustivo)}`)
    }
  }
}
