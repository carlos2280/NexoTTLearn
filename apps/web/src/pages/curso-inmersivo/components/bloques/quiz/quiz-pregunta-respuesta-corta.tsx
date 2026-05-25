import { cn } from "@/shared/lib/cn"
import type { PreguntaRespuestaCorta } from "@nexott-learn/shared-types"

interface QuizPreguntaRespuestaCortaProps {
  readonly pregunta: PreguntaRespuestaCorta
  readonly texto: string
  readonly onCambiar: (texto: string) => void
  readonly bloqueado: boolean
  readonly acertada: boolean | null
  readonly verSolucion: boolean
}

/**
 * Pregunta de respuesta corta. Tras el intento, el input lleva borde verde si
 * acertó o ámbar si falló (feedback siempre). La respuesta aceptada solo se
 * revela cuando `verSolucion` lo permite.
 */
export function QuizPreguntaRespuestaCorta({
  pregunta,
  texto,
  onCambiar,
  bloqueado,
  acertada,
  verSolucion,
}: QuizPreguntaRespuestaCortaProps) {
  const hayIntento = acertada !== null
  return (
    <div className="flex flex-col gap-2">
      <input
        type="text"
        value={texto}
        onChange={(e) => onCambiar(e.target.value)}
        disabled={bloqueado}
        maxLength={500}
        className={cn(
          "rounded-xl border bg-surface px-3 py-2 text-body text-text-primary outline-none transition-colors duration-fast ease-default",
          !hayIntento && "border-border focus:border-accent focus:shadow-ring-accent-soft",
          acertada === true && "border-success/40 bg-success-soft",
          acertada === false && "border-warmth/30 bg-warning-soft",
          bloqueado && "cursor-not-allowed opacity-70",
        )}
        placeholder="Escribe tu respuesta"
      />
      {verSolucion ? (
        <p className="text-caption text-text-tertiary">
          Respuesta aceptada:{" "}
          <span className="font-mono text-text-primary">{pregunta.respuestasAceptadas[0]}</span>
        </p>
      ) : null}
    </div>
  )
}
