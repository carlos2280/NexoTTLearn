import { SearchField } from "@/shared/components/ui/search-field"
import type { RolAvanceFiltro } from "@nexott-learn/shared-types"
import { Users } from "lucide-react"
import { ROLES_FILTRO } from "../avance-curso.filtros"

interface AvanceFiltrosProps {
  readonly rol: RolAvanceFiltro
  readonly busqueda: string
  readonly onCambiarRol: (rol: RolAvanceFiltro) => void
  readonly onCambiarBusqueda: (busqueda: string) => void
}

/**
 * Filtros de la vista ACTUAL del reporte de avance. Por defecto el rol es
 * `ASIGNADO` (asignados); el admin puede pedir voluntarios o ambos. La busqueda
 * (nombre/email) usa el debounce interno de `SearchField`.
 */
export function AvanceFiltros({
  rol,
  busqueda,
  onCambiarRol,
  onCambiarBusqueda,
}: AvanceFiltrosProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface px-5 py-4 shadow-[var(--shadow-card-resting)] md:flex-row md:items-center md:justify-between">
      <label className="flex items-center gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-subtle text-text-secondary">
          <Users className="h-[16px] w-[16px]" aria-hidden={true} />
        </span>
        <span className="flex flex-col gap-0.5">
          <span className="nx-eyebrow text-text-tertiary">Rol</span>
          <select
            value={rol}
            onChange={(e) => onCambiarRol(e.target.value as RolAvanceFiltro)}
            className="appearance-none bg-transparent pr-4 font-medium text-body text-text-primary outline-none focus-visible:underline focus-visible:decoration-2 focus-visible:decoration-aurora-violet focus-visible:underline-offset-4"
            aria-label="Filtrar por rol de asignación"
          >
            {ROLES_FILTRO.map((r) => (
              <option key={r.id} value={r.id}>
                {r.etiqueta}
              </option>
            ))}
          </select>
        </span>
      </label>

      <SearchField
        valor={busqueda}
        onCambio={onCambiarBusqueda}
        placeholder="Buscar por nombre o email…"
        ariaLabel="Buscar colaborador por nombre o email"
      />
    </div>
  )
}
