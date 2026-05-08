import { cn } from "@/shared/lib/cn"
import type { VistaHitoEntrevista, VistaHitoTransversal } from "@nexott-learn/shared-types"
import { motion } from "framer-motion"
import { ChevronRight, Flag, type LucideIcon, MessageSquare } from "lucide-react"
import { Link } from "react-router-dom"
import { hitoVisual } from "./hito-presets"
import { HitoRequisitos } from "./hito-requisitos"

interface HitoCardProps {
  readonly hito: VistaHitoTransversal | VistaHitoEntrevista
  readonly index: number
}

const EASE_OUT: [number, number, number, number] = [0.2, 0.8, 0.2, 1]

// §4.4 hito card. Variante TRANSVERSAL o ENTREVISTA. Estados con visuales
// distintos (BLOQUEADO/DISPONIBLE/EN_REVISION/APROBADO/REPROBADO_*).
export function HitoCard({ hito, index }: HitoCardProps) {
  const visual = hitoVisual(hito.estado)
  const Icono = iconoHito(hito.variante)
  const navegable = hito.href !== null && !visual.bloqueado

  const inner = (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-4">
        <div
          className={cn(
            "grid size-12 shrink-0 place-items-center rounded-2xl border shadow-sm",
            visual.iconWrapClass,
          )}
        >
          <Icono className="size-5" strokeWidth={1.75} />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-[16px] text-text-primary leading-tight">{hito.titulo}</h3>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-medium text-[11px]",
                visual.pillClass,
              )}
            >
              {hito.textoEstado}
            </span>
          </div>
          <p className="text-[13.5px] text-text-secondary leading-snug">{hito.resumen}</p>
        </div>
        {navegable ? (
          <ChevronRight
            className="size-4 shrink-0 self-center text-brand-violet transition-transform group-hover/hito:translate-x-[2px]"
            strokeWidth={2}
          />
        ) : null}
      </div>
      <HitoRequisitos requisitos={hito.requisitos} />
    </div>
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.36, ease: EASE_OUT, delay: 0.36 + index * 0.08 }}
    >
      {navegable && hito.href !== null ? (
        <Link
          to={hito.href}
          className="group/hito hover:-translate-y-[2px] block rounded-2xl border border-glass-border bg-surface-1 p-5 transition-all duration-300 hover:border-glass-border-strong hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-violet/40"
        >
          {inner}
        </Link>
      ) : (
        <div
          aria-disabled={visual.bloqueado}
          className="rounded-2xl border border-glass-border bg-surface-1 p-5"
        >
          {inner}
        </div>
      )}
    </motion.div>
  )
}

function iconoHito(variante: "TRANSVERSAL" | "ENTREVISTA"): LucideIcon {
  switch (variante) {
    case "TRANSVERSAL":
      return Flag
    case "ENTREVISTA":
      return MessageSquare
    default: {
      const _exhaustive: never = variante
      return _exhaustive
    }
  }
}
