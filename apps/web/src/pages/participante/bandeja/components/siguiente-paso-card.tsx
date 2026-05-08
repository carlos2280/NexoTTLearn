import type { BandejaSiguientePaso } from "@nexott-learn/shared-types"
import { motion } from "framer-motion"
import { ChevronRight, Flag, Layers, MessageSquare, Trophy } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Link } from "react-router-dom"

interface SiguientePasoCardProps {
  readonly paso: BandejaSiguientePaso
}

const EASE_OUT: [number, number, number, number] = [0.2, 0.8, 0.2, 1]

// §4.2 doc canonico. Card glass con bar lateral 96x96 (gradiente del curso —
// brand por defecto hasta tener gradiente por curso en backend), reflejo
// superior (highlight cristal), glow espectral inferior en hover (firma
// NexoTT), label uppercase, titulo 22px, contexto + progress, CTA chevron.
export function SiguientePasoCard({ paso }: SiguientePasoCardProps) {
  const Icono = iconoVariante(paso)
  const porcentaje = paso.variante === "MODULO" ? paso.porcentajeAvance : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: EASE_OUT, delay: 0.24 }}
      className="group relative"
    >
      <Link
        to={paso.href}
        className="group/link hover:-translate-y-[3px] relative flex items-stretch gap-5 overflow-hidden rounded-[20px] border border-glass-border bg-surface-1 p-5 shadow-md transition-transform duration-300 ease-out hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-violet/50"
      >
        {/* Reflejo superior (highlight de cristal) */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/[0.06] to-transparent"
        />

        {/* Bar lateral 96x96 con gradiente + circulos decorativos */}
        <div className="relative grid size-24 shrink-0 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-brand-violet to-brand-cyan shadow-md">
          <Icono
            className="size-7 text-white drop-shadow-[0_2px_8px_rgb(0_0_0_/_0.35)] transition-transform duration-300 group-hover/link:scale-110"
            strokeWidth={1.75}
          />
          <span
            aria-hidden="true"
            className="-top-3 -right-3 absolute size-12 rounded-full bg-white/12"
          />
          <span
            aria-hidden="true"
            className="-bottom-4 -left-4 absolute size-16 rounded-full bg-white/8"
          />
        </div>

        {/* Body */}
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
          <p className="font-medium text-[11px] text-text-muted uppercase tracking-[0.08em]">
            Tu siguiente paso
          </p>
          <h2 className="truncate font-bold text-[22px] text-text-primary leading-tight">
            {paso.titulo}
          </h2>
          <div className="flex min-w-0 items-center gap-2 text-sm text-text-secondary">
            <span className="truncate">{paso.contexto}</span>
            {porcentaje !== null ? <BarraProgreso porcentaje={porcentaje} /> : null}
          </div>
        </div>

        {/* CTA */}
        <div className="flex shrink-0 items-center gap-1 self-center font-semibold text-brand-violet text-sm transition-transform duration-300 group-hover/link:translate-x-[2px]">
          <span>{paso.cta}</span>
          <ChevronRight className="size-4" strokeWidth={2} />
        </div>
      </Link>

      {/* Glow espectral inferior — firma NexoTT en hover */}
      <span
        aria-hidden="true"
        className="-z-10 pointer-events-none absolute inset-x-6 bottom-0 h-12 rounded-full bg-[image:var(--gradient-spectral-soft)] opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
      />
    </motion.div>
  )
}

function BarraProgreso({ porcentaje }: { readonly porcentaje: number }) {
  const completado = porcentaje >= 100
  const widthStyle = { width: `${Math.min(100, Math.max(0, porcentaje))}%` }
  return (
    <div className="flex shrink-0 items-center gap-2">
      <div className="h-1.5 w-[100px] overflow-hidden rounded-full bg-surface-2">
        <div
          className={
            completado
              ? "h-full rounded-full bg-success"
              : "h-full rounded-full bg-gradient-to-r from-brand-violet to-brand-cyan"
          }
          style={widthStyle}
        />
      </div>
      <span className="text-text-muted text-xs tabular-nums">{porcentaje}%</span>
    </div>
  )
}

function iconoVariante(paso: BandejaSiguientePaso): LucideIcon {
  switch (paso.variante) {
    case "MODULO":
      return Layers
    case "TRANSVERSAL":
      return Flag
    case "ENTREVISTA":
      return MessageSquare
    case "CURSO_COMPLETADO":
      return Trophy
    default: {
      const _exhaustive: never = paso
      return _exhaustive
    }
  }
}
