import { useClonarModulo } from "@/features/admin-modulos/hooks/use-clonar-modulo"
import { useEliminarModulo } from "@/features/admin-modulos/hooks/use-eliminar-modulo"
import { useModulosAdmin } from "@/features/admin-modulos/hooks/use-modulos-admin"
import { useReordenarModulos } from "@/features/admin-modulos/hooks/use-reordenar-modulos"
import { ApiError } from "@/shared/api/api-error"
import {
  NxtButton,
  NxtCard,
  NxtConfirmDialog,
  NxtIconTile,
  NxtSkeleton,
  NxtText,
  toast,
} from "@carlos2280/nexott-ui/react"
import { Stack } from "@carlos2280/nexott-ui/react-primitives"
import { useState } from "react"
import { CursoModuloClonarModal } from "./curso-modulo-clonar-modal"
import { CursoModuloDrawer } from "./curso-modulo-drawer"
import { CursoModulosEmpty } from "./curso-modulos-empty"
import { CursoModulosList } from "./curso-modulos-list"
import { CursoModulosToolbar } from "./curso-modulos-toolbar"

interface CursoModulosTabProps {
  readonly cursoId: string
}

type EstadoDrawer =
  | { readonly tipo: "cerrado" }
  | { readonly tipo: "crear" }
  | { readonly tipo: "editar"; readonly moduloId: string }

interface SolicitudEliminar {
  readonly moduloId: string
  readonly titulo: string
}

export function CursoModulosTab({ cursoId }: CursoModulosTabProps) {
  const modulosQuery = useModulosAdmin(cursoId)
  const reordenarMutation = useReordenarModulos()
  const eliminarMutation = useEliminarModulo()
  // "Duplicar" desde el menu ⋯ de la card clona el modulo dentro del MISMO
  // curso (cursoIdDestino === cursoId). El modal "Clonar de otro curso" usa
  // su propia instancia internamente.
  const duplicarMutation = useClonarModulo()

  const [drawer, setDrawer] = useState<EstadoDrawer>({ tipo: "cerrado" })
  const [modalClonarAbierto, setModalClonarAbierto] = useState(false)
  const [eliminarSolicitado, setEliminarSolicitado] = useState<SolicitudEliminar | null>(null)

  const items = modulosQuery.data?.items ?? []
  const moduloEditar =
    drawer.tipo === "editar" ? items.find((item) => item.id === drawer.moduloId) : undefined

  const reordenar = (idsEnNuevoOrden: readonly string[]): void => {
    reordenarMutation.mutate(
      { cursoId, ids: idsEnNuevoOrden },
      {
        onSuccess: () => toast.success("Orden actualizado"),
        onError: (error) => toast.error(mensajeDeError(error, "actualizar el orden")),
      },
    )
  }

  const duplicar = (moduloId: string): void => {
    duplicarMutation.mutate(
      { cursoIdDestino: cursoId, input: { moduloOrigenId: moduloId } },
      {
        onSuccess: () => toast.success("Modulo duplicado"),
        onError: (error) => toast.error(mensajeDeError(error, "duplicar el modulo")),
      },
    )
  }

  const ejecutarEliminar = (): void => {
    if (!eliminarSolicitado) {
      return
    }
    const { moduloId } = eliminarSolicitado
    eliminarMutation.mutate(
      { cursoId, moduloId },
      {
        onSuccess: () => {
          toast.success("Modulo eliminado")
          setEliminarSolicitado(null)
        },
        onError: (error) => {
          // 409 trae el mensaje del back en espanol con el detalle
          // ("No se puede eliminar: el modulo tiene N secciones..."). Lo
          // mostramos literal porque ya esta contextualizado.
          toast.error(mensajeDeError(error, "eliminar el modulo"))
          setEliminarSolicitado(null)
        },
      },
    )
  }

  return (
    <Stack gap="xl">
      <CursoModulosToolbar
        pesoTotal={modulosQuery.data?.pesoTotal ?? null}
        onNuevoModulo={() => setDrawer({ tipo: "crear" })}
        onClonarModulo={() => setModalClonarAbierto(true)}
      />

      {modulosQuery.isLoading ? (
        <SkeletonModulos />
      ) : modulosQuery.isError ? (
        <PantallaError onReintentar={() => modulosQuery.refetch()} />
      ) : items.length === 0 ? (
        <CursoModulosEmpty onCrearPrimero={() => setDrawer({ tipo: "crear" })} />
      ) : (
        <CursoModulosList
          cursoId={cursoId}
          items={items}
          onEditar={(moduloId) => setDrawer({ tipo: "editar", moduloId })}
          onDuplicar={duplicar}
          onEliminar={(moduloId, titulo) => setEliminarSolicitado({ moduloId, titulo })}
          onReordenar={reordenar}
        />
      )}

      <CursoModuloDrawer
        abierto={drawer.tipo !== "cerrado"}
        cursoId={cursoId}
        modo={drawer.tipo === "cerrado" ? { tipo: "crear" } : drawer}
        modulo={moduloEditar}
        onCerrar={() => setDrawer({ tipo: "cerrado" })}
        onCrearExito={() => {
          toast.success("Modulo creado")
          setDrawer({ tipo: "cerrado" })
        }}
        onEditarExito={() => {
          toast.success("Modulo actualizado")
          setDrawer({ tipo: "cerrado" })
        }}
      />

      <CursoModuloClonarModal
        abierto={modalClonarAbierto}
        cursoIdDestino={cursoId}
        onCerrar={() => setModalClonarAbierto(false)}
        onExito={() => setModalClonarAbierto(false)}
      />

      <NxtConfirmDialog
        open={eliminarSolicitado !== null}
        variant="danger"
        title="Eliminar modulo"
        description={
          eliminarSolicitado
            ? `¿Eliminar el modulo "${eliminarSolicitado.titulo}"? Esta accion no se puede deshacer.`
            : ""
        }
        confirmText="Eliminar"
        cancelText="Cancelar"
        onNxtConfirmDialogConfirm={ejecutarEliminar}
        onNxtConfirmDialogCancel={() => setEliminarSolicitado(null)}
      />
    </Stack>
  )
}

function mensajeDeError(error: unknown, accion: string): string {
  if (error instanceof ApiError) {
    return error.message
  }
  return `No pudimos ${accion}. Reintenta en unos segundos.`
}

const SKELETON_KEYS = ["mod-sk-1", "mod-sk-2", "mod-sk-3"] as const

function SkeletonModulos() {
  return (
    <Stack gap="md">
      {SKELETON_KEYS.map((key) => (
        <NxtSkeleton key={key} variant="card" />
      ))}
    </Stack>
  )
}

interface PantallaErrorProps {
  readonly onReintentar: () => void
}

function PantallaError({ onReintentar }: PantallaErrorProps) {
  return (
    <NxtCard variant="surface" padding="lg" accent="rose">
      <Stack direction="row" align="center" gap="md">
        <NxtIconTile name="alert-triangle" gradient="rose" size="md" />
        <Stack gap="xs" style={{ flex: 1 }}>
          <NxtText size="md" weight="semibold">
            No pudimos cargar los modulos
          </NxtText>
          <NxtText size="sm" tone="dim">
            Reintenta en unos segundos. Si persiste, revisa el estado de la API.
          </NxtText>
        </Stack>
        <NxtButton variant="ghost" size="md" onNxtButtonClick={onReintentar}>
          Reintentar
        </NxtButton>
      </Stack>
    </NxtCard>
  )
}
