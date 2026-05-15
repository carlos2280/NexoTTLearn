import { cn } from "@/shared/lib/cn"
import type { PreguntaOpcionUnica } from "@nexott-learn/shared-types"

interface QuizPreguntaOpcionUnicaProps {
  readonly pregunta: PreguntaOpcionUnica
  readonly opcionElegidaId: string | null
  readonly onCambiar: (opcionId: string) => void
  readonly bloqueado: boolean
  readonly opcionCorrectaId: string | null
  readonly mostrarSolucion: boolean
}

/**
 * Pregunta de opción única (radio buttons). Cuando `mostrarSolucion` está
 * activo, marca con tinte success la correcta y con danger la elegida si
 * fue incorrecta. Mientras se contesta, solo destaca la selección actual.
 */
export function QuizPreguntaOpcionUnica({
  pregunta,
  opcionElegidaId,
  onCambiar,
  bloqueado,
  opcionCorrectaId,
  mostrarSolucion,
}: QuizPreguntaOpcionUnicaProps) {
  return (
    <fieldset className="flex flex-col gap-2" disabled={bloqueado}>
      <legend className="sr-only">{pregunta.enunciado}</legend>
      {pregunta.opciones.map((opcion) => {
        const elegida = opcionElegidaId === opcion.id
        const correcta = mostrarSolucion && opcion.id === opcionCorrectaId
        const errada = mostrarSolucion && elegida && opcion.id !== opcionCorrectaId
        return (
          <label
            key={opcion.id}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors duration-fast ease-default",
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
              value={opcion.id}
              checked={elegida}
              onChange={() => onCambiar(opcion.id)}
              className="mt-0.5 h-4 w-4 accent-accent"
            />
            <span className="flex-1 text-body-sm text-text-primary">{opcion.texto}</span>
          </label>
        )
      })}
    </fieldset>
  )
}
