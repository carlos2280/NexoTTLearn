import { cn } from "@/shared/lib/cn"
import { TIPOS_PREGUNTA_META, type TipoPreguntaQuiz } from "./quiz-tipos"

interface QuizTipoSelectorProps {
  readonly valor: TipoPreguntaQuiz
  readonly onCambiar: (nuevo: TipoPreguntaQuiz) => void
}

export function QuizTipoSelector({ valor, onCambiar }: QuizTipoSelectorProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="nx-eyebrow text-text-tertiary">Tipo de pregunta</span>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Tipo de pregunta">
        {TIPOS_PREGUNTA_META.map((m) => {
          const activo = m.tipo === valor
          const IconoTipo = m.icono
          return (
            <button
              key={m.tipo}
              type="button"
              role="radio"
              aria-checked={activo}
              onClick={() => onCambiar(m.tipo)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-pill border px-3 py-1 text-caption transition-[background-color,border-color,color,box-shadow] duration-fast ease-default",
                activo
                  ? "border-border-strong bg-subtle font-medium text-text-primary shadow-xs"
                  : "border-border bg-surface text-text-secondary hover:bg-subtle/60",
              )}
            >
              <IconoTipo className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden={true} />
              {m.etiqueta}
            </button>
          )
        })}
      </div>
    </div>
  )
}
