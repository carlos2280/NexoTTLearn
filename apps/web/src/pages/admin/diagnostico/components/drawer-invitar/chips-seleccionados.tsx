import type { CandidatoDisponible } from "@nexott-learn/shared-types"
import { X } from "lucide-react"

interface ChipsSeleccionadosProps {
  readonly seleccionados: readonly CandidatoDisponible[]
  readonly onQuitar: (candidato: CandidatoDisponible) => void
}

export function ChipsSeleccionados({ seleccionados, onQuitar }: ChipsSeleccionadosProps) {
  if (seleccionados.length === 0) {
    return null
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {seleccionados.map((candidato) => (
        <button
          type="button"
          key={candidato.id}
          onClick={() => onQuitar(candidato)}
          className="group inline-flex items-center gap-1.5 rounded-full border border-brand-violet/40 bg-brand-violet/10 py-1 pr-1 pl-2.5 font-medium text-text-primary text-xs transition-colors hover:border-brand-violet/70 hover:bg-brand-violet/20"
        >
          <span className="max-w-[180px] truncate">
            {candidato.nombre} {candidato.apellido}
          </span>
          <span
            aria-label={`Quitar ${candidato.nombre} ${candidato.apellido}`}
            className="grid size-4 place-items-center rounded-full text-text-muted group-hover:text-text-primary"
          >
            <X className="size-3" strokeWidth={2} aria-hidden="true" />
          </span>
        </button>
      ))}
    </div>
  )
}
