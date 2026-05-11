import { SearchField } from "@/shared/components/ui/search-field"
import { Select } from "@/shared/components/ui/select"
import type { AreaResponse, EstadoSkill } from "@nexott-learn/shared-types"

type FiltroEstado = "TODAS" | EstadoSkill

interface SkillsFiltrosProps {
  readonly busqueda: string
  readonly areaFiltroId: string
  readonly estadoFiltro: FiltroEstado
  readonly areas: readonly AreaResponse[]
  readonly onBusqueda: (v: string) => void
  readonly onArea: (v: string) => void
  readonly onEstado: (v: FiltroEstado) => void
}

export function SkillsFiltros({
  busqueda,
  areaFiltroId,
  estadoFiltro,
  areas,
  onBusqueda,
  onArea,
  onEstado,
}: SkillsFiltrosProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <SearchField valor={busqueda} onCambio={onBusqueda} placeholder="Buscar skill…" />
      <Select
        compact={true}
        value={areaFiltroId}
        onChange={(e) => onArea(e.target.value)}
        aria-label="Filtrar por área"
        className="min-w-[160px]"
      >
        <option value="">Todas las áreas</option>
        {areas.map((a) => (
          <option key={a.id} value={a.id}>
            {a.nombre}
          </option>
        ))}
      </Select>
      <Select
        compact={true}
        value={estadoFiltro}
        onChange={(e) => onEstado(e.target.value as FiltroEstado)}
        aria-label="Filtrar por estado"
        className="min-w-[140px]"
      >
        <option value="TODAS">Todos los estados</option>
        <option value="ACTIVA">Activas</option>
        <option value="ARCHIVADA">Archivadas</option>
      </Select>
    </div>
  )
}
