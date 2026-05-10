import { cn } from "@/shared/lib/cn"
import { Badge } from "@/shared/ui/patterns/badge"
import type { EntregaProyectoListItemAdmin } from "@nexott-learn/shared-types"
import { AlertTriangle, ChevronRight, Clock, GitBranch } from "lucide-react"
import { edadRelativa } from "../lib/prioridad"

interface ItemColaProyectoProps {
  readonly item: EntregaProyectoListItemAdmin
  readonly isSelected: boolean
  readonly onClick: () => void
}

function calcularSeveridadProyecto(item: EntregaProyectoListItemAdmin): "alta" | "media" | "baja" {
  const edadDias = Math.floor(
    (Date.now() - new Date(item.enviadaAt).getTime()) / (1000 * 60 * 60 * 24),
  )
  if (edadDias > 5) {
    return "alta"
  }
  if (edadDias >= 2) {
    return "media"
  }
  return "baja"
}

const SEVERIDAD_ICON = {
  alta: {
    icon: AlertTriangle,
    color: "text-danger",
    border: "border-danger/40 bg-[var(--danger-bg)]/30",
  },
  media: { icon: Clock, color: "text-warning", border: "border-warning/40" },
  baja: { icon: null, color: "", border: "border-glass-border" },
}

export function ItemColaProyecto({ item, isSelected, onClick }: ItemColaProyectoProps) {
  const severidad = calcularSeveridadProyecto(item)
  const { icon: SeveridadIcon, color, border } = SEVERIDAD_ICON[severidad]
  const nombreCompleto = `${item.participante.nombre} ${item.participante.apellido}`

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-[var(--radius-lg)] border p-4 text-left",
        "transition-all duration-200",
        "hover:bg-glass-2 focus-visible:outline-none",
        "focus-visible:ring-2 focus-visible:ring-brand-violet focus-visible:ring-offset-2",
        "focus-visible:ring-offset-surface-0",
        isSelected ? "border-brand-violet/60 bg-[rgb(124_58_237/0.06)]" : border,
      )}
      aria-pressed={isSelected}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2">
            {SeveridadIcon ? (
              <SeveridadIcon className={cn("size-3.5 shrink-0", color)} strokeWidth={2} />
            ) : null}
            <span className="text-text-muted text-xs">{edadRelativa(item.enviadaAt)}</span>
            <Badge tone={item.tipo === "TRANSVERSAL" ? "violet" : "neutral"} size="sm">
              {item.tipo === "TRANSVERSAL" ? "Transversal" : "Mini"}
            </Badge>
          </div>
          <p className="truncate font-semibold text-sm text-text-primary">{nombreCompleto}</p>
          <p className="truncate text-text-secondary text-xs">{item.proyectoTitulo}</p>
          {item.moduloTitulo ? (
            <p className="text-text-muted text-xs">{item.moduloTitulo}</p>
          ) : null}
          <p className="text-text-muted text-xs">Intento {item.intento}</p>
        </div>
        <ChevronRight
          className={cn(
            "mt-0.5 size-4 shrink-0 transition-colors",
            isSelected ? "text-brand-violet-soft" : "text-text-faint",
          )}
          strokeWidth={1.75}
        />
      </div>
      <div className="mt-2 flex items-center gap-1.5 border-glass-border border-t pt-2">
        <GitBranch className="size-3 text-text-faint" strokeWidth={1.75} />
        <p className="truncate text-text-muted text-xs">
          {item.curso.empresaCliente} · {item.curso.titulo}
        </p>
      </div>
    </button>
  )
}
