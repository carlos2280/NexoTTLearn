import { TypeChip } from "@/shared/ui/patterns/type-chip"
import type { PendienteItem } from "@nexott-learn/shared-types"
import { motion } from "framer-motion"
import { ChevronRight } from "lucide-react"
import { Link } from "react-router-dom"
import { gradientePorTipo, iconoPorTipo, labelPorTipo, tonePorTipo } from "./pendiente-tipo"
import { TagBadge } from "./tag-badge"

interface PendienteRowProps {
  readonly item: PendienteItem
  readonly index: number
}

const EASE_OUT: [number, number, number, number] = [0.2, 0.8, 0.2, 1]

// §4.3.1 stream-item. Franja 56px gradiente del tipo + 2 circulos decorativos
// (paridad con siguiente-paso-card en miniatura), chip del tipo + contexto,
// tag de estado, CTA chevron, glow espectral inferior en hover, stagger 60ms.
export function PendienteRow({ item, index }: PendienteRowProps) {
  const Icono = iconoPorTipo(item.tipo)
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: EASE_OUT, delay: 0.32 + index * 0.06 }}
      className="group relative"
    >
      <Link
        to={item.href}
        className="group/link hover:-translate-y-[2px] relative flex items-stretch gap-4 overflow-hidden rounded-2xl border border-glass-border bg-surface-1 transition-all duration-300 ease-out hover:border-glass-border-strong hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-violet/50"
      >
        <div
          className={`relative grid w-14 shrink-0 place-items-center overflow-hidden bg-gradient-to-b ${gradientePorTipo(item.tipo)}`}
        >
          <Icono
            className="size-[22px] text-white drop-shadow-[0_2px_6px_rgb(0_0_0_/_0.3)] transition-transform duration-300 group-hover/link:rotate-[-6deg] group-hover/link:scale-110"
            strokeWidth={1.75}
          />
          <span
            aria-hidden="true"
            className="-top-2 -right-2 absolute size-7 rounded-full bg-white/12"
          />
          <span
            aria-hidden="true"
            className="-bottom-3 -left-3 absolute size-10 rounded-full bg-white/8"
          />
        </div>

        <div className="flex min-w-0 flex-1 items-center gap-3 py-3 pr-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <p className="truncate font-semibold text-[15px] text-text-primary">{item.titulo}</p>
            <div className="flex min-w-0 items-center gap-2">
              <TypeChip tone={tonePorTipo(item.tipo)}>{labelPorTipo(item.tipo)}</TypeChip>
              <p className="truncate text-[13px] text-text-secondary">{item.contexto}</p>
            </div>
          </div>
          <TagBadge tag={item.tag} />
          <ChevronRight
            className="size-4 shrink-0 text-brand-violet transition-transform duration-300 group-hover/link:translate-x-[2px]"
            strokeWidth={2}
          />
        </div>
      </Link>

      <span
        aria-hidden="true"
        className="-z-10 pointer-events-none absolute inset-x-8 bottom-0 h-8 rounded-full bg-[image:var(--gradient-spectral-soft)] opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-90"
      />
    </motion.div>
  )
}
