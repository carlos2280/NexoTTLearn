import { cn } from "@/shared/lib/cn"
import type { PreguntaVerdaderoFalso } from "@nexott-learn/shared-types"
import { Check, X } from "lucide-react"

interface QuizPreguntaVerdaderoFalsoProps {
  readonly pregunta: PreguntaVerdaderoFalso
  readonly valor: boolean | null
  readonly onCambiar: (valor: boolean) => void
  readonly bloqueado: boolean
  readonly acertada: boolean | null
  readonly verSolucion: boolean
}

const OPCIONES: readonly {
  readonly id: string
  readonly valor: boolean
  readonly etiqueta: string
}[] = [
  { id: "verdadero", valor: true, etiqueta: "Verdadero" },
  { id: "falso", valor: false, etiqueta: "Falso" },
]

export function QuizPreguntaVerdaderoFalso({
  pregunta,
  valor,
  onCambiar,
  bloqueado,
  acertada,
  verSolucion,
}: QuizPreguntaVerdaderoFalsoProps) {
  const hayIntento = acertada !== null
  return (
    <fieldset className="flex gap-2" disabled={bloqueado}>
      <legend className="sr-only">{pregunta.enunciado}</legend>
      {OPCIONES.map((opcion) => {
        const elegida = valor === opcion.valor
        const esCorrecta = opcion.valor === pregunta.correcta
        const revelarCorrecta = verSolucion && esCorrecta
        const eleccionAcertada = hayIntento && elegida && acertada === true
        const eleccionFallada = hayIntento && elegida && acertada === false
        return (
          <label
            key={opcion.id}
            className={cn(
              "flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-3 transition-colors duration-fast ease-default",
              !bloqueado && !hayIntento && "hover:bg-subtle",
              !hayIntento && elegida && "border-accent bg-accent-soft",
              revelarCorrecta && "border-success/40 bg-success-soft",
              eleccionAcertada && !revelarCorrecta && "border-success/40 bg-success-soft",
              eleccionFallada && "border-warmth/30 bg-warning-soft",
              !(elegida || revelarCorrecta) && "border-border bg-surface",
            )}
          >
            <input
              type="radio"
              name={`pregunta-${pregunta.id}`}
              checked={elegida}
              onChange={() => onCambiar(opcion.valor)}
              className="h-4 w-4 accent-accent"
            />
            <span className="text-body-sm text-text-primary">{opcion.etiqueta}</span>
            {revelarCorrecta ? (
              <span className="inline-flex shrink-0 items-center gap-1 font-mono text-[10px] text-success uppercase tracking-wider">
                <Check className="h-3.5 w-3.5" aria-hidden={true} />
                Correcta
              </span>
            ) : eleccionAcertada ? (
              <span className="inline-flex shrink-0 items-center gap-1 font-mono text-[10px] text-success uppercase tracking-wider">
                <Check className="h-3.5 w-3.5" aria-hidden={true} />
                Tu respuesta
              </span>
            ) : eleccionFallada ? (
              <span className="inline-flex shrink-0 items-center gap-1 font-mono text-[10px] text-warmth uppercase tracking-wider">
                <X className="h-3.5 w-3.5" aria-hidden={true} />
                Tu respuesta
              </span>
            ) : null}
          </label>
        )
      })}
    </fieldset>
  )
}
