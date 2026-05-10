import { cn } from "@/shared/lib/cn"
import type { CandidatoDisponible } from "@nexott-learn/shared-types"
import { Check, Loader2, UserSearch } from "lucide-react"
import { AvatarIniciales } from "../avatar-iniciales"

interface ListaCandidatosProps {
  readonly items: readonly CandidatoDisponible[]
  readonly idsSeleccionados: ReadonlySet<string>
  readonly onToggle: (candidato: CandidatoDisponible) => void
  readonly cargando: boolean
  readonly truncado: boolean
  readonly busqueda: string
}

export function ListaCandidatos({
  items,
  idsSeleccionados,
  onToggle,
  cargando,
  truncado,
  busqueda,
}: ListaCandidatosProps) {
  if (cargando && items.length === 0) {
    return (
      <div className="flex items-center justify-center py-10 text-text-muted">
        <Loader2 className="size-5 animate-spin" aria-hidden="true" />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center text-text-muted">
        <UserSearch className="size-6" aria-hidden="true" />
        <p className="text-sm">
          {busqueda
            ? `Sin resultados para "${busqueda}"`
            : "No hay participantes disponibles para invitar."}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      <ul className="flex flex-col gap-1">
        {items.map((candidato) => {
          const seleccionado = idsSeleccionados.has(candidato.id)
          return (
            <li key={candidato.id}>
              <button
                type="button"
                onClick={() => onToggle(candidato)}
                aria-pressed={seleccionado}
                className={cn(
                  "flex w-full items-center gap-3 rounded-[var(--radius-md)] px-2 py-2",
                  "text-left transition-colors",
                  "hover:bg-glass-2 focus-visible:outline-none focus-visible:ring-2",
                  "focus-visible:ring-brand-violet",
                  seleccionado && "bg-brand-violet/10",
                )}
              >
                <AvatarIniciales nombre={candidato.nombre} apellido={candidato.apellido} />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-medium text-sm text-text-primary">
                    {candidato.nombre} {candidato.apellido}
                  </span>
                  <span className="truncate text-text-muted text-xs">{candidato.email}</span>
                </div>
                <span
                  aria-hidden="true"
                  className={cn(
                    "grid size-5 shrink-0 place-items-center rounded border",
                    seleccionado
                      ? "border-brand-violet bg-brand-violet text-white"
                      : "border-glass-border bg-transparent",
                  )}
                >
                  {seleccionado ? <Check className="size-3.5" strokeWidth={2.5} /> : null}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      {truncado ? (
        <p className="px-2 pt-2 text-text-muted text-xs">
          Mostrando los primeros resultados. Refina la búsqueda para ver más.
        </p>
      ) : null}
    </div>
  )
}
