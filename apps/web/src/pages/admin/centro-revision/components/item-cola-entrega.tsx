import { cn } from "@/shared/lib/cn"
import { Badge } from "@/shared/ui/patterns/badge"
import type { EntregaBloqueListItemAdmin } from "@nexott-learn/shared-types"
import { AlertTriangle, ChevronRight, Clock } from "lucide-react"
import { calcularSeveridadBloque, edadRelativa } from "../lib/prioridad"

interface ItemColaEntregaProps {
  readonly item: EntregaBloqueListItemAdmin
  readonly isSelected: boolean
  readonly onClick: () => void
}

const SEVERIDAD_STYLES = {
  alta: {
    border: "border-danger/40 bg-[var(--danger-bg)]/30",
    icon: AlertTriangle,
    iconColor: "text-danger",
    badge: "danger" as const,
  },
  media: {
    border: "border-warning/40",
    icon: Clock,
    iconColor: "text-warning",
    badge: "warning" as const,
  },
  baja: {
    border: "border-glass-border",
    icon: null,
    iconColor: "",
    badge: "neutral" as const,
  },
}

export function ItemColaEntrega({ item, isSelected, onClick }: ItemColaEntregaProps) {
  const severidad = calcularSeveridadBloque(item)
  const estilo = SEVERIDAD_STYLES[severidad]
  const Icon = estilo.icon
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
        isSelected ? "border-brand-violet/60 bg-[rgb(124_58_237/0.06)]" : estilo.border,
      )}
      aria-pressed={isSelected}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2">
            {Icon ? (
              <Icon className={cn("size-3.5 shrink-0", estilo.iconColor)} strokeWidth={2} />
            ) : null}
            <span className="text-text-muted text-xs">{edadRelativa(item.enviadaAt)}</span>
            {item.ajustadaManual ? (
              <Badge tone="violet" size="sm">
                Ajustada
              </Badge>
            ) : null}
          </div>
          <p className="truncate font-semibold text-sm text-text-primary">{nombreCompleto}</p>
          <p className="truncate text-text-secondary text-xs">{item.bloque.moduloTitulo}</p>
          <p className="text-text-muted text-xs">
            {item.bloque.seccionTitulo} · Intento {item.intento}
          </p>
        </div>
        <ChevronRight
          className={cn(
            "mt-0.5 size-4 shrink-0 transition-colors",
            isSelected ? "text-brand-violet-soft" : "text-text-faint",
          )}
          strokeWidth={1.75}
        />
      </div>
      <div className="mt-2 border-glass-border border-t pt-2">
        <p className="truncate text-text-muted text-xs">
          {item.curso.empresaCliente} · {item.curso.titulo}
        </p>
      </div>
    </button>
  )
}
