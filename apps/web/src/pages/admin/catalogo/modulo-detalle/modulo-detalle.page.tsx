import { useListarSecciones } from "@/features/catalogo/hooks/use-listar-secciones"
import { useObtenerModulo } from "@/features/catalogo/hooks/use-obtener-modulo"
import { Button } from "@/shared/components/ui/button"
import { ConfirmMotivoDialog } from "@/shared/components/ui/confirm-motivo-dialog"
import { EmptyState } from "@/shared/components/ui/empty-state"
import { Skeleton } from "@/shared/components/ui/skeleton"
import { RUTAS } from "@/shared/constants/rutas"
import { Library, Plus } from "lucide-react"
import { useMemo } from "react"
import { Link, useParams } from "react-router-dom"
import { ModuloCabecera } from "./components/modulo-cabecera"
import { SeccionFormDialog } from "./components/seccion-form-dialog"
import { SeccionesLista } from "./components/secciones-lista"
import { useSeccionesOrquestacion } from "./hooks/use-secciones-orquestacion"

const PAGE_SIZE = 100

export function ModuloDetallePage() {
  const { moduloId } = useParams<{ moduloId: string }>()
  const moduloQuery = useObtenerModulo(moduloId)
  const seccionesQuery = useListarSecciones({
    page: 1,
    pageSize: PAGE_SIZE,
    moduloId,
  })

  const secciones = useMemo(() => seccionesQuery.data?.data ?? [], [seccionesQuery.data])
  const orq = useSeccionesOrquestacion(moduloId ?? "", secciones)

  if (moduloQuery.isLoading) {
    return (
      <div className="mx-auto flex max-w-[1024px] flex-col gap-6">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (moduloQuery.error || !moduloQuery.data) {
    return (
      <div className="mx-auto max-w-[640px]">
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

  return (
    <div className="mx-auto flex max-w-[1024px] flex-col gap-6">
      <ModuloCabecera modulo={moduloQuery.data} />

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-h2 text-text-primary">Secciones</h2>
          <Button variant="primary" size="sm" onClick={() => orq.abrir("crear")}>
            <Plus className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
            Nueva sección
          </Button>
        </div>
        <SeccionesLista
          secciones={secciones}
          cargando={seccionesQuery.isLoading && !seccionesQuery.data}
          reordenando={orq.estado.reordenando}
          onEditar={(s) => orq.abrir("editar", s)}
          onEliminar={(s) => orq.abrir("eliminar", s)}
          onMover={orq.acciones.mover}
        />
      </section>

      <SeccionFormDialog
        abierto={orq.dialog.modo === "crear" || orq.dialog.modo === "editar"}
        onCambiarAbierto={(a) => (a ? null : orq.cerrar())}
        seccion={orq.dialog.modo === "editar" ? orq.dialog.seccion : null}
        enviando={orq.estado.enviandoGuardar}
        onGuardar={orq.acciones.guardar}
      />
      <ConfirmMotivoDialog
        abierto={orq.dialog.modo === "eliminar"}
        onCambiarAbierto={(a) => (a ? null : orq.cerrar())}
        titulo={`Eliminar sección «${orq.dialog.seccion?.titulo ?? ""}»`}
        descripcion="La sección y sus bloques quedan archivados (soft-delete). El histórico se preserva."
        textoConfirmar="Eliminar"
        variante="danger"
        enviando={orq.estado.enviandoEliminar}
        onConfirmar={orq.acciones.eliminarConMotivo}
      />
    </div>
  )
}
