import { useListarClientes } from "@/features/catalogo/hooks/use-listar-clientes"
import { useObtenerCurso } from "@/features/cursos/hooks/use-obtener-curso"
import { EmptyState } from "@/shared/components/ui/empty-state"
import { Skeleton } from "@/shared/components/ui/skeleton"
import { Tabs } from "@/shared/components/ui/tabs"
import { RUTAS } from "@/shared/constants/rutas"
import { BookOpen } from "lucide-react"
import { useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { CursoDetalleCabecera } from "./components/curso-detalle-cabecera"
import { CursoDetallePanel, type TabDetalle } from "./components/curso-detalle-panel"
import { CursoEditarMetadatosDialog } from "./components/curso-editar-metadatos-dialog"
import { CursoLogCambiosDialog } from "./components/curso-log-cambios-dialog"
import { CursosDialogos } from "./components/cursos-dialogos"
import { useActualizarCursoDetalle } from "./hooks/use-actualizar-curso-detalle"
import { useCursosOrquestacion } from "./hooks/use-cursos-orquestacion"

const TABS: readonly { readonly id: TabDetalle; readonly etiqueta: string }[] = [
  { id: "resumen", etiqueta: "Resumen" },
  { id: "asignados", etiqueta: "Asignados" },
  { id: "estructura", etiqueta: "Estructura" },
  { id: "configuracion", etiqueta: "Configuración" },
]

export function CursoDetallePage() {
  const { cursoId } = useParams<{ cursoId: string }>()
  const [tab, setTab] = useState<TabDetalle>("resumen")
  const [editando, setEditando] = useState(false)
  const [viendoLog, setViendoLog] = useState(false)
  const orq = useCursosOrquestacion()

  const { data: curso, isLoading, error } = useObtenerCurso(cursoId)
  const clientesQuery = useListarClientes({ page: 1, pageSize: 100, activo: true })
  const clientes = useMemo(() => clientesQuery.data?.data ?? [], [clientesQuery.data])
  const nombreCliente = curso ? clientes.find((c) => c.id === curso.clienteId)?.nombre : undefined
  const actualizar = useActualizarCursoDetalle(cursoId ?? "")

  if (isLoading) {
    return (
      <div className="mx-auto flex max-w-[1280px] flex-col gap-6">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error || !curso) {
    return (
      <div className="mx-auto max-w-[640px]">
        <EmptyState
          icono={BookOpen}
          titulo="Curso no encontrado"
          descripcion="El curso que intentas abrir no existe o no tienes acceso."
          accion={
            <Link to={RUTAS.admin.cursos} className="text-accent text-body-sm hover:underline">
              Volver a cursos
            </Link>
          }
        />
      </div>
    )
  }

  const cursoResumenParaOrq = {
    id: curso.id,
    titulo: curso.titulo,
    clienteId: curso.clienteId,
    estado: curso.estado,
    fechaInicio: curso.fechaInicio,
    fechaDeadline: curso.fechaDeadline,
    fechaCierre: curso.fechaCierre,
    toggleVoluntarios: curso.toggleVoluntarios,
    desbloqueo: curso.desbloqueo,
    createdAt: curso.createdAt,
    updatedAt: curso.updatedAt,
  }

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-6">
      <CursoDetalleCabecera
        curso={curso}
        nombreCliente={nombreCliente}
        onEditar={() => setEditando(true)}
        onPublicar={() => orq.abrir("publicar", cursoResumenParaOrq)}
        onArchivar={() => orq.abrir("archivar", cursoResumenParaOrq)}
        onDesarchivar={() => orq.abrir("desarchivar", cursoResumenParaOrq)}
        onDuplicar={() => orq.abrir("duplicar", cursoResumenParaOrq)}
        onVerLog={() => setViendoLog(true)}
      />

      <Tabs<TabDetalle>
        items={TABS}
        activa={tab}
        onCambiar={setTab}
        etiquetaAria="Secciones del curso"
      />

      <section role="tabpanel" aria-label={TABS.find((t) => t.id === tab)?.etiqueta}>
        <CursoDetallePanel tab={tab} curso={curso} nombreCliente={nombreCliente} />
      </section>

      <CursosDialogos orq={orq} clientes={clientes} cargandoClientes={clientesQuery.isLoading} />
      <CursoEditarMetadatosDialog
        abierto={editando}
        onCambiarAbierto={setEditando}
        curso={curso}
        clientes={clientes}
        enviando={actualizar.enviando}
        onGuardar={async (input, motivo) => {
          await actualizar.guardar(input, motivo)
          setEditando(false)
        }}
      />
      <CursoLogCambiosDialog
        abierto={viendoLog}
        onCambiarAbierto={setViendoLog}
        cursoId={curso.id}
      />
    </div>
  )
}
