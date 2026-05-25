import { cn } from "@/shared/lib/cn"
import { Check } from "lucide-react"
import type { PreguntaVerdaderoFalso } from "../quiz-tipos"

interface CuerpoVerdaderoFalsoProps {
  readonly pregunta: PreguntaVerdaderoFalso
  readonly onCambiar: (siguiente: PreguntaVerdaderoFalso) => void
}

interface OpcionBoton {
  readonly valor: boolean
  readonly etiqueta: string
}

const OPCIONES: readonly OpcionBoton[] = [
  { valor: true, etiqueta: "Verdadero" },
  { valor: false, etiqueta: "Falso" },
]

export function CuerpoVerdaderoFalso({ pregunta, onCambiar }: CuerpoVerdaderoFalsoProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className="nx-eyebrow text-text-tertiary">Respuesta correcta</span>
      <div className="grid grid-cols-2 gap-2" role="radiogroup">
        {OPCIONES.map((opt) => {
          const activo = pregunta.correcta === opt.valor
          return (
            <label
              key={opt.etiqueta}
              className={cn(
                "flex h-12 cursor-pointer items-center justify-center gap-2 rounded-lg border font-medium text-body",
                "transition-[background-color,border-color,color,box-shadow] duration-fast ease-default",
                activo
                  ? "border-success bg-success-soft text-success-on-soft shadow-xs"
                  : "border-border bg-surface text-text-secondary hover:border-border-strong hover:bg-subtle/60",
              )}
            >
              <input
                type="radio"
                name={`vf-${pregunta.id}`}
                checked={activo}
                onChange={() => onCambiar({ ...pregunta, correcta: opt.valor })}
                className="sr-only"
              />
              {activo ? <Check className="h-4 w-4" strokeWidth={2} aria-hidden={true} /> : null}
              {opt.etiqueta}
            </label>
          )
        })}
      </div>
    </div>
  )
}
