import { Button } from "@/shared/components/ui/button"
import { Textarea } from "@/shared/components/ui/textarea"
import { cn } from "@/shared/lib/cn"
import { Check, ChevronDown, ChevronRight, Trash2 } from "lucide-react"
import { CuerpoOpcionMultiple } from "./cuerpos/cuerpo-opcion-multiple"
import { CuerpoOpcionUnica } from "./cuerpos/cuerpo-opcion-unica"
import { CuerpoRespuestaCorta } from "./cuerpos/cuerpo-respuesta-corta"
import { CuerpoVerdaderoFalso } from "./cuerpos/cuerpo-verdadero-falso"
import { QuizTipoSelector } from "./quiz-tipo-selector"
import {
  type PreguntaQuiz,
  type TipoPreguntaQuiz,
  convertirTipo,
  metaDeTipo,
  preguntaEstaCompleta,
} from "./quiz-tipos"

interface QuizPreguntaProps {
  readonly pregunta: PreguntaQuiz
  readonly numero: number
  readonly expandida: boolean
  readonly onAlternar: () => void
  readonly onCambiar: (siguiente: PreguntaQuiz) => void
  readonly onEliminar: () => void
}

export function QuizPregunta({
  pregunta,
  numero,
  expandida,
  onAlternar,
  onCambiar,
  onEliminar,
}: QuizPreguntaProps) {
  const completa = preguntaEstaCompleta(pregunta)
  const meta = metaDeTipo(pregunta.tipo)
  const IconoCabecera = meta.icono

  function alEliminarDesdeCabecera(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()
    onEliminar()
  }

  function alCambiarTipo(nuevoTipo: TipoPreguntaQuiz) {
    onCambiar(convertirTipo(pregunta, nuevoTipo))
  }

  return (
    <li className="rounded-lg border border-border bg-surface shadow-xs">
      <div className="flex items-center gap-2 px-2 py-2">
        <button
          type="button"
          onClick={onAlternar}
          aria-expanded={expandida}
          aria-label={expandida ? "Plegar pregunta" : "Expandir pregunta"}
          className="flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors duration-fast ease-default hover:bg-subtle/40"
        >
          <span className="text-text-tertiary">
            {expandida ? (
              <ChevronDown className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
            ) : (
              <ChevronRight className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
            )}
          </span>
          <span className="tabular shrink-0 text-caption text-text-tertiary">{numero}.</span>
          <span
            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-subtle text-text-tertiary"
            title={meta.etiqueta}
          >
            <IconoCabecera className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden={true} />
          </span>
          <span className="flex-1 truncate font-medium text-body-sm text-text-primary">
            {pregunta.enunciado.trim() || <span className="text-text-tertiary">Sin enunciado</span>}
          </span>
        </button>
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1 rounded-pill px-2 py-0.5 text-caption",
            completa
              ? "bg-success-soft text-success-on-soft"
              : "bg-warning-soft text-warning-on-soft",
          )}
        >
          {completa ? (
            <>
              <Check className="h-3 w-3" strokeWidth={1.5} aria-hidden={true} />
              Lista
            </>
          ) : (
            "Pendiente"
          )}
        </span>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Eliminar pregunta ${numero}`}
          onClick={alEliminarDesdeCabecera}
          className="text-text-tertiary hover:bg-danger-soft hover:text-danger-on-soft"
        >
          <Trash2 className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
        </Button>
      </div>

      {expandida ? (
        <div className="flex flex-col gap-4 border-border border-t px-4 py-4">
          <QuizTipoSelector valor={pregunta.tipo} onCambiar={alCambiarTipo} />

          <Textarea
            value={pregunta.enunciado}
            onChange={(e) => onCambiar({ ...pregunta, enunciado: e.target.value })}
            placeholder="Escribe la pregunta…"
            rows={2}
            aria-label="Enunciado"
          />

          {pregunta.tipo === "OPCION_UNICA" ? (
            <CuerpoOpcionUnica pregunta={pregunta} onCambiar={onCambiar} />
          ) : pregunta.tipo === "OPCION_MULTIPLE" ? (
            <CuerpoOpcionMultiple pregunta={pregunta} onCambiar={onCambiar} />
          ) : pregunta.tipo === "VERDADERO_FALSO" ? (
            <CuerpoVerdaderoFalso pregunta={pregunta} onCambiar={onCambiar} />
          ) : (
            <CuerpoRespuestaCorta pregunta={pregunta} onCambiar={onCambiar} />
          )}

          <Textarea
            value={pregunta.explicacion ?? ""}
            onChange={(e) => onCambiar({ ...pregunta, explicacion: e.target.value })}
            rows={2}
            placeholder="Explicación al aprobar (opcional). Se muestra cuando el participante responde correctamente."
            aria-label="Explicación opcional"
          />
        </div>
      ) : null}
    </li>
  )
}
