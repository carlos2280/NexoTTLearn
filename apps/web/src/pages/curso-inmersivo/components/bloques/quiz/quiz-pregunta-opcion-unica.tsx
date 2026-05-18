import { cn } from "@/shared/lib/cn"
import type { PreguntaOpcionUnica } from "@nexott-learn/shared-types"
import { Check } from "lucide-react"

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
 * activo, marca con verde sutil únicamente la opción correcta. La opción del
 * usuario (acertara o no) NO se marca en rojo — castigar la elección rompe
 * la motivación (manifiesto §3 capas; 04 R7). Si quiere comparar, sigue
 * viendo su radio button marcado contra el check verde de la correcta.
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
              type="radio"
              name={`pregunta-${pregunta.id}`}
              value={opcion.id}
              checked={elegida}
              onChange={() => onCambiar(opcion.id)}
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
