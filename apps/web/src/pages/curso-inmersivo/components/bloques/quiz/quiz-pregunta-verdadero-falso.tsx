import { cn } from "@/shared/lib/cn"
import type { PreguntaVerdaderoFalso } from "@nexott-learn/shared-types"

interface QuizPreguntaVerdaderoFalsoProps {
  readonly pregunta: PreguntaVerdaderoFalso
  readonly valor: boolean | null
  readonly onCambiar: (valor: boolean) => void
  readonly bloqueado: boolean
  readonly mostrarSolucion: boolean
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
  mostrarSolucion,
}: QuizPreguntaVerdaderoFalsoProps) {
  return (
    <fieldset className="flex gap-2" disabled={bloqueado}>
      <legend className="sr-only">{pregunta.enunciado}</legend>
      {OPCIONES.map((opcion) => {
        const elegida = valor === opcion.valor
        const correcta = mostrarSolucion && opcion.valor === pregunta.correcta
        const errada = mostrarSolucion && elegida && opcion.valor !== pregunta.correcta
        return (
          <label
            key={opcion.id}
            className={cn(
              "flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-3 transition-colors duration-fast ease-default",
              !bloqueado && "hover:bg-subtle",
              elegida && !mostrarSolucion && "border-accent bg-accent-soft",
              correcta && "border-success/40 bg-success-soft",
              errada && "border-danger/40 bg-danger-soft",
              !(elegida || correcta || errada) && "border-border bg-surface",
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
          </label>
        )
      })}
    </fieldset>
  )
}
