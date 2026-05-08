import { cn } from "@/shared/lib/cn"
import { motion } from "framer-motion"
import { Search } from "lucide-react"

export type MisCursosFiltro = "todos" | "activos" | "completados"

interface MisCursosFiltrosProps {
  readonly filtro: MisCursosFiltro
  readonly onFiltroChange: (f: MisCursosFiltro) => void
  readonly busqueda: string
  readonly onBusquedaChange: (q: string) => void
  readonly conteos: Record<MisCursosFiltro, number>
}

interface ChipDef {
  readonly value: MisCursosFiltro
  readonly label: string
}

const CHIPS: readonly ChipDef[] = [
  { value: "todos", label: "Todos" },
  { value: "activos", label: "Activos" },
  { value: "completados", label: "Completados" },
]

const EASE_OUT: [number, number, number, number] = [0.2, 0.8, 0.2, 1]

// §4.3 doc canonico. 3 filter chips + search input. Cambios in-place sin URL.
export function MisCursosFiltros({
  filtro,
  onFiltroChange,
  busqueda,
  onBusquedaChange,
  conteos,
}: MisCursosFiltrosProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.36, ease: EASE_OUT, delay: 0.18 }}
      className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex flex-wrap items-center gap-2">
        {CHIPS.map((chip) => {
          const active = chip.value === filtro
          return (
            <button
              key={chip.value}
              type="button"
              onClick={() => onFiltroChange(chip.value)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-medium text-[12.5px] transition-all duration-200",
                active
                  ? "border-brand-violet/35 bg-brand-violet/12 text-brand-violet-soft shadow-[0_0_0_1px_rgb(124_58_237_/_0.18)]"
                  : "border-glass-border bg-surface-1 text-text-secondary hover:bg-surface-2 hover:text-text-primary",
              )}
            >
              {chip.label}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0 font-semibold text-[10.5px] tabular-nums",
                  active
                    ? "bg-brand-violet/20 text-brand-violet-soft"
                    : "bg-surface-2 text-text-muted",
                )}
              >
                {conteos[chip.value]}
              </span>
            </button>
          )
        })}
      </div>

      <label className="relative flex items-center sm:w-72">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 size-4 text-text-muted"
          strokeWidth={1.75}
        />
        <input
          type="search"
          value={busqueda}
          onChange={(e) => onBusquedaChange(e.target.value)}
          placeholder="Buscar curso..."
          aria-label="Buscar curso"
          className="w-full rounded-full border border-glass-border bg-surface-1 py-2 pr-3 pl-9 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand-violet/40"
        />
      </label>
    </motion.div>
  )
}
