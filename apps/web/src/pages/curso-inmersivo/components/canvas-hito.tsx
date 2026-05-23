import { CanvasEntrevistaIa } from "./hitos/entrevista-ia/canvas-entrevista-ia"
import { CanvasTransversal } from "./hitos/transversal/canvas-transversal"

type HitoTipo = "transversal" | "entrevistaIa"

interface CanvasHitoProps {
  readonly hito: HitoTipo
  readonly cursoId: string
  readonly asignacionId: string | null
  readonly tieneEntrevistaIa: boolean
  /**
   * Propagado por el chat de entrevista IA cuando arranca/termina. Permite
   * que el page atenue sidebar y topbar mientras dura la conversacion.
   */
  readonly onChatEntrevistaIaActivo?: (activo: boolean) => void
}

/**
 * Dispatcher del canvas central cuando el participante elige un hito de cierre
 * desde el sidebar. Cada hito tiene su propio canvas autocontenido y solo
 * muestra informacion de su propio tema; la navegacion entre hitos se hace
 * por el sidebar o el panel "Hacia el cierre".
 */
export function CanvasHito({
  hito,
  cursoId,
  asignacionId,
  tieneEntrevistaIa,
  onChatEntrevistaIaActivo,
}: CanvasHitoProps) {
  if (hito === "transversal") {
    return (
      <CanvasTransversal
        cursoId={cursoId}
        asignacionId={asignacionId}
        tieneEntrevistaIa={tieneEntrevistaIa}
      />
    )
  }
  return (
    <CanvasEntrevistaIa
      cursoId={cursoId}
      asignacionId={asignacionId}
      onChatActivoChange={onChatEntrevistaIaActivo}
    />
  )
}
