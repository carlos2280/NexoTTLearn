import { cn } from "@/shared/lib/cn"
import type { PreguntaRespuestaCorta } from "@nexott-learn/shared-types"

interface QuizPreguntaRespuestaCortaProps {
  readonly pregunta: PreguntaRespuestaCorta
  readonly texto: string
  readonly onCambiar: (texto: string) => void
  readonly bloqueado: boolean
  readonly mostrarSolucion: boolean
}

/**
 * Pregunta de respuesta corta (input). El motor normaliza ambas partes
 * (trim, mayúsculas, acentos, espacios dobles) según `pregunta.normalizacion`
 * antes de comparar contra `respuestasAceptadas`. Al ver la solución se
 * muestra la primera respuesta aceptada como referencia.
 */
export function QuizPreguntaRespuestaCorta({
  pregunta,
  texto,
  onCambiar,
  bloqueado,
  mostrarSolucion,
}: QuizPreguntaRespuestaCortaProps) {
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
          "border-border focus:border-accent focus:shadow-ring-accent-soft",
          bloqueado && "cursor-not-allowed opacity-70",
        )}
        placeholder="Escribe tu respuesta"
      />
      {mostrarSolucion ? (
        <p className="text-caption text-text-tertiary">
          Respuesta aceptada:{" "}
          <span className="font-mono text-text-primary">{pregunta.respuestasAceptadas[0]}</span>
        </p>
      ) : null}
    </div>
  )
}
