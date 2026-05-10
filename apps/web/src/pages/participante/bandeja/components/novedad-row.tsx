import { cn } from "@/shared/lib/cn"
import type { NovedadItem, NovedadTipo } from "@nexott-learn/shared-types"
import { motion } from "framer-motion"
import {
  BarChart3,
  CheckCircle2,
  Cloud,
  type LucideIcon,
  MessageSquare,
  PlusCircle,
  RefreshCw,
  Trophy,
} from "lucide-react"
import { Link } from "react-router-dom"

interface NovedadRowProps {
  readonly item: NovedadItem
  readonly index: number
}

const EASE_OUT: [number, number, number, number] = [0.2, 0.8, 0.2, 1]

// §4.3.2 stream-item compacto. icon-wrap 40x40 con gradiente del tipo +
// body + result chip. No-leida: dot pulsante violet + border mas marcado.
export function NovedadRow({ item, index }: NovedadRowProps) {
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
        className={cn(
          "group/link hover:-translate-y-[2px] relative flex items-center gap-3 rounded-2xl border bg-surface-1 px-3 py-2.5 transition-all duration-300 ease-out hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-violet/50",
          item.leida
            ? "border-glass-border"
            : "border-brand-violet/35 shadow-[0_0_0_1px_rgb(124_58_237_/_0.18)]",
        )}
      >
        {item.leida ? null : (
          <span
            aria-hidden={true}
            className="size-1.5 shrink-0 rounded-full bg-brand-violet [animation:pulse-glow_2.6s_var(--ease-in-out)_infinite]"
          />
        )}
        <div
          className={`relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-gradient-to-br ${gradientePorTipo(item.tipo)} shadow-sm`}
        >
          <Icono
            className="size-4 text-white drop-shadow-[0_1px_3px_rgb(0_0_0_/_0.25)]"
            strokeWidth={1.75}
          />
          <span
            aria-hidden="true"
            className="-top-1 -right-1 absolute size-4 rounded-full bg-white/12"
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <p className="truncate font-medium text-sm text-text-primary">{item.titulo}</p>
          <p className="truncate text-text-muted text-xs">{item.meta}</p>
        </div>
        {item.resultado ? (
          <span className="rounded-full border border-glass-border bg-surface-2 px-2.5 py-0.5 font-semibold text-text-secondary text-xs tabular-nums">
            {item.resultado}
          </span>
        ) : null}
      </Link>
    </motion.div>
  )
}

function iconoPorTipo(tipo: NovedadTipo): LucideIcon {
  switch (tipo) {
    case "EVALUADO":
      return CheckCircle2
    case "DESBLOQUEADO":
      return PlusCircle
    case "FEEDBACK":
      return MessageSquare
    case "ASIGNADO":
      return Cloud
    case "DIAGNOSTICO":
      return BarChart3
    case "RECALCULO":
      return RefreshCw
    case "CURSO_COMPLETADO":
      return Trophy
    default: {
      const _exhaustive: never = tipo
      return _exhaustive
    }
  }
}

function gradientePorTipo(tipo: NovedadTipo): string {
  switch (tipo) {
    case "EVALUADO":
      return "from-emerald-700 to-emerald-400"
    case "DESBLOQUEADO":
      return "from-indigo-700 to-indigo-400"
    case "FEEDBACK":
      return "from-violet-700 to-violet-400"
    case "ASIGNADO":
      return "from-sky-700 to-sky-400"
    case "DIAGNOSTICO":
      return "from-amber-700 to-amber-400"
    case "RECALCULO":
      return "from-slate-600 to-slate-400"
    case "CURSO_COMPLETADO":
      return "from-fuchsia-700 to-fuchsia-400"
    default: {
      const _exhaustive: never = tipo
      return _exhaustive
    }
  }
}
