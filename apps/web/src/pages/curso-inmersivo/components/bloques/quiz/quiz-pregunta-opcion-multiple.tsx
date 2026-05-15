import { cn } from "@/shared/lib/cn"
import type { PreguntaOpcionMultiple } from "@nexott-learn/shared-types"
import { Check, X } from "lucide-react"

interface QuizPreguntaOpcionMultipleProps {
  readonly pregunta: PreguntaOpcionMultiple
  readonly opcionesElegidasIds: readonly string[]
  readonly onToggle: (opcionId: string) => void
  readonly bloqueado: boolean
  readonly opcionesCorrectasIds: readonly string[]
  readonly mostrarSolucion: boolean
}

/**
 * Pregunta de opción múltiple (checkboxes). Si `puntuacionParcial=false`
 * (default), el motor exige conjunto exacto; con parcial, premia aciertos
 * dentro de la elegidas. La UI muestra todas las correctas con success y
 * marca con danger las elegidas que no son correctas (cuando se ve solución).
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
        const errada = mostrarSolucion && elegida && !esCorrecta
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
              type="checkbox"
              value={opcion.id}
              checked={elegida}
              onChange={() => onToggle(opcion.id)}
              className="mt-0.5 h-4 w-4 accent-accent"
            />
            <span className="flex-1 text-body-sm text-text-primary">{opcion.texto}</span>
            <EtiquetaResultado correcta={correcta} errada={errada} elegida={elegida} />
          </label>
        )
      })}
    </fieldset>
  )
}

interface EtiquetaResultadoProps {
  readonly correcta: boolean
  readonly errada: boolean
  readonly elegida: boolean
}

/**
 * Pista visual a la derecha de la opcion cuando se revela la solucion. En
 * opcion multiple distinguimos "Correcta · No marcada" (la perdiste) de
 * "Correcta · Marcada" (acertaste).
 */
function EtiquetaResultado({ correcta, errada, elegida }: EtiquetaResultadoProps) {
  if (correcta) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 font-mono text-[10px] text-success uppercase tracking-wider">
        <Check className="h-3.5 w-3.5" aria-hidden={true} />
        {elegida ? "Correcta · Marcada" : "Correcta · No marcada"}
      </span>
    )
  }
  if (errada) {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 font-mono text-[10px] text-danger uppercase tracking-wider">
        <X className="h-3.5 w-3.5" aria-hidden={true} />
        Tu respuesta
      </span>
    )
  }
  return null
}
