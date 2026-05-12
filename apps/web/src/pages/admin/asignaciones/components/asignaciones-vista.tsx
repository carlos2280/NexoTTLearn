import { useListarAsignaciones } from "@/features/asignaciones/hooks/use-listar-asignaciones"
import { Button } from "@/shared/components/ui/button"
import { DataTable } from "@/shared/components/ui/data-table"
import { MenuAcciones } from "@/shared/components/ui/menu-acciones"
import { Pagination } from "@/shared/components/ui/pagination"
import { SearchField } from "@/shared/components/ui/search-field"
import { Tabs } from "@/shared/components/ui/tabs"
import type { Asignacion, RolAsignacion } from "@nexott-learn/shared-types"
import { UserPlus, Users } from "lucide-react"
import { useMemo, useState } from "react"
import type { DialogoAbierto } from "../asignaciones.types"
import { obtenerAccionesAsignacion } from "./acciones-asignacion"
import { construirColumnasAsignaciones } from "./asignaciones-columnas"
import { AsignacionesDialogos } from "./asignaciones-dialogos"
import { PeekAsignacion } from "./peek-asignacion"

const PAGE_SIZE = 20
type TabRol = "TODOS" | RolAsignacion

const ORDEN_TABS: readonly TabRol[] = ["TODOS", "ASIGNADO", "VOLUNTARIO"]

function etiquetaTab(t: TabRol): string {
  if (t === "ASIGNADO") {
    return "Asignados"
  }
  if (t === "VOLUNTARIO") {
    return "Voluntarios"
  }
  return "Todos"
}

interface Props {
  readonly cursoId: string
}

export function AsignacionesVista({ cursoId }: Props) {
  const [rolTab, setRolTab] = useState<TabRol>("TODOS")
  const [busqueda, setBusqueda] = useState("")
  const [page, setPage] = useState(1)
  const [dialogo, setDialogo] = useState<DialogoAbierto | null>(null)
  const [peekId, setPeekId] = useState<string | null>(null)

  const listadoQuery = useListarAsignaciones(cursoId, {
    page,
    pageSize: PAGE_SIZE,
    rol: rolTab === "TODOS" ? undefined : rolTab,
    q: busqueda.trim().length >= 2 ? busqueda.trim() : undefined,
  })

  const columnas = useMemo(() => construirColumnasAsignaciones(), [])

  function disparar(accion: DialogoAbierto["accion"], asignacion?: Asignacion) {
    setDialogo({ accion, asignacion })
  }

  function cambiarTab(nuevo: TabRol) {
    setRolTab(nuevo)
    setPage(1)
  }

  return (
    <div className="flex flex-col gap-5">
      <Tabs<TabRol>
        items={ORDEN_TABS.map((id) => ({ id, etiqueta: etiquetaTab(id) }))}
        activa={rolTab}
        onCambiar={cambiarTab}
        etiquetaAria="Rol de asignación"
      />

      <div className="flex flex-wrap items-center gap-3">
        <SearchField
          valor={busqueda}
          onCambio={(v) => {
            setBusqueda(v)
            setPage(1)
          }}
          placeholder="Buscar por nombre o email…"
        />
        <div className="ms-auto">
          <Button
            variant="primary"
            size="sm"
            type="button"
            onClick={() => disparar("asignar-batch")}
          >
            <UserPlus className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
            Asignar colaboradores
          </Button>
        </div>
      </div>

      <DataTable
        columnas={columnas}
        filas={listadoQuery.data?.data ?? []}
        obtenerKey={(a) => a.id}
        cargando={listadoQuery.isLoading && !listadoQuery.data}
        vacioIcono={Users}
        vacioTitulo="No hay asignaciones"
        vacioDescripcion="Asigna colaboradores o cambia de pestaña para ver otro rol."
        onClickFila={(a) => setPeekId(a.id)}
        accionFila={(a) => {
          const grupos = obtenerAccionesAsignacion(a, disparar)
          if (grupos.length === 0) {
            return null
          }
          return (
            <MenuAcciones
              etiquetaAria={`Acciones de ${a.colaborador.nombreCompleto}`}
              grupos={grupos}
            />
          )
        }}
      />

      <Pagination
        page={listadoQuery.data?.meta.page ?? page}
        pageSize={listadoQuery.data?.meta.pageSize ?? PAGE_SIZE}
        total={listadoQuery.data?.meta.total ?? 0}
        onCambiarPage={setPage}
      />

      <AsignacionesDialogos cursoId={cursoId} dialogo={dialogo} onCerrar={() => setDialogo(null)} />

      <PeekAsignacion asignacionId={peekId} onCerrar={() => setPeekId(null)} />
    </div>
  )
}
