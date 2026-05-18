import { Button } from "@/shared/components/ui/button"
import { SearchField } from "@/shared/components/ui/search-field"
import { Select, SelectItem } from "@/shared/components/ui/select"
import { Tooltip } from "@/shared/components/ui/tooltip"
import { cn } from "@/shared/lib/cn"
import type { ClienteResponse } from "@nexott-learn/shared-types"
import { Archive, Plus } from "lucide-react"

const TODOS_CLIENTES = "__todos__"

interface CursosFiltrosProps {
  readonly busqueda: string
  readonly onBusqueda: (v: string) => void
  readonly clienteId: string
  readonly onClienteId: (v: string) => void
  readonly clientes: readonly ClienteResponse[]
  readonly cargandoClientes: boolean
  readonly mostrarToggleArchivados: boolean
  readonly incluirArchivados: boolean
  readonly onIncluirArchivados: (v: boolean) => void
  readonly onNuevoCurso: () => void
}

export function CursosFiltros({
  busqueda,
  onBusqueda,
  clienteId,
  onClienteId,
  clientes,
  cargandoClientes,
  mostrarToggleArchivados,
  incluirArchivados,
  onIncluirArchivados,
  onNuevoCurso,
}: CursosFiltrosProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <SearchField
          valor={busqueda}
          onCambio={onBusqueda}
          placeholder="Buscar curso por título…"
        />
        <Select
          compact={true}
          value={clienteId === "" ? TODOS_CLIENTES : clienteId}
          onValueChange={(v) => onClienteId(v === TODOS_CLIENTES ? "" : v)}
          aria-label="Filtrar por cliente"
          className="min-w-[200px]"
          disabled={cargandoClientes}
        >
          <SelectItem value={TODOS_CLIENTES}>Todos los clientes</SelectItem>
          {clientes.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.nombre}
            </SelectItem>
          ))}
        </Select>
        {mostrarToggleArchivados ? (
          <ToggleArchivados
            activo={incluirArchivados}
            onAlternar={() => onIncluirArchivados(!incluirArchivados)}
          />
        ) : null}
      </div>
      <Button variant="primary" size="md" onClick={onNuevoCurso}>
        <Plus className="h-4 w-4" strokeWidth={1.75} aria-hidden={true} />
        Nuevo curso
      </Button>
    </div>
  )
}

interface ToggleArchivadosProps {
  readonly activo: boolean
  readonly onAlternar: () => void
}

function ToggleArchivados({ activo, onAlternar }: ToggleArchivadosProps) {
  return (
    <Tooltip contenido={activo ? "Ocultar archivados" : "Incluir archivados"} side="bottom">
      <button
        type="button"
        role="switch"
        aria-checked={activo}
        aria-label={activo ? "Ocultar cursos archivados" : "Incluir cursos archivados"}
        onClick={onAlternar}
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-pill",
          "border shadow-xs transition-[background-color,border-color,box-shadow,color] duration-base ease-default",
          "focus-visible:border-aurora-violet focus-visible:shadow-ring-aurora-soft focus-visible:outline-none",
          activo
            ? "border-accent/40 bg-accent-soft text-accent"
            : "border-border-strong bg-surface text-text-secondary hover:border-border-emphasis hover:text-text-primary hover:shadow-sm",
        )}
      >
        <Archive className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
      </button>
    </Tooltip>
  )
}
