import type { VistaArea, VistaAreaEstado } from "@nexott-learn/shared-types"
import { motion } from "framer-motion"
import { ModuloRow } from "./modulo-row"

interface AreaSectionProps {
  readonly area: VistaArea
  readonly startIndex: number
}

const EASE_OUT: [number, number, number, number] = [0.2, 0.8, 0.2, 1]

// §4.3.1/2 section label de area + lista de modulos.
export function AreaSection({ area, startIndex }: AreaSectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: EASE_OUT, delay: 0.14 + startIndex * 0.03 }}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-glass-border border-b pb-2">
        <p className="font-medium text-[12px] text-text-muted uppercase tracking-[0.08em]">
          <span className="text-text-secondary">{area.nombre}</span>
          <span className="ml-2 text-text-muted">
            (peso {area.peso}% · objetivo {area.puntajeObjetivo})
          </span>
        </p>
        <span className={pillClassName(area.estado)}>
          <span
            aria-hidden="true"
            className={`size-1.5 rounded-full ${dotClassName(area.estado)}`}
          />
          {area.textoEstado}
        </span>
      </div>
      <div className="flex flex-col gap-2.5">
        {area.modulos.map((modulo, i) => (
          <ModuloRow key={modulo.id} modulo={modulo} index={startIndex + i} />
        ))}
      </div>
    </motion.section>
  )
}

function pillClassName(estado: VistaAreaEstado): string {
  const base =
    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-medium text-[11px]"
  switch (estado) {
    case "CUMPLIDO":
      return `${base} border-success/25 bg-success/12 text-success`
    case "EN_PROGRESO":
      return `${base} border-brand-violet/25 bg-brand-violet/12 text-brand-violet-soft`
    case "SIN_INICIAR":
      return `${base} border-glass-border bg-surface-2 text-text-muted`
    case "SIN_OBLIGACION":
      return `${base} border-brand-cyan/25 bg-brand-cyan/12 text-brand-cyan`
    case "NO_ALCANZADO":
      return `${base} border-danger/25 bg-danger/12 text-danger`
    default: {
      const _exhaustive: never = estado
      return _exhaustive
    }
  }
}

function dotClassName(estado: VistaAreaEstado): string {
  switch (estado) {
    case "CUMPLIDO":
      return "bg-success"
    case "EN_PROGRESO":
      return "bg-brand-violet-soft"
    case "SIN_INICIAR":
      return "bg-text-muted"
    case "SIN_OBLIGACION":
      return "bg-brand-cyan"
    case "NO_ALCANZADO":
      return "bg-danger"
    default: {
      const _exhaustive: never = estado
      return _exhaustive
    }
  }
}
