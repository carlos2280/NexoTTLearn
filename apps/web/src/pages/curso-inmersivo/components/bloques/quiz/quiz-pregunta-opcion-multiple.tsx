import { cn } from "@/shared/lib/cn"
import type { PreguntaOpcionMultiple } from "@nexott-learn/shared-types"
import { Check } from "lucide-react"

interface QuizPreguntaOpcionMultipleProps {
  readonly pregunta: PreguntaOpcionMultiple
  readonly opcionesElegidasIds: readonly string[]
  readonly onToggle: (opcionId: string) => void
  readonly bloqueado: boolean
  readonly opcionesCorrectasIds: readonly string[]
  readonly mostrarSolucion: boolean
}

/**
 * Pregunta de opción múltiple (checkboxes). Cuando se ve la solución, solo
 * marcamos las correctas con verde sutil; nunca marcamos en rojo las que el
 * usuario eligió de más, porque castigar la elección rompe la motivación
 * (manifiesto §3 capas; 04 R7). El usuario sigue viendo qué marcó: si la
 * correcta también lleva su check, fue acertada; si dejó marcada una sin
 * tinte verde, sabrá que sobraba — sin gritarlo.
 */
export function QuizPreguntaOpcionMultiple({
  pregunta,
  opcionesElegidasIds,
  onToggle,
  bloqueado,
  opcionesCorrectasIds,
  mostrarSolucion,
}: QuizPreguntaOpcionMultipleProps) {
  const correctas = new Set(opcionesCorrectasIds)
  const elegidas = new Set(opcionesElegidasIds)

  return (
    <fieldset className="flex flex-col gap-2" disabled={bloqueado}>
      <legend className="sr-only">{pregunta.enunciado}</legend>
      {pregunta.opciones.map((opcion) => {
        const elegida = elegidas.has(opcion.id)
        const esCorrecta = correctas.has(opcion.id)
        const correcta = mostrarSolucion && esCorrecta
        return (
          <label
            key={opcion.id}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors duration-fast ease-default",
              !bloqueado && "hover:bg-subtle",
              elegida && !mostrarSolucion && "border-accent bg-accent-soft",
              correcta && "border-success/40 bg-success-soft",
              !(elegida || correcta) && "border-border bg-surface",
            )}
          >
            <input
              type="checkbox"
              value={opcion.id}
              checked={elegida}
              onChange={() => onToggle(opcion.id)}
              className="mt-0.5 h-4 w-4 accent-accent"
            />
            <span className="flex-1 text-body-sm text-text-primary">{opcion.texto}</span>
            {correcta ? (
              <span className="inline-flex shrink-0 items-center gap-1 font-mono text-[10px] text-success uppercase tracking-wider">
                <Check className="h-3.5 w-3.5" aria-hidden={true} />
                Correcta
              </span>
            ) : null}
          </label>
        )
      })}
    </fieldset>
  )
}
