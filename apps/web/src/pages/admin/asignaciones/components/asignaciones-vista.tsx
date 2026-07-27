import { useListarAsignaciones } from "@/features/asignaciones/hooks/use-listar-asignaciones"
import {
  ESTADO_ACTIVOS,
  opcionesSelectorEstado,
  parsearSeleccionEstado,
  resolverFiltroEstado,
} from "@/features/asignaciones/lib/estados-filtro"
import { BandaEvaluacionInicial } from "@/features/evaluacion-inicial/components/banda-evaluacion-inicial"
import { Button } from "@/shared/components/ui/button"
import { DataTable } from "@/shared/components/ui/data-table"
import { MenuAcciones } from "@/shared/components/ui/menu-acciones"
import { Pagination } from "@/shared/components/ui/pagination"
import { SearchField } from "@/shared/components/ui/search-field"
import { Select, SelectItem } from "@/shared/components/ui/select"
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
  readonly nombreCurso?: string
  /**
   * Si el curso entrega el perfil a un cliente externo. Cuando es `false`,
   * la UI oculta la fase "entrevista cliente" (sección en peek, accion de
   * registrar resultado) y renombra "Apto/No apto" a "Aprobado/No aprobado".
   */
  readonly tieneEntregaACliente: boolean
}

export function AsignacionesVista({ cursoId, nombreCurso, tieneEntregaACliente }: Props) {
  const [rolTab, setRolTab] = useState<TabRol>("TODOS")
  const [estadoSel, setEstadoSel] = useState<string>(ESTADO_ACTIVOS)
  const [busqueda, setBusqueda] = useState("")
  const [page, setPage] = useState(1)
  const [dialogo, setDialogo] = useState<DialogoAbierto | null>(null)
  const [peekId, setPeekId] = useState<string | null>(null)

  const filtroEstado = resolverFiltroEstado(estadoSel)
  const listadoQuery = useListarAsignaciones(cursoId, {
    page,
    pageSize: PAGE_SIZE,
    rol: rolTab === "TODOS" ? undefined : rolTab,
    q: busqueda.trim().length >= 2 ? busqueda.trim() : undefined,
    ...filtroEstado,
  })

  const columnas = useMemo(
    () => construirColumnasAsignaciones(tieneEntregaACliente),
    [tieneEntregaACliente],
  )

  function disparar(accion: DialogoAbierto["accion"], asignacion?: Asignacion) {
    setDialogo({ accion, asignacion })
  }

  function cambiarTab(nuevo: TabRol) {
    setRolTab(nuevo)
    // Un estado que no existe en el rol nuevo (p. ej. APTO al pasar a
    // voluntarios) dejaria la tabla vacia como si no hubiera nadie.
    setEstadoSel((actual) => parsearSeleccionEstado(actual, nuevo))
    setPage(1)
  }

  function cambiarEstado(nuevo: string) {
    setEstadoSel(nuevo)
    setPage(1)
  }

  return (
    <div className="flex flex-col gap-5">
      <BandaEvaluacionInicial cursoId={cursoId} nombreCurso={nombreCurso ?? "este curso"} />

      <Tabs<TabRol>
        items={ORDEN_TABS.map((id) => ({ id, etiqueta: etiquetaTab(id) }))}
        activa={rolTab}
        onCambiar={cambiarTab}
        etiquetaAria="Participación en el curso"
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
        <div className="flex items-center gap-2">
          <span className="nx-eyebrow text-text-tertiary">Estado</span>
          <Select
            variant="ghost"
            compact={true}
            value={estadoSel}
            onValueChange={cambiarEstado}
            aria-label="Filtrar por estado"
            className="w-auto"
          >
            {opcionesSelectorEstado(rolTab).map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.etiqueta}
              </SelectItem>
            ))}
          </Select>
        </div>
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
          const grupos = obtenerAccionesAsignacion(a, disparar, tieneEntregaACliente)
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

      <AsignacionesDialogos
        cursoId={cursoId}
        dialogo={dialogo}
        onCerrar={() => setDialogo(null)}
        tieneEntregaACliente={tieneEntregaACliente}
      />

      <PeekAsignacion
        asignacionId={peekId}
        onCerrar={() => setPeekId(null)}
        tieneEntregaACliente={tieneEntregaACliente}
      />
    </div>
  )
}
