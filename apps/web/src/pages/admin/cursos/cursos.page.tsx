import { useListarClientes } from "@/features/catalogo/hooks/use-listar-clientes"
import { useListarCursos } from "@/features/cursos/hooks/use-listar-cursos"
import { DataTable } from "@/shared/components/ui/data-table"
import { MenuAcciones } from "@/shared/components/ui/menu-acciones"
import { Pagination } from "@/shared/components/ui/pagination"
import { Tabs } from "@/shared/components/ui/tabs"
import type { EstadoCurso } from "@nexott-learn/shared-types"
import { BookOpen } from "lucide-react"
import { useMemo, useState } from "react"
import { accionesPorCurso } from "./components/cursos-acciones-menu"
import { construirColumnasCursos } from "./components/cursos-columnas"
import { CursosDialogos } from "./components/cursos-dialogos"
import { CursosFiltros } from "./components/cursos-filtros"
import { useContadoresCursos } from "./hooks/use-contadores-cursos"
import { useCursosOrquestacion } from "./hooks/use-cursos-orquestacion"

function etiquetaTab(estado: EstadoCurso): string {
  if (estado === "ACTIVO") {
    return "Activos"
  }
  if (estado === "BORRADOR") {
    return "Borradores"
  }
  if (estado === "CERRADO") {
    return "Cerrados"
  }
  return "Archivados"
}

const ORDEN_TABS: readonly EstadoCurso[] = ["ACTIVO", "BORRADOR", "CERRADO", "ARCHIVADO"]
const PAGE_SIZE = 20

export function CursosPage() {
  const [estadoTab, setEstadoTab] = useState<EstadoCurso>("ACTIVO")
  const [busqueda, setBusqueda] = useState("")
  const [clienteId, setClienteId] = useState("")
  const [incluirArchivados, setIncluirArchivados] = useState(false)
  const [page, setPage] = useState(1)

  const orq = useCursosOrquestacion()
  const contadores = useContadoresCursos()

  const clientesQuery = useListarClientes({ page: 1, pageSize: 100, activo: true })
  const clientes = useMemo(() => clientesQuery.data?.data ?? [], [clientesQuery.data])
  const clientesMap = useMemo(() => new Map(clientes.map((c) => [c.id, c.nombre])), [clientes])

  const queryCursos = {
    page,
    pageSize: PAGE_SIZE,
    estado: estadoTab,
    q: busqueda.length >= 2 ? busqueda : undefined,
    clienteId: clienteId || undefined,
    incluirArchivados: estadoTab === "ARCHIVADO" ? true : incluirArchivados,
    sort: "createdAt" as const,
  }
  const { data, isLoading } = useListarCursos(queryCursos)

  const columnas = useMemo(() => construirColumnasCursos(clientesMap), [clientesMap])

  function cambiarTab(nuevoTab: EstadoCurso) {
    setEstadoTab(nuevoTab)
    setPage(1)
  }

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-6">
      <header className="flex flex-col gap-2">
        <span className="nx-eyebrow text-text-tertiary">Administración</span>
        <h1 className="text-h1 text-text-primary">Cursos</h1>
        <p className="max-w-2xl text-body text-text-secondary">
          Crea cursos en borrador, publícalos, sigue su avance y archívalos cuando termine su ciclo.
        </p>
      </header>

      <Tabs<EstadoCurso>
        items={ORDEN_TABS.map((id) => ({
          id,
          etiqueta: etiquetaTab(id),
          contador: contadores.obtener(id),
        }))}
        activa={estadoTab}
        onCambiar={cambiarTab}
        etiquetaAria="Estado del curso"
      />

      <CursosFiltros
        busqueda={busqueda}
        onBusqueda={(v) => {
          setBusqueda(v)
          setPage(1)
        }}
        clienteId={clienteId}
        onClienteId={(v) => {
          setClienteId(v)
          setPage(1)
        }}
        clientes={clientes}
        cargandoClientes={clientesQuery.isLoading}
        mostrarToggleArchivados={estadoTab !== "ARCHIVADO"}
        incluirArchivados={incluirArchivados}
        onIncluirArchivados={(v) => {
          setIncluirArchivados(v)
          setPage(1)
        }}
        onNuevoCurso={() => orq.abrir("crear")}
      />

      <DataTable
        columnas={columnas}
        filas={data?.data ?? []}
        obtenerKey={(c) => c.id}
        cargando={isLoading && !data}
        vacioIcono={BookOpen}
        vacioTitulo={`No hay cursos en ${etiquetaTab(estadoTab).toLowerCase()}`}
        vacioDescripcion="Crea un nuevo curso o cambia de pestaña para ver otro estado."
        onClickFila={(c) => orq.accionesFila.verDetalle(c)}
        accionFila={(c) => (
          <MenuAcciones
            etiquetaAria={`Acciones de ${c.titulo}`}
            grupos={accionesPorCurso(c, orq.accionesFila)}
          />
        )}
      />

      <Pagination
        page={data?.meta.page ?? page}
        pageSize={data?.meta.pageSize ?? PAGE_SIZE}
        total={data?.meta.total ?? 0}
        onCambiarPage={setPage}
      />

      <CursosDialogos orq={orq} clientes={clientes} cargandoClientes={clientesQuery.isLoading} />
    </div>
  )
}
