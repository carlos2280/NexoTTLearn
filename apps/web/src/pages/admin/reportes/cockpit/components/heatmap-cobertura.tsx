import { cn } from "@/shared/lib/cn"
import type { CoberturaColaboradorItem, CoberturaSkillExigida } from "@nexott-learn/shared-types"

interface HeatmapCoberturaProps {
  readonly skills: readonly CoberturaSkillExigida[]
  readonly colaboradores: readonly CoberturaColaboradorItem[]
  readonly seleccionadoId: string | null
  readonly onSeleccionar: (id: string | null) => void
  readonly className?: string
}

/**
 * Heatmap colaborador × skill. CSS grid puro, sin libs.
 * Color por nivel cualitativo canónico (5 niveles). Sin emoji, sin chips.
 * Click en fila → selecciona colaborador (para alimentar radar individual).
 */
export function HeatmapCobertura({
  skills,
  colaboradores,
  seleccionadoId,
  onSeleccionar,
  className,
}: HeatmapCoberturaProps) {
  if (skills.length === 0) {
    return (
      <div
        className={cn(
          "rounded-2xl border border-border bg-subtle p-6 text-center text-body-sm text-text-secondary",
          className,
        )}
      >
        Este curso no tiene skills exigidas configuradas.
      </div>
    )
  }
  if (colaboradores.length === 0) {
    return (
      <div
        className={cn(
          "rounded-2xl border border-border bg-subtle p-6 text-center text-body-sm text-text-secondary",
          className,
        )}
      >
        Aún no hay colaboradores asignados a este curso.
      </div>
    )
  }

  return (
    <div className={cn("overflow-x-auto rounded-2xl border border-border bg-surface", className)}>
      <table className="w-full min-w-[640px] border-collapse">
        <thead>
          <tr className="border-border border-b">
            <th
              scope="col"
              className="sticky left-0 z-10 bg-surface px-4 py-3 text-left text-caption text-text-tertiary uppercase tracking-wider"
            >
              Colaborador
            </th>
            {skills.map((s) => (
              <th
                key={s.skillId}
                scope="col"
                className="px-2 py-3 text-center text-caption text-text-tertiary"
              >
                <div className="mx-auto max-w-[120px] truncate" title={s.etiqueta}>
                  {s.etiqueta}
                </div>
                <div className="tabular mt-0.5 font-mono text-[10px] text-text-tertiary/70">
                  min {s.notaMinima.toFixed(0)}
                </div>
              </th>
            ))}
            <th scope="col" className="px-3 py-3 text-right text-caption text-text-tertiary">
              Cumple
            </th>
          </tr>
        </thead>
        <tbody>
          {colaboradores.map((c) => {
            const seleccionado = seleccionadoId === c.id
            const toggle = () => onSeleccionar(seleccionado ? null : c.id)
            return (
              <tr
                key={c.id}
                tabIndex={0}
                aria-selected={seleccionado}
                aria-label={`Enfocar radar en ${c.nombre}`}
                onClick={toggle}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    toggle()
                  }
                }}
                className={cn(
                  "cursor-pointer border-border border-b outline-none transition-colors duration-fast ease-default",
                  "last:border-b-0 focus-visible:bg-[rgb(var(--color-aurora-violet-rgb)/0.08)]",
                  seleccionado
                    ? "bg-[rgb(var(--color-aurora-violet-rgb)/0.06)]"
                    : "hover:bg-subtle",
                )}
              >
                <td className="sticky left-0 z-10 bg-inherit px-4 py-3">
                  <div className="flex flex-col">
                    <span className="font-medium text-body-sm text-text-primary">{c.nombre}</span>
                    <span className="text-caption text-text-tertiary">{c.email}</span>
                  </div>
                </td>
                {c.notas.map((n) => (
                  <td key={n.skillId} className="px-1 py-2 text-center">
                    <CeldaNivel
                      nivel={n.nivel}
                      nota={n.nota}
                      etiquetaA11y={`${c.nombre}: ${
                        skills.find((s) => s.skillId === n.skillId)?.etiqueta ?? ""
                      }`}
                    />
                  </td>
                ))}
                <td className="px-3 py-3 text-right">
                  <span className="tabular font-mono font-semibold text-body-sm text-text-primary">
                    {c.skillsCumplidas}
                    <span className="text-text-tertiary">/{skills.length}</span>
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

interface CeldaNivelProps {
  readonly nivel: "excelencia" | "solido" | "enDesarrollo" | "inicial" | "sinTocar"
  readonly nota: number | null
  readonly etiquetaA11y: string
}

const COLORES_NIVEL: Record<CeldaNivelProps["nivel"], { bg: string; ring: string }> = {
  excelencia: {
    bg: "rgb(var(--color-success-rgb) / 0.85)",
    ring: "rgb(var(--color-success-rgb) / 0.25)",
  },
  solido: {
    bg: "rgb(var(--color-success-rgb) / 0.5)",
    ring: "rgb(var(--color-success-rgb) / 0.18)",
  },
  enDesarrollo: {
    bg: "rgb(var(--color-warning-rgb) / 0.55)",
    ring: "rgb(var(--color-warning-rgb) / 0.18)",
  },
  inicial: {
    bg: "rgb(var(--color-danger-rgb) / 0.6)",
    ring: "rgb(var(--color-danger-rgb) / 0.2)",
  },
  sinTocar: {
    bg: "var(--color-muted)",
    ring: "var(--color-border)",
  },
}

function CeldaNivel({ nivel, nota, etiquetaA11y }: CeldaNivelProps) {
  const colores = COLORES_NIVEL[nivel]
  const valor = nota === null ? "—" : Math.round(nota).toString()
  return (
    <div
      role="img"
      aria-label={`${etiquetaA11y} — ${nivel}${nota !== null ? `, nota ${Math.round(nota)}` : ", sin nota"}`}
      className="tabular mx-auto flex h-8 w-12 items-center justify-center rounded-md font-medium font-mono text-[11px] text-white"
      style={{
        background: colores.bg,
        boxShadow: `inset 0 0 0 1px ${colores.ring}`,
        color: nivel === "sinTocar" ? "var(--color-text-tertiary)" : "white",
      }}
    >
      {valor}
    </div>
  )
}
