import { useObtenerBloque } from "@/features/catalogo/hooks/use-obtener-bloque"
import { ConfirmMotivoDialog } from "@/shared/components/ui/confirm-motivo-dialog"
import { EmptyState } from "@/shared/components/ui/empty-state"
import { Skeleton } from "@/shared/components/ui/skeleton"
import { RUTAS } from "@/shared/constants/rutas"
import { Library } from "lucide-react"
import { useMemo } from "react"
import { Link, useParams } from "react-router-dom"
import { BuilderArbol } from "./components/builder-arbol"
import { BuilderCanvas } from "./components/builder-canvas"
import { BuilderPropiedades } from "./components/builder-propiedades"
import { BuilderSeccionDialog } from "./components/builder-seccion-dialog"
import { BuilderTipoBloqueDialog } from "./components/builder-tipo-bloque-dialog"
import { BuilderTopbar } from "./components/builder-topbar"
import { ProveedorGuardadoBuilder } from "./contexto-guardado"
import { useBuilderAcciones } from "./hooks/use-builder-acciones"
import { useBuilderDatos } from "./hooks/use-builder-datos"
import { useBuilderSeleccion } from "./hooks/use-builder-seleccion"

export function ModuloBuilderPage() {
  return (
    <ProveedorGuardadoBuilder>
      <ContenidoBuilder />
    </ProveedorGuardadoBuilder>
  )
}

function ContenidoBuilder() {
  const { moduloId } = useParams<{ moduloId: string }>()
  const datos = useBuilderDatos(moduloId)
  const seleccionApi = useBuilderSeleccion(moduloId)
  const { seleccion } = seleccionApi

  const acciones = useBuilderAcciones({
    moduloId: moduloId ?? "",
    seleccion: seleccionApi,
  })

  const seccionSeleccionada = useMemo(() => {
    if (seleccion.tipo !== "seccion") {
      return undefined
    }
    return datos.arbol.find((item) => item.seccion.id === seleccion.seccionId)?.seccion
  }, [seleccion, datos.arbol])

  const bloqueIdSeleccionado = seleccion.tipo === "bloque" ? seleccion.bloqueId : undefined
  const bloqueQuery = useObtenerBloque(bloqueIdSeleccionado)

  if (datos.isLoading) {
    return (
      <div className="flex h-screen flex-col">
        <div className="h-14 border-border border-b bg-surface" />
        <div className="flex flex-1 gap-0">
          <Skeleton className="h-full w-[260px] rounded-none" />
          <div className="flex flex-1 items-center justify-center">
            <Skeleton className="h-32 w-2/3" />
          </div>
          <Skeleton className="h-full w-[300px] rounded-none" />
        </div>
      </div>
    )
  }

  if (datos.isError || !datos.modulo) {
    return (
      <div className="flex h-screen items-center justify-center bg-canvas">
        <EmptyState
          icono={Library}
          titulo="Módulo no encontrado"
          descripcion="El módulo que intentas abrir no existe o ha sido eliminado."
          accion={
            <Link to={RUTAS.admin.catalogo} className="text-accent text-body-sm hover:underline">
              Volver al catálogo
            </Link>
          }
        />
      </div>
    )
  }

  const dialog = acciones.dialog

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-canvas">
      <BuilderTopbar modulo={datos.modulo} />
      <div className="flex min-h-0 flex-1">
        <BuilderArbol
          arbol={datos.arbol}
          seleccion={seleccion}
          onSeleccionarSeccion={seleccionApi.seleccionarSeccion}
          onSeleccionarBloque={seleccionApi.seleccionarBloque}
          onCrearSeccion={() => acciones.abrir({ modo: "crear-seccion" })}
          onRenombrarSeccion={(s) => acciones.abrir({ modo: "renombrar-seccion", seccion: s })}
          onEliminarSeccion={(s) => acciones.abrir({ modo: "eliminar-seccion", seccion: s })}
          onCrearBloque={(seccionId) => acciones.abrir({ modo: "tipos-bloque", seccionId })}
          onEliminarBloque={(b) => acciones.abrir({ modo: "eliminar-bloque", bloque: b })}
          onReordenarSecciones={acciones.acciones.reordenarSecciones}
          onReordenarBloques={acciones.acciones.reordenarBloques}
        />
        <BuilderCanvas
          seleccion={seleccion}
          seccion={seccionSeleccionada}
          bloque={bloqueQuery.data}
          tituloModulo={datos.modulo.titulo}
          onCrearBloqueDirecto={acciones.acciones.crearBloqueDirecto}
        />
        <BuilderPropiedades
          seleccion={seleccion}
          modulo={datos.modulo}
          totalSecciones={datos.totalSecciones}
          totalBloques={datos.totalBloques}
          seccion={seccionSeleccionada}
          bloque={bloqueQuery.data}
        />
      </div>

      <BuilderSeccionDialog
        abierto={dialog.modo === "crear-seccion"}
        onCambiarAbierto={(a) => (a ? null : acciones.cerrar())}
        modo="crear"
        enviando={acciones.estado.crearSeccion}
        onGuardar={acciones.acciones.crearSeccion}
      />
      <BuilderSeccionDialog
        abierto={dialog.modo === "renombrar-seccion"}
        onCambiarAbierto={(a) => (a ? null : acciones.cerrar())}
        modo="renombrar"
        tituloInicial={dialog.modo === "renombrar-seccion" ? dialog.seccion.titulo : ""}
        enviando={acciones.estado.renombrarSeccion}
        onGuardar={acciones.acciones.renombrarSeccion}
      />
      <BuilderTipoBloqueDialog
        abierto={dialog.modo === "tipos-bloque"}
        onCambiarAbierto={(a) => (a ? null : acciones.cerrar())}
        enviando={acciones.estado.crearBloque}
        onElegir={acciones.acciones.crearBloque}
      />
      <ConfirmMotivoDialog
        abierto={dialog.modo === "eliminar-seccion"}
        onCambiarAbierto={(a) => (a ? null : acciones.cerrar())}
        titulo={
          dialog.modo === "eliminar-seccion"
            ? `Eliminar sección «${dialog.seccion.titulo}»`
            : "Eliminar sección"
        }
        descripcion="La sección y sus bloques quedan archivados (soft-delete). El histórico se preserva y se puede recuperar más adelante."
        textoConfirmar="Eliminar"
        variante="danger"
        enviando={acciones.estado.eliminarSeccion}
        onConfirmar={acciones.acciones.eliminarSeccion}
      />
      <ConfirmMotivoDialog
        abierto={dialog.modo === "eliminar-bloque"}
        onCambiarAbierto={(a) => (a ? null : acciones.cerrar())}
        titulo="Eliminar bloque"
        descripcion="El bloque queda archivado (soft-delete). Los intentos previos se conservan en el histórico."
        textoConfirmar="Eliminar"
        variante="danger"
        enviando={acciones.estado.eliminarBloque}
        onConfirmar={acciones.acciones.eliminarBloque}
      />
    </div>
  )
}
