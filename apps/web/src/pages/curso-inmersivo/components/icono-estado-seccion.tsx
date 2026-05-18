import { cn } from "@/shared/lib/cn"
import type { ModoCursoParticipante } from "@nexott-learn/shared-types"
import { CheckCircle2, Circle, CircleDashed } from "lucide-react"

interface IconoEstadoSeccionProps {
  readonly completada: boolean
  readonly esOpcional: boolean
  readonly activa: boolean
  readonly modo: ModoCursoParticipante
}

/**
 * Icono a la izquierda de cada fila del sidebar. Tres estados visuales:
 * completada (check verde), activa (dot indigo), pendiente (circulo gris).
 * Las opcionales en modo `asignado` usan `CircleDashed` para distinguirlas.
 */
export function IconoEstadoSeccion({
  completada,
  esOpcional,
  activa,
  modo,
}: IconoEstadoSeccionProps) {
  if (completada) {
    return <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden={true} />
  }
  if (activa) {
    return (
      <span
        aria-hidden={true}
        className={cn("mt-1 inline-block h-3 w-3 shrink-0 rounded-pill bg-accent")}
      />
    )
  }
  if (esOpcional && modo === "asignado") {
    return (
      <CircleDashed className="mt-0.5 h-4 w-4 shrink-0 text-text-tertiary" aria-hidden={true} />
    )
  }
  return <Circle className="mt-0.5 h-4 w-4 shrink-0 text-text-tertiary" aria-hidden={true} />
}
