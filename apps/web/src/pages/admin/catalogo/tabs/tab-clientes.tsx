import { useListarClientes } from "@/features/catalogo/hooks/use-listar-clientes"
import { Button } from "@/shared/components/ui/button"
import { DataTable } from "@/shared/components/ui/data-table"
import { MenuAcciones } from "@/shared/components/ui/menu-acciones"
import { Pagination } from "@/shared/components/ui/pagination"
import { SearchField } from "@/shared/components/ui/search-field"
import { Select } from "@/shared/components/ui/select"
import { Building2, Plus } from "lucide-react"
import { useState } from "react"
import { accionesPorCliente } from "./clientes-acciones-menu"
import { COLUMNAS_CLIENTES } from "./clientes-columnas"
import { ClientesDialogos } from "./clientes-dialogos"
import { useClientesOrquestacion } from "./use-clientes-orquestacion"

type FiltroActivo = "TODOS" | "ACTIVOS" | "INACTIVOS"

function aBoolFiltro(v: FiltroActivo): boolean | undefined {
  if (v === "ACTIVOS") {
    return true
  }
  if (v === "INACTIVOS") {
    return false
  }
  return undefined
}

export function TabClientes() {
  const [busqueda, setBusqueda] = useState("")
  const [page, setPage] = useState(1)
  const [filtroActivo, setFiltroActivo] = useState<FiltroActivo>("TODOS")
  const pageSize = 20

  const { data, isLoading } = useListarClientes({
    page,
    pageSize,
    q: busqueda.length >= 2 ? busqueda : undefined,
    activo: aBoolFiltro(filtroActivo),
  })
  const orq = useClientesOrquestacion()

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
            placeholder="Buscar cliente por nombre…"
          />
          <Select
            compact={true}
            value={filtroActivo}
            onChange={(e) => {
              setFiltroActivo(e.target.value as FiltroActivo)
              setPage(1)
            }}
            aria-label="Filtrar por estado"
            className="min-w-[160px]"
          >
            <option value="TODOS">Todos los estados</option>
            <option value="ACTIVOS">Solo activos</option>
            <option value="INACTIVOS">Solo inactivos</option>
          </Select>
        </div>
        <Button variant="primary" size="sm" onClick={() => orq.abrir("crear")}>
          <Plus className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
          Nuevo cliente
        </Button>
      </div>
      <DataTable
        columnas={COLUMNAS_CLIENTES}
        filas={data?.data ?? []}
        obtenerKey={(c) => c.id}
        cargando={isLoading && !data}
        vacioIcono={Building2}
        vacioTitulo="Aún no hay clientes"
        vacioDescripcion="Cuando un cliente solicite un perfil, podrás registrarlo aquí."
        accionFila={(c) => (
          <MenuAcciones
            etiquetaAria={`Acciones de ${c.nombre}`}
            grupos={accionesPorCliente(c, orq)}
          />
        )}
      />
      <Pagination
        page={data?.meta.page ?? page}
        pageSize={data?.meta.pageSize ?? pageSize}
        total={data?.meta.total ?? 0}
        onCambiarPage={setPage}
      />
      <ClientesDialogos orq={orq} />
    </div>
  )
}
