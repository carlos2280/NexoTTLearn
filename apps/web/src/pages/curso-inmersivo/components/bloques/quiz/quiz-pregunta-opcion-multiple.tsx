import { cn } from "@/shared/lib/cn"
import type { PreguntaOpcionMultiple } from "@nexott-learn/shared-types"
import { Check, X } from "lucide-react"

interface QuizPreguntaOpcionMultipleProps {
  readonly pregunta: PreguntaOpcionMultiple
  readonly opcionesElegidasIds: readonly string[]
  readonly onToggle: (opcionId: string) => void
  readonly bloqueado: boolean
  readonly opcionesCorrectasIds: readonly string[]
  readonly acertada: boolean | null
  readonly verSolucion: boolean
}

/**
 * Pregunta de opción múltiple (checkboxes). Estados visuales por opción:
 *  - Sin intento: la elegida lleva anillo accent.
 *  - Tras intento sin verSolucion: las que elegiste y son correctas pasan a
 *    verde; las que elegiste y NO son correctas pasan a warmth. Aún no se
 *    revelan las correctas que no marcaste.
 *  - Tras intento con verSolucion: además aparecen las correctas no marcadas
 *    con tinte success + badge "Correcta (faltaba)" — para que veas qué
 *    omitiste sin equivalencia destructiva.
 */
export function QuizPreguntaOpcionMultiple({
  pregunta,
  opcionesElegidasIds,
  onToggle,
  bloqueado,
  opcionesCorrectasIds,
  acertada,
  verSolucion,
}: QuizPreguntaOpcionMultipleProps) {
  const correctas = new Set(opcionesCorrectasIds)
  const elegidas = new Set(opcionesElegidasIds)
  const hayIntento = acertada !== null

  return (
    <fieldset className="flex flex-col gap-2" disabled={bloqueado}>
      <legend className="sr-only">{pregunta.enunciado}</legend>
      {pregunta.opciones.map((opcion) => {
        const elegida = elegidas.has(opcion.id)
        const esCorrecta = correctas.has(opcion.id)
        const acierto = hayIntento && elegida && esCorrecta
        const sobraba = hayIntento && elegida && !esCorrecta
        const faltaba = verSolucion && !elegida && esCorrecta
        return (
          <label
            key={opcion.id}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors duration-fast ease-default",
              !bloqueado && !hayIntento && "hover:bg-subtle",
              !hayIntento && elegida && "border-accent bg-accent-soft",
              (acierto || faltaba) && "border-success/40 bg-success-soft",
              sobraba && "border-warmth/30 bg-warning-soft",
              !(elegida || acierto || faltaba || sobraba) && "border-border bg-surface",
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
            {acierto ? (
              <span className="inline-flex shrink-0 items-center gap-1 font-mono text-[10px] text-success uppercase tracking-wider">
                <Check className="h-3.5 w-3.5" aria-hidden={true} />
                Correcta
              </span>
            ) : faltaba ? (
              <span className="inline-flex shrink-0 items-center gap-1 font-mono text-[10px] text-success uppercase tracking-wider">
                <Check className="h-3.5 w-3.5" aria-hidden={true} />
                Faltaba
              </span>
            ) : sobraba ? (
              <span className="inline-flex shrink-0 items-center gap-1 font-mono text-[10px] text-warmth uppercase tracking-wider">
                <X className="h-3.5 w-3.5" aria-hidden={true} />
                Sobraba
              </span>
            ) : null}
          </label>
        )
      })}
    </fieldset>
  )
}
