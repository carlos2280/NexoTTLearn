import { useListarModulos } from "@/features/catalogo/hooks/use-listar-modulos"
import { Button } from "@/shared/components/ui/button"
import { DataTable } from "@/shared/components/ui/data-table"
import { MenuAcciones } from "@/shared/components/ui/menu-acciones"
import { Pagination } from "@/shared/components/ui/pagination"
import { SearchField } from "@/shared/components/ui/search-field"
import { Select } from "@/shared/components/ui/select"
import type { EstadoModulo } from "@nexott-learn/shared-types"
import { Library, Plus } from "lucide-react"
import { useState } from "react"
import { accionesPorModulo } from "./modulos-acciones-menu"
import { COLUMNAS_MODULOS } from "./modulos-columnas"
import { ModulosDialogos } from "./modulos-dialogos"
import { useModulosOrquestacion } from "./use-modulos-orquestacion"

type FiltroEstado = "TODOS" | EstadoModulo

export function TabModulos() {
  const [busqueda, setBusqueda] = useState("")
  const [page, setPage] = useState(1)
  const [estadoFiltro, setEstadoFiltro] = useState<FiltroEstado>("TODOS")
  const pageSize = 20

  const { data, isLoading } = useListarModulos({
    page,
    pageSize,
    q: busqueda.length >= 2 ? busqueda : undefined,
    estado: estadoFiltro === "TODOS" ? undefined : estadoFiltro,
  })
  const orq = useModulosOrquestacion()

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <SearchField
            valor={busqueda}
            onCambio={(v) => {
              setBusqueda(v)
              setPage(1)
            }}
            placeholder="Buscar por título o descripción…"
          />
          <Select
            compact={true}
            value={estadoFiltro}
            onChange={(e) => {
              setEstadoFiltro(e.target.value as FiltroEstado)
              setPage(1)
            }}
            aria-label="Filtrar por estado"
            className="min-w-[140px]"
          >
            <option value="TODOS">Todos los estados</option>
            <option value="ACTIVO">Activos</option>
            <option value="ARCHIVADO">Archivados</option>
          </Select>
        </div>
        <Button variant="primary" size="sm" onClick={() => orq.abrir("crear")}>
          <Plus className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
          Nuevo módulo
        </Button>
      </div>
      <DataTable
        columnas={COLUMNAS_MODULOS}
        filas={data?.data ?? []}
        obtenerKey={(m) => m.id}
        cargando={isLoading && !data}
        vacioIcono={Library}
        vacioTitulo="Aún no hay módulos"
        vacioDescripcion="Crea el primer módulo y empieza a estructurar el aprendizaje."
        accionFila={(m) => (
          <MenuAcciones
            etiquetaAria={`Acciones de ${m.titulo}`}
            grupos={accionesPorModulo(m, orq)}
          />
        )}
      />
      <Pagination
        page={data?.meta.page ?? page}
        pageSize={data?.meta.pageSize ?? pageSize}
        total={data?.meta.total ?? 0}
        onCambiarPage={setPage}
      />
      <ModulosDialogos orq={orq} />
    </div>
  )
}
