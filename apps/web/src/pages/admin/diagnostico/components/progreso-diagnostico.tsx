import type { PasoProgreso } from "@/features/admin-diagnostico/lib/progreso"
import type { TabDiagnostico } from "@/features/admin-diagnostico/types/diagnostico"
import { cn } from "@/shared/lib/cn"
import { Check, Circle, CircleDashed } from "lucide-react"

interface ProgresoDiagnosticoProps {
  readonly pasos: readonly [PasoProgreso, PasoProgreso, PasoProgreso]
  readonly diasRestantes?: number
  readonly onPasoClick: (tab: TabDiagnostico) => void
}

export function ProgresoDiagnostico({
  pasos,
  diasRestantes,
  onPasoClick,
}: ProgresoDiagnosticoProps) {
  return (
    <section
      aria-label="Progreso del diagnóstico"
      className={cn(
        "rounded-[var(--radius-xl)] border border-glass-border bg-glass-1",
        "px-5 py-4 backdrop-blur-2xl",
      )}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-[11px] text-brand-violet-soft uppercase tracking-wider">
            Diagnóstico del curso
          </span>
          <span className="text-sm text-text-secondary">
            Tres pasos para que el curso quede operativo.
          </span>
        </div>
        {diasRestantes !== undefined ? (
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-[var(--radius-full)] px-2.5 py-1",
              "border text-xs",
              diasRestantes <= 7
                ? "border-[rgb(245_158_11/0.3)] bg-[var(--warning-bg)] text-warning"
                : "border-glass-border bg-glass-2 text-text-secondary",
            )}
          >
            Deadline en {diasRestantes} días
          </span>
        ) : null}
      </div>

      <ol className="mt-4 grid gap-2 md:grid-cols-3">
        {pasos.map((paso) => (
          <li key={paso.numero}>
            <button
              type="button"
              onClick={() => onPasoClick(paso.numero)}
              className={cn(
                "flex w-full items-center gap-3 rounded-[var(--radius-md)] px-3 py-3 text-left",
                "border transition-colors duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-violet",
                paso.estado === "completo" &&
                  "border-[rgb(16_185_129/0.3)] bg-[var(--success-bg)] hover:bg-[rgb(16_185_129/0.18)]",
                paso.estado === "parcial" &&
                  "border-[rgb(245_158_11/0.3)] bg-[var(--warning-bg)] hover:bg-[rgb(245_158_11/0.18)]",
                paso.estado === "vacio" && "border-glass-border bg-glass-2 hover:bg-glass-3",
              )}
            >
              <IconoPaso estado={paso.estado} />
              <div className="flex min-w-0 flex-col">
                <span className="text-text-muted text-xs">Paso {paso.numero}</span>
                <span className="truncate font-medium text-sm text-text-primary">
                  {paso.etiqueta}
                </span>
                <span className="text-[11px] text-text-secondary">
                  {paso.total === 0
                    ? "Sin candidatos"
                    : `${paso.hechos} / ${paso.total} ${paso.numero === 1 ? "invitados" : paso.numero === 2 ? "evaluados" : "asignados"}`}
                </span>
              </div>
            </button>
          </li>
        ))}
      </ol>
    </section>
  )
}

function IconoPaso({ estado }: { readonly estado: PasoProgreso["estado"] }) {
  if (estado === "completo") {
    return (
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-success/20 text-success">
        <Check className="size-4" strokeWidth={2.25} aria-hidden="true" />
      </span>
    )
  }
  if (estado === "parcial") {
    return (
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-warning/20 text-warning">
        <CircleDashed className="size-4" strokeWidth={2} aria-hidden="true" />
      </span>
    )
  }
  return (
    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-glass-2 text-text-muted">
      <Circle className="size-4" strokeWidth={2} aria-hidden="true" />
    </span>
  )
}
