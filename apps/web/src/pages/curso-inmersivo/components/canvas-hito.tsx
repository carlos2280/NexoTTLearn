import { Sparkles } from "lucide-react"
import { CanvasTransversal } from "./hitos/transversal/canvas-transversal"

type HitoTipo = "transversal" | "entrevistaIa"

interface CanvasHitoProps {
  readonly hito: HitoTipo
  readonly cursoId: string
  readonly asignacionId: string | null
  readonly tieneEntrevistaIa: boolean
  readonly onAbrirHito: (hito: HitoTipo) => void
}

/**
 * Dispatcher del canvas central cuando el participante elige un hito de cierre
 * desde el sidebar. Hoy solo `transversal` tiene canvas real (spec 05 F1+F2);
 * `entrevistaIa` muestra un placeholder hasta que se implemente (spec 06).
 *
 * `onAbrirHito` permite navegar entre hitos sin cambiar de ruta — lo usa la
 * vista "aprobado" del transversal para invitar a la entrevista IA.
 */
export function CanvasHito({
  hito,
  cursoId,
  asignacionId,
  tieneEntrevistaIa,
  onAbrirHito,
}: CanvasHitoProps) {
  if (hito === "transversal") {
    return (
      <CanvasTransversal
        cursoId={cursoId}
        asignacionId={asignacionId}
        tieneEntrevistaIa={tieneEntrevistaIa}
        onIrAEntrevistaIa={() => onAbrirHito("entrevistaIa")}
      />
    )
  }
  return <PlaceholderEntrevistaIa />
}

function PlaceholderEntrevistaIa() {
  return (
    <main className="flex flex-1 items-center justify-center overflow-y-auto bg-canvas px-6 py-10">
      <article className="flex max-w-md flex-col items-start gap-3">
        <span className="nx-eyebrow inline-flex items-center gap-2 text-aurora-violet">
          <Sparkles className="h-3.5 w-3.5" aria-hidden={true} />
          Hito de cierre
        </span>
        <h2 className="text-display-md text-text-primary leading-tight">Entrevista IA</h2>
        <p className="text-body text-text-secondary">
          Una conversacion de simulacro con un evaluador IA para practicar antes de cliente real.
          Esta pantalla esta en preparacion.
        </p>
      </article>
    </main>
  )
}
