import { SearchField } from "@/shared/components/ui/search-field"
import type { RolAvanceFiltro } from "@nexott-learn/shared-types"
import { ListFilter, type LucideIcon, Users } from "lucide-react"
import { ROLES_FILTRO, estadosDisponibles } from "../avance-curso.filtros"

interface AvanceFiltrosProps {
  readonly rol: RolAvanceFiltro
  readonly estado: string
  readonly busqueda: string
  readonly onCambiarRol: (rol: RolAvanceFiltro) => void
  readonly onCambiarEstado: (estado: string) => void
  readonly onCambiarBusqueda: (busqueda: string) => void
}

/**
 * Filtros de la vista ACTUAL del reporte de avance. Por defecto el rol es
 * `ASIGNADO` (asignados); el admin puede pedir voluntarios o ambos. El estado
 * se acota al enum del rol elegido (`estadosDisponibles`). La busqueda
 * (nombre/email) usa el debounce interno de `SearchField`.
 */
export function AvanceFiltros({
  rol,
  estado,
  busqueda,
  onCambiarRol,
  onCambiarEstado,
  onCambiarBusqueda,
}: AvanceFiltrosProps) {
  const opcionesEstado = [{ id: "", etiqueta: "Todos los estados" }, ...estadosDisponibles(rol)]
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface px-5 py-4 shadow-[var(--shadow-card-resting)] md:flex-row md:items-center md:justify-between">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        <SelectFiltro
          icono={Users}
          etiqueta="Rol"
          valor={rol}
          opciones={ROLES_FILTRO}
          onCambio={(v) => onCambiarRol(v as RolAvanceFiltro)}
          ariaLabel="Filtrar por rol de asignación"
        />
        <SelectFiltro
          icono={ListFilter}
          etiqueta="Estado"
          valor={estado}
          opciones={opcionesEstado}
          onCambio={onCambiarEstado}
          ariaLabel="Filtrar por estado de la asignación"
        />
      </div>

      <SearchField
        valor={busqueda}
        onCambio={onCambiarBusqueda}
        placeholder="Buscar por nombre o email…"
        ariaLabel="Buscar colaborador por nombre o email"
      />
    </div>
  )
}

interface SelectFiltroProps {
  readonly icono: LucideIcon
  readonly etiqueta: string
  readonly valor: string
  readonly opciones: readonly { readonly id: string; readonly etiqueta: string }[]
  readonly onCambio: (valor: string) => void
  readonly ariaLabel: string
}

function SelectFiltro({
  icono: Icono,
  etiqueta,
  valor,
  opciones,
  onCambio,
  ariaLabel,
}: SelectFiltroProps) {
  return (
    <label className="flex items-center gap-3">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-subtle text-text-secondary">
        <Icono className="h-[16px] w-[16px]" aria-hidden={true} />
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="nx-eyebrow text-text-tertiary">{etiqueta}</span>
        <select
          value={valor}
          onChange={(e) => onCambio(e.target.value)}
          className="appearance-none bg-transparent pr-4 font-medium text-body text-text-primary outline-none focus-visible:underline focus-visible:decoration-2 focus-visible:decoration-aurora-violet focus-visible:underline-offset-4"
          aria-label={ariaLabel}
        >
          {opciones.map((o) => (
            <option key={o.id} value={o.id}>
              {o.etiqueta}
            </option>
          ))}
        </select>
      </span>
    </label>
  )
}
