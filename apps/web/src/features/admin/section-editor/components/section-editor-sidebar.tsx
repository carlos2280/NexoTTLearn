import { useEliminarSeccion } from "@/features/admin-secciones/hooks/use-eliminar-seccion"
import { useReordenarSecciones } from "@/features/admin-secciones/hooks/use-reordenar-secciones"
import { ApiError } from "@/shared/api/api-error"
import { RUTAS } from "@/shared/constants/rutas"
import {
  NxtSortableList,
  type NxtSortableReorderDetail,
} from "@carlos2280/nexott-ui/extensions/dnd/react"
import {
  NxlSectionMinimapAdmin,
  NxlSectionMinimapAdminRow,
} from "@carlos2280/nexott-ui/learn/react"
import { NxtConfirmDialog, toast } from "@carlos2280/nexott-ui/react"
import type { SeccionAdminItem } from "@nexott-learn/shared-types"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { SeccionDrawer } from "../../../../pages/admin/cursos/components/seccion-drawer"

interface SectionEditorSidebarProps {
  readonly cursoId: string
  readonly moduloId: string
  readonly secciones: readonly SeccionAdminItem[]
  readonly activeSectionId: string | undefined
}

type EstadoDrawer =
  | { readonly tipo: "cerrado" }
  | { readonly tipo: "crear" }
  | { readonly tipo: "editar"; readonly seccionId: string }

interface SolicitudEliminar {
  readonly seccionId: string
  readonly titulo: string
}

// Sidebar del editor de seccion. Reusa el SeccionDrawer del hub clasico
// (form para crear/renombrar) y el NxtConfirmDialog del DS para eliminar.
// La lista interna esta envuelta en NxtSortableList para drag-drop con
// optimistic UI delegado a useReordenarSecciones.
export function SectionEditorSidebar({
  cursoId,
  moduloId,
  secciones,
  activeSectionId,
}: SectionEditorSidebarProps) {
  const navigate = useNavigate()
  const reordenarMutation = useReordenarSecciones()
  const eliminarMutation = useEliminarSeccion()

  const [drawer, setDrawer] = useState<EstadoDrawer>({ tipo: "cerrado" })
  const [eliminarSolicitado, setEliminarSolicitado] = useState<SolicitudEliminar | null>(null)

  const seccionEditar =
    drawer.tipo === "editar" ? secciones.find((s) => s.id === drawer.seccionId) : undefined

  const irASeccion = (seccionId: string): void => {
    if (seccionId === activeSectionId) {
      return
    }
    navigate(RUTAS.admin.cursoModuloSeccionEditor(cursoId, moduloId, seccionId))
  }

  const onReordenar = (idsEnNuevoOrden: readonly string[]): void => {
    reordenarMutation.mutate(
      { cursoId, moduloId, ids: idsEnNuevoOrden },
      {
        onSuccess: () => toast.success("Orden actualizado"),
        onError: (error) => toast.error(mensajeDeError(error, "actualizar el orden")),
      },
    )
  }

  const ejecutarEliminar = (): void => {
    if (!eliminarSolicitado) {
      return
    }
    const { seccionId } = eliminarSolicitado
    eliminarMutation.mutate(
      { cursoId, moduloId, seccionId },
      {
        onSuccess: () => {
          toast.success("Seccion eliminada")
          setEliminarSolicitado(null)
          // Si eliminamos la activa, redirigimos a la primera restante (o
          // hub vacio si no quedan).
          if (seccionId === activeSectionId) {
            navigate(RUTAS.admin.cursoModuloSeccionEditor(cursoId, moduloId, "primera"))
          }
        },
        onError: (error) => {
          toast.error(mensajeDeError(error, "eliminar la seccion"))
          setEliminarSolicitado(null)
        },
      },
    )
  }

  return (
    <>
      <NxlSectionMinimapAdmin
        empty={secciones.length === 0}
        onNxlSectionMinimapAdminNew={() => setDrawer({ tipo: "crear" })}
      >
        {secciones.length > 0 ? (
          <NxtSortableList
            handle=".drag-handle--minimap-section"
            onNxtSortableReorder={(event: CustomEvent) => {
              const detail = event.detail as NxtSortableReorderDetail
              onReordenar(detail.order)
            }}
          >
            {secciones.map((s) => (
              <NxlSectionMinimapAdminRow
                key={s.id}
                data-sortable-id={s.id}
                sectionId={s.id}
                number={s.orden}
                title={s.titulo}
                contentsCount={s.contenidos.length}
                duration={duracionTotal(s)}
                active={s.id === activeSectionId}
                onNxlSectionMinimapAdminRowClick={(e) => irASeccion(e.detail.sectionId)}
                onNxlSectionMinimapAdminRowAction={(e) => {
                  if (e.detail.action === "rename") {
                    setDrawer({ tipo: "editar", seccionId: e.detail.sectionId })
                    return
                  }
                  if (e.detail.action === "delete") {
                    setEliminarSolicitado({ seccionId: e.detail.sectionId, titulo: s.titulo })
                  }
                }}
              />
            ))}
          </NxtSortableList>
        ) : null}
      </NxlSectionMinimapAdmin>

      <SeccionDrawer
        abierto={drawer.tipo !== "cerrado"}
        cursoId={cursoId}
        moduloId={moduloId}
        modo={drawer.tipo === "cerrado" ? { tipo: "crear" } : drawer}
        seccion={seccionEditar}
        onCerrar={() => setDrawer({ tipo: "cerrado" })}
        onCrearExito={(seccionCreada) => {
          toast.success("Seccion creada")
          setDrawer({ tipo: "cerrado" })
          // Tras crear, llevamos al admin directo a la nueva seccion para que
          // empiece a editar sin pasos extra (mismo patron que el hub).
          navigate(RUTAS.admin.cursoModuloSeccionEditor(cursoId, moduloId, seccionCreada.id))
        }}
        onEditarExito={() => {
          toast.success("Seccion actualizada")
          setDrawer({ tipo: "cerrado" })
        }}
      />

      <NxtConfirmDialog
        open={eliminarSolicitado !== null}
        variant="danger"
        title="Eliminar seccion"
        description={
          eliminarSolicitado
            ? `¿Eliminar la seccion "${eliminarSolicitado.titulo}" y todos sus contenidos? Esta accion no se puede deshacer.`
            : ""
        }
        confirmText="Eliminar"
        cancelText="Cancelar"
        onNxtConfirmDialogConfirm={ejecutarEliminar}
        onNxtConfirmDialogCancel={() => setEliminarSolicitado(null)}
      />
    </>
  )
}

function duracionTotal(seccion: SeccionAdminItem): number {
  return seccion.contenidos.reduce((acc, c) => acc + (c.duracionEstimada ?? 0), 0)
}

function mensajeDeError(error: unknown, accion: string): string {
  if (error instanceof ApiError) {
    return error.message
  }
  return `No pudimos ${accion}. Reintenta en unos segundos.`
}
