import { SearchField } from "@/shared/components/ui/search-field"
import { Select, SelectItem } from "@/shared/components/ui/select"
import type { AreaResponse, EstadoSkill } from "@nexott-learn/shared-types"

type FiltroEstado = "TODAS" | EstadoSkill

const TODAS_AREAS = "__todas__"

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
        value={areaFiltroId === "" ? TODAS_AREAS : areaFiltroId}
        onValueChange={(v) => onArea(v === TODAS_AREAS ? "" : v)}
        aria-label="Filtrar por área"
        className="min-w-[160px]"
      >
        <SelectItem value={TODAS_AREAS}>Todas las áreas</SelectItem>
        {areas.map((a) => (
          <SelectItem key={a.id} value={a.id}>
            {a.nombre}
          </SelectItem>
        ))}
      </Select>
      <Select
        compact={true}
        value={estadoFiltro}
        onValueChange={(v) => onEstado(v as FiltroEstado)}
        aria-label="Filtrar por estado"
        className="min-w-[140px]"
      >
        <SelectItem value="TODAS">Todos los estados</SelectItem>
        <SelectItem value="ACTIVA">Activas</SelectItem>
        <SelectItem value="ARCHIVADA">Archivadas</SelectItem>
      </Select>
    </div>
  )
}
