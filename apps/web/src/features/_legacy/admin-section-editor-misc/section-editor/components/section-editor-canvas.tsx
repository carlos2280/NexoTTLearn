import {
  useArchivarContenido,
  useRestaurarContenido,
} from "@/features/admin-contenidos/hooks/use-archivar-contenido"
import { useEliminarContenido } from "@/features/admin-contenidos/hooks/use-eliminar-contenido"
import { useReordenarContenidos } from "@/features/admin-contenidos/hooks/use-reordenar-contenidos"
import { ApiError } from "@/shared/api/api-error"
import {
  NxtSortableList,
  type NxtSortableReorderDetail,
} from "@carlos2280/nexott-ui/extensions/dnd/react"
import { NxlBlockInsert } from "@carlos2280/nexott-ui/learn/react"
import { NxtConfirmDialog, toast } from "@carlos2280/nexott-ui/react"
import type { ContenidoEmbebido, TipoContenido } from "@nexott-learn/shared-types"
import { useState } from "react"
import { BlockRow } from "./block-row"
import { ContentTypePickerPopover } from "./content-type-picker-popover"

interface SectionEditorCanvasProps {
  readonly cursoId: string
  readonly moduloId: string
  readonly seccionId: string
  readonly bloques: readonly ContenidoEmbebido[]
}

// Default collapsed por tipo (regla del UX validada): LECTURA expandido
// porque editar = leer; el resto colapsado porque sus editores pesan.
// Funcion en vez de Record para evitar el lint useNamingConvention sobre
// keys UPPER_CASE del enum TipoContenido.
function defaultCollapsedDeTipo(tipo: TipoContenido): boolean {
  return tipo !== "LECTURA"
}

interface SolicitudEliminar {
  readonly contenidoId: string
  readonly titulo: string
  readonly archivableEnLugarDeBorrar: boolean
}

export function SectionEditorCanvas({
  cursoId,
  moduloId,
  seccionId,
  bloques,
}: SectionEditorCanvasProps) {
  const eliminarMutation = useEliminarContenido()
  const archivarMutation = useArchivarContenido()
  const restaurarMutation = useRestaurarContenido()
  const reordenarMutation = useReordenarContenidos()

  const [pickerOpen, setPickerOpen] = useState(false)
  const [eliminarSolicitado, setEliminarSolicitado] = useState<SolicitudEliminar | null>(null)

  const onReordenar = (idsEnNuevoOrden: readonly string[]): void => {
    reordenarMutation.mutate(
      { cursoId, moduloId, seccionId, ids: idsEnNuevoOrden },
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
    const { contenidoId } = eliminarSolicitado
    eliminarMutation.mutate(
      { cursoId, moduloId, seccionId, contenidoId },
      {
        onSuccess: () => {
          toast.success("Bloque eliminado")
          setEliminarSolicitado(null)
        },
        onError: (error) => {
          // 409 = tiene entregas. El back devuelve mensaje contextualizado;
          // el toast incluye una accion alternativa para archivar.
          const esConflicto = error instanceof ApiError && error.status === 409
          if (esConflicto) {
            toast.error(
              `${error.message ?? "El bloque tiene entregas y no puede eliminarse"} — archivalo en su lugar.`,
            )
            // Dejamos el dialogo abierto para que el usuario decida; aqui solo
            // mutamos la solicitud para mostrar el boton "Archivar".
            setEliminarSolicitado((prev) =>
              prev ? { ...prev, archivableEnLugarDeBorrar: true } : prev,
            )
            return
          }
          toast.error(mensajeDeError(error, "eliminar el bloque"))
          setEliminarSolicitado(null)
        },
      },
    )
  }

  const handleBlockAction = (
    action: "delete" | "archive" | "restore" | "duplicate" | "rename",
    bloque: ContenidoEmbebido,
  ): void => {
    if (action === "delete") {
      setEliminarSolicitado({
        contenidoId: bloque.id,
        titulo: bloque.titulo,
        archivableEnLugarDeBorrar: false,
      })
      return
    }
    if (action === "archive") {
      archivarMutation.mutate(
        { cursoId, moduloId, seccionId, contenidoId: bloque.id },
        {
          onSuccess: () => toast.success("Bloque archivado"),
          onError: (error) => toast.error(mensajeDeError(error, "archivar el bloque")),
        },
      )
      return
    }
    if (action === "restore") {
      restaurarMutation.mutate(
        { cursoId, moduloId, seccionId, contenidoId: bloque.id },
        {
          onSuccess: () => toast.success("Bloque restaurado"),
          onError: (error) => toast.error(mensajeDeError(error, "restaurar el bloque")),
        },
      )
      return
    }
    if (action === "duplicate") {
      // F4.x: duplicar bloque (no scope F4.1).
      toast.error("Duplicar llega en F4.2")
    }
    // "rename" lo absorbe BlockRow internamente (focus al input).
  }

  const archivarEnLugarDeBorrar = (): void => {
    if (!eliminarSolicitado) {
      return
    }
    const { contenidoId } = eliminarSolicitado
    archivarMutation.mutate(
      { cursoId, moduloId, seccionId, contenidoId },
      {
        onSuccess: () => {
          toast.success("Bloque archivado")
          setEliminarSolicitado(null)
        },
        onError: (error) => {
          toast.error(mensajeDeError(error, "archivar el bloque"))
        },
      },
    )
  }

  return (
    <>
      {bloques.length === 0 ? (
        <div className="section-editor__canvas-empty">
          Esta seccion esta vacia. Empieza agregando un bloque.
        </div>
      ) : (
        <NxtSortableList
          handle=".drag-handle--block"
          variant="separated"
          onNxtSortableReorder={(event: CustomEvent) => {
            const detail = event.detail as NxtSortableReorderDetail
            onReordenar(detail.order)
          }}
        >
          {bloques.map((b, idx) => (
            <BlockRowWithInsert
              key={b.id}
              cursoId={cursoId}
              moduloId={moduloId}
              seccionId={seccionId}
              bloque={b}
              defaultCollapsed={defaultCollapsedDeTipo(b.tipo)}
              esUltimo={idx === bloques.length - 1}
              indice={idx}
              onAction={(action) => handleBlockAction(action, b)}
            />
          ))}
        </NxtSortableList>
      )}

      <div className="section-editor__picker-anchor">
        <button
          type="button"
          className="section-editor__add-block"
          onClick={() => setPickerOpen((v) => !v)}
        >
          + Agregar bloque
        </button>
        <ContentTypePickerPopover
          open={pickerOpen}
          cursoId={cursoId}
          moduloId={moduloId}
          seccionId={seccionId}
          onClose={() => setPickerOpen(false)}
        />
      </div>

      <NxtConfirmDialog
        open={eliminarSolicitado !== null}
        variant="danger"
        title="Eliminar bloque"
        description={
          eliminarSolicitado
            ? eliminarSolicitado.archivableEnLugarDeBorrar
              ? `El bloque "${eliminarSolicitado.titulo}" tiene entregas. Puedes archivarlo en su lugar para que ya no aparezca en el curso pero conservar las entregas.`
              : `¿Eliminar el bloque "${eliminarSolicitado.titulo}"? Esta accion no se puede deshacer.`
            : ""
        }
        confirmText={eliminarSolicitado?.archivableEnLugarDeBorrar ? "Archivar" : "Eliminar"}
        cancelText="Cancelar"
        onNxtConfirmDialogConfirm={() =>
          eliminarSolicitado?.archivableEnLugarDeBorrar
            ? archivarEnLugarDeBorrar()
            : ejecutarEliminar()
        }
        onNxtConfirmDialogCancel={() => setEliminarSolicitado(null)}
      />
    </>
  )
}

interface BlockRowWithInsertProps {
  readonly cursoId: string
  readonly moduloId: string
  readonly seccionId: string
  readonly bloque: ContenidoEmbebido
  readonly defaultCollapsed: boolean
  readonly esUltimo: boolean
  readonly indice: number
  readonly onAction: (
    action: import("@carlos2280/nexott-ui/learn/react").NxlBlockShellAction,
  ) => void
}

// Combina BlockRow + zona de insercion debajo (excepto el ultimo, que tiene
// el boton "+ Agregar bloque" visible bajo la lista). El insert al click solo
// abrira el picker en F4.2; en F4.1 reusamos el "+ Agregar bloque" del pie.
function BlockRowWithInsert({
  cursoId,
  moduloId,
  seccionId,
  bloque,
  defaultCollapsed,
  esUltimo,
  indice,
  onAction,
}: BlockRowWithInsertProps) {
  return (
    <div data-sortable-id={bloque.id}>
      <BlockRow
        cursoId={cursoId}
        moduloId={moduloId}
        seccionId={seccionId}
        bloque={bloque}
        defaultCollapsed={defaultCollapsed}
        onAction={(action) => onAction(action)}
      />
      {esUltimo ? null : <NxlBlockInsert position={indice + 2} />}
    </div>
  )
}

function mensajeDeError(error: unknown, accion: string): string {
  if (error instanceof ApiError) {
    return error.message
  }
  return `No pudimos ${accion}. Reintenta en unos segundos.`
}
