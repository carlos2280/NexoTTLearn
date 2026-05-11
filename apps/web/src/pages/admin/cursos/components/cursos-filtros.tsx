import { Button } from "@/shared/components/ui/button"
import { SearchField } from "@/shared/components/ui/search-field"
import { Select } from "@/shared/components/ui/select"
import type { ClienteResponse } from "@nexott-learn/shared-types"
import { Plus } from "lucide-react"

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
          value={clienteId}
          onChange={(e) => onClienteId(e.target.value)}
          aria-label="Filtrar por cliente"
          className="min-w-[200px]"
          disabled={cargandoClientes}
        >
          <option value="">Todos los clientes</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </Select>
        {mostrarToggleArchivados ? (
          <label className="inline-flex items-center gap-2 text-body-sm text-text-secondary">
            <input
              type="checkbox"
              checked={incluirArchivados}
              onChange={(e) => onIncluirArchivados(e.target.checked)}
              className="h-4 w-4 rounded border-border-strong"
            />
            Incluir archivados
          </label>
        ) : null}
      </div>
      <Button variant="primary" size="sm" onClick={onNuevoCurso}>
        <Plus className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
        Nuevo curso
      </Button>
    </div>
  )
}
