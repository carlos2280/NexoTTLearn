import { useListarAreas } from "@/features/catalogo/hooks/use-listar-areas"
import { useListarSkills } from "@/features/catalogo/hooks/use-listar-skills"
import { Button } from "@/shared/components/ui/button"
import { DataTable } from "@/shared/components/ui/data-table"
import { MenuAcciones } from "@/shared/components/ui/menu-acciones"
import { Pagination } from "@/shared/components/ui/pagination"
import type { EstadoSkill } from "@nexott-learn/shared-types"
import { Plus, Sparkles } from "lucide-react"
import { useState } from "react"
import { accionesPorSkill } from "./skills-acciones-menu"
import { columnasSkills } from "./skills-columnas"
import { SkillsDialogos } from "./skills-dialogos"
import { SkillsFiltros } from "./skills-filtros"
import { useSkillsOrquestacion } from "./use-skills-orquestacion"

type FiltroEstado = "TODAS" | EstadoSkill

export function TabSkills() {
  const [busqueda, setBusqueda] = useState("")
  const [page, setPage] = useState(1)
  const [areaFiltroId, setAreaFiltroId] = useState<string>("")
  const [estadoFiltro, setEstadoFiltro] = useState<FiltroEstado>("TODAS")
  const pageSize = 20

  const { data: areasData } = useListarAreas({ page: 1, pageSize: 100 })
  const areas = areasData?.data ?? []
  const { data, isLoading } = useListarSkills({
    page,
    pageSize,
    q: busqueda.length >= 2 ? busqueda : undefined,
    areaId: areaFiltroId || undefined,
    estado: estadoFiltro === "TODAS" ? undefined : estadoFiltro,
  })
  const orq = useSkillsOrquestacion()

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SkillsFiltros
          busqueda={busqueda}
          areaFiltroId={areaFiltroId}
          estadoFiltro={estadoFiltro}
          areas={areas}
          onBusqueda={(v) => {
            setBusqueda(v)
            setPage(1)
          }}
          onArea={(v) => {
            setAreaFiltroId(v)
            setPage(1)
          }}
          onEstado={(v) => {
            setEstadoFiltro(v)
            setPage(1)
          }}
        />
        <Button variant="primary" size="md" onClick={() => orq.abrir("crear")}>
          <Plus className="h-4 w-4" strokeWidth={1.75} aria-hidden={true} />
          Nueva skill
        </Button>
      </div>

      <DataTable
        columnas={columnasSkills(areas)}
        filas={data?.data ?? []}
        obtenerKey={(s) => s.id}
        cargando={isLoading && !data}
        vacioIcono={Sparkles}
        vacioTitulo="Aún no hay skills"
        vacioDescripcion="Crea la primera skill o cambia los filtros."
        accionFila={(s) => (
          <MenuAcciones
            etiquetaAria={`Acciones de ${s.etiquetaVisible}`}
            grupos={accionesPorSkill(s, orq)}
          />
        )}
      />
      <Pagination
        page={data?.meta.page ?? page}
        pageSize={data?.meta.pageSize ?? pageSize}
        total={data?.meta.total ?? 0}
        onCambiarPage={setPage}
      />
      <SkillsDialogos orq={orq} areas={areas} skills={data?.data ?? []} />
    </div>
  )
}
