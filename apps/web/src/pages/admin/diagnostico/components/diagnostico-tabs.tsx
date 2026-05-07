import type { TabDiagnostico } from "@/features/admin-diagnostico/types/diagnostico"
import { cn } from "@/shared/lib/cn"
import { ClipboardList, FilePen, type LucideIcon, Users } from "lucide-react"

interface OpcionTab {
  readonly value: TabDiagnostico
  readonly label: string
  readonly icon: LucideIcon
  readonly badge?: string
}

interface DiagnosticoTabsProps {
  readonly value: TabDiagnostico
  readonly onChange: (tab: TabDiagnostico) => void
  readonly badges: {
    readonly invitados: number
    readonly evaluacion: string
    readonly asignacion: string
  }
}

export function DiagnosticoTabs({ value, onChange, badges }: DiagnosticoTabsProps) {
  const opciones: readonly OpcionTab[] = [
    { value: 1, label: "Invitados", icon: Users, badge: String(badges.invitados) },
    { value: 2, label: "Evaluación inicial", icon: FilePen, badge: badges.evaluacion },
    { value: 3, label: "Asignación", icon: ClipboardList, badge: badges.asignacion },
  ]
  return (
    <div role="tablist" aria-label="Pasos del diagnóstico" className="border-glass-border border-b">
      <div className="flex items-center gap-1 overflow-x-auto">
        {opciones.map((op) => {
          const Icon = op.icon
          const active = op.value === value
          return (
            <button
              key={op.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(op.value)}
              className={cn(
                "relative inline-flex items-center gap-2 px-4 py-3",
                "whitespace-nowrap font-medium text-sm",
                "transition-colors duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-violet",
                active ? "text-text-primary" : "text-text-muted hover:text-text-secondary",
              )}
            >
              <Icon className="size-4" strokeWidth={1.75} aria-hidden="true" />
              <span>
                {op.value}. {op.label}
              </span>
              {op.badge ? (
                <span
                  className={cn(
                    "inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5",
                    "font-semibold text-[10px] tracking-tight",
                    active
                      ? "bg-[linear-gradient(135deg,var(--brand-violet)_0%,var(--brand-cyan)_100%)] text-white"
                      : "bg-glass-2 text-text-secondary",
                  )}
                >
                  {op.badge}
                </span>
              ) : null}
              {active ? (
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute right-2 bottom-0 left-2 h-[2px] rounded-full",
                    "bg-[linear-gradient(90deg,var(--brand-violet)_0%,var(--brand-cyan)_100%)]",
                  )}
                />
              ) : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}
