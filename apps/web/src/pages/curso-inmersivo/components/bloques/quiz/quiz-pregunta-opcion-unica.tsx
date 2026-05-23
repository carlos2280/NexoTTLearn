import { cn } from "@/shared/lib/cn"
import type { PreguntaOpcionUnica } from "@nexott-learn/shared-types"
import { Check, X } from "lucide-react"

interface QuizPreguntaOpcionUnicaProps {
  readonly pregunta: PreguntaOpcionUnica
  readonly opcionElegidaId: string | null
  readonly onCambiar: (opcionId: string) => void
  readonly bloqueado: boolean
  readonly opcionCorrectaId: string | null
  /** null = aún no enviado; true/false = acertó/falló según server. */
  readonly acertada: boolean | null
  /** Si true, revela cuál era la correcta (depende de `solucionVisible` del quiz). */
  readonly verSolucion: boolean
}

/**
 * Pregunta de opción única (radio buttons). Tres modos:
 *  - Sin intento: render limpio, sólo la elección actual con anillo accent.
 *  - Con intento + sin verSolucion: la elección del usuario lleva tinte success
 *    (acertó) o warmth (falló). No se revela la correcta.
 *  - Con intento + verSolucion: además la opción correcta lleva tinte success
 *    y badge "Correcta". La elección errónea queda con tinte warmth para que
 *    el usuario distinga su respuesta de la solución.
 */
export function QuizPreguntaOpcionUnica({
  pregunta,
  opcionElegidaId,
  onCambiar,
  bloqueado,
  opcionCorrectaId,
  acertada,
  verSolucion,
}: QuizPreguntaOpcionUnicaProps) {
  const hayIntento = acertada !== null
  return (
    <fieldset className="flex flex-col gap-2" disabled={bloqueado}>
      <legend className="sr-only">{pregunta.enunciado}</legend>
      {pregunta.opciones.map((opcion) => {
        const elegida = opcionElegidaId === opcion.id
        const esCorrecta = opcion.id === opcionCorrectaId
        const revelarCorrecta = verSolucion && esCorrecta
        // Tinte sobre la elección del usuario tras intento: verde si acertó,
        // ámbar si falló. Coexiste con `revelarCorrecta` en la otra opción.
        const tinteEleccion = hayIntento && elegida
        const eleccionAcertada = tinteEleccion && acertada === true
        const eleccionFallada = tinteEleccion && acertada === false
        return (
          <label
            key={opcion.id}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors duration-fast ease-default",
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
              value={opcion.id}
              checked={elegida}
              onChange={() => onCambiar(opcion.id)}
              className="mt-0.5 h-4 w-4 accent-accent"
            />
            <span className="flex-1 text-body-sm text-text-primary">{opcion.texto}</span>
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
