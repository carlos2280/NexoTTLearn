import { CanvasEntrevistaIa } from "./hitos/entrevista-ia/canvas-entrevista-ia"
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
  return <CanvasEntrevistaIa cursoId={cursoId} asignacionId={asignacionId} />
}
