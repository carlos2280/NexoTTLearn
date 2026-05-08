import { cn } from "@/shared/lib/cn"
import type { CatalogoDuracionBanda, CatalogoFiltrosDisponibles } from "@nexott-learn/shared-types"
import type { FiltrosVitrina } from "../lib/parsear-filtros-url"

interface CatalogoFiltrosProps {
  readonly filtros: FiltrosVitrina
  readonly disponibles: CatalogoFiltrosDisponibles
  readonly onChange: (next: FiltrosVitrina) => void
}

// §3 vitrina.md · fila horizontal de pills + dropdowns. Sin sidebar (V-03).
// Filtros se combinan con AND. La pestana "Recomendados" se mantiene pero en
// MVP no devuelve nada distinto (el back marca esRecomendado=false siempre).
export function CatalogoFiltros({ filtros, disponibles, onChange }: CatalogoFiltrosProps) {
  return (
    <section className="flex flex-wrap items-center gap-2 border-glass-border border-b pb-4">
      <PestanaPill
        activa={filtros.pestana === "todos"}
        label="Todos"
        onClick={() => onChange({ ...filtros, pestana: "todos" })}
      />
      <PestanaPill
        activa={filtros.pestana === "recomendados"}
        label="Recomendados"
        onClick={() =>
          onChange({
            ...filtros,
            pestana: filtros.pestana === "recomendados" ? "todos" : "recomendados",
          })
        }
      />

      <span aria-hidden="true" className="mx-1 h-5 w-px bg-glass-border" />

      <FiltroSelect
        label="Area"
        valor={filtros.area ?? ""}
        onChange={(v) => onChange({ ...filtros, area: v === "" ? null : v })}
        opciones={[
          { value: "", label: "Todas" },
          ...disponibles.areas.map((a) => ({ value: a.id, label: a.nombre })),
        ]}
      />

      <FiltroSelect
        label="Duracion"
        valor={filtros.duracion ?? ""}
        onChange={(v) =>
          onChange({ ...filtros, duracion: v === "" ? null : (v as CatalogoDuracionBanda) })
        }
        opciones={[
          { value: "", label: "Cualquiera" },
          ...disponibles.duraciones.map((d) => ({ value: d.id, label: d.label })),
        ]}
      />
    </section>
  )
}

interface PestanaPillProps {
  readonly activa: boolean
  readonly label: string
  readonly onClick: () => void
}

function PestanaPill({ activa, label, onClick }: PestanaPillProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={activa}
      className={cn(
        "rounded-full px-3.5 py-1.5 font-medium text-[12.5px] transition-colors duration-200",
        activa
          ? "border border-brand-violet/50 bg-brand-violet/15 text-brand-violet-soft"
          : "border border-glass-border bg-surface-1 text-text-secondary hover:bg-surface-2",
      )}
    >
      {label}
    </button>
  )
}

interface FiltroSelectProps {
  readonly label: string
  readonly valor: string
  readonly onChange: (next: string) => void
  readonly opciones: ReadonlyArray<{ value: string; label: string }>
}

function FiltroSelect({ label, valor, onChange, opciones }: FiltroSelectProps) {
  return (
    <label className="flex items-center gap-2 rounded-full border border-glass-border bg-surface-1 py-1.5 pr-2 pl-3 text-text-secondary">
      <span className="text-[11.5px] text-text-muted uppercase tracking-[0.06em]">{label}</span>
      <select
        value={valor}
        onChange={(e) => onChange(e.currentTarget.value)}
        className="bg-transparent text-[12.5px] text-text-primary focus:outline-none"
      >
        {opciones.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

interface FiltrosResumenProps {
  readonly filtros: FiltrosVitrina
  readonly onLimpiar: () => void
}

export function FiltrosResumenLimpiar({ filtros, onLimpiar }: FiltrosResumenProps) {
  const cantidad =
    (filtros.q.trim().length > 0 ? 1 : 0) +
    (filtros.area ? 1 : 0) +
    (filtros.duracion ? 1 : 0) +
    (filtros.pestana !== "todos" ? 1 : 0)
  if (cantidad === 0) {
    return null
  }
  return (
    <button
      type="button"
      onClick={onLimpiar}
      className="self-start rounded-full border border-glass-border bg-surface-1 px-3 py-1.5 font-medium text-[12px] text-text-secondary hover:bg-surface-2"
    >
      Limpiar filtros ({cantidad})
    </button>
  )
}
