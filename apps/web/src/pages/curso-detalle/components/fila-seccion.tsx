import { cn } from "@/shared/lib/cn"
import type { SeccionPlanItemParticipante } from "@nexott-learn/shared-types"
import { Check, CircleDashed, CircleDot, Minus } from "lucide-react"

interface FilaSeccionProps {
  readonly seccion: SeccionPlanItemParticipante
  readonly onAbrir: (seccionId: string) => void
}

type EstadoVisual = "completada" | "en-progreso" | "pendiente" | "opcional"

function derivarEstado(seccion: SeccionPlanItemParticipante): EstadoVisual {
  if (seccion.caracter === "OPCIONAL") {
    return "opcional"
  }
  if (seccion.completada) {
    return "completada"
  }
  if (seccion.avance.bloquesCompletados > 0) {
    return "en-progreso"
  }
  return "pendiente"
}

const COPY_ESTADO: Record<EstadoVisual, string> = {
  completada: "completada",
  "en-progreso": "en progreso",
  pendiente: "pendiente",
  opcional: "opcional",
}

const CLASES_ICONO: Record<EstadoVisual, string> = {
  completada: "text-success",
  "en-progreso": "text-warmth",
  pendiente: "text-text-tertiary",
  opcional: "text-text-tertiary",
}

function IconoEstado({ estado }: { readonly estado: EstadoVisual }) {
  const className = cn("h-4 w-4 shrink-0", CLASES_ICONO[estado])
  switch (estado) {
    case "completada":
      return <Check className={className} aria-hidden={true} />
    case "en-progreso":
      return <CircleDot className={className} aria-hidden={true} />
    case "opcional":
      return <Minus className={className} aria-hidden={true} />
    default:
      return <CircleDashed className={className} aria-hidden={true} />
  }
}

export function FilaSeccion({ seccion, onAbrir }: FilaSeccionProps) {
  const estado = derivarEstado(seccion)
  return (
    <li>
      <button
        type="button"
        onClick={() => onAbrir(seccion.seccionId)}
        className={cn(
          "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-body-sm transition-colors duration-fast ease-default",
          "hover:bg-subtle focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2",
        )}
      >
        <IconoEstado estado={estado} />
        <span className="min-w-0 flex-1 truncate text-text-primary">{seccion.titulo}</span>
        <span className="shrink-0 text-caption text-text-tertiary">
          {seccion.caracter === "OPCIONAL" ? "opcional" : "obligatoria"}
        </span>
        <span className="w-28 shrink-0 text-right text-caption text-text-secondary">
          {COPY_ESTADO[estado]}
        </span>
      </button>
    </li>
  )
}
