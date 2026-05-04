import { useCursoAdmin } from "@/features/admin-cursos/hooks/use-curso-admin"
import { useModulosAdmin } from "@/features/admin-modulos/hooks/use-modulos-admin"
import { useEliminarSeccion } from "@/features/admin-secciones/hooks/use-eliminar-seccion"
import { useReordenarSecciones } from "@/features/admin-secciones/hooks/use-reordenar-secciones"
import { useSeccionesAdmin } from "@/features/admin-secciones/hooks/use-secciones-admin"
import { ApiError } from "@/shared/api/api-error"
import { RUTAS } from "@/shared/constants/rutas"
import {
  NxtSortableList,
  type NxtSortableReorderDetail,
} from "@carlos2280/nexott-ui/extensions/dnd/react"
import {
  NxlModuleContextAdmin,
  type NxlModuleContextAdminAreaColor,
  NxlSectionAdmin,
} from "@carlos2280/nexott-ui/learn/react"
import {
  NxtButton,
  NxtCard,
  NxtConfirmDialog,
  NxtEmpty,
  NxtIcon,
  NxtIconTile,
  NxtSkeleton,
  NxtText,
  toast,
} from "@carlos2280/nexott-ui/react"
import { Box, Stack } from "@carlos2280/nexott-ui/react-primitives"
import type { SeccionAdminItem } from "@nexott-learn/shared-types"
import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { SeccionDrawer } from "./components/seccion-drawer"

// Sprint F3: hub minimalista de secciones del modulo. Cada fila navega al
// lienzo de edicion (F4). Acciones secundarias inline: renombrar (drawer),
// eliminar (confirm dialog). Drag-drop reordena. "Nueva seccion" abre el
// drawer en modo crear y, al exito, navega directo al lienzo de la nueva
// seccion para que el admin entre a escribir sin pasos extra.

type EstadoDrawer =
  | { readonly tipo: "cerrado" }
  | { readonly tipo: "crear" }
  | { readonly tipo: "editar"; readonly seccionId: string }

interface SolicitudEliminar {
  readonly seccionId: string
  readonly titulo: string
}

export function ModuloSeccionesPage() {
  const { id: cursoId, moduloId } = useParams<{ id: string; moduloId: string }>()
  const navigate = useNavigate()

  const cursoQuery = useCursoAdmin(cursoId, { enabled: Boolean(cursoId) })
  const modulosQuery = useModulosAdmin(cursoId)
  const seccionesQuery = useSeccionesAdmin(cursoId, moduloId)

  const reordenarMutation = useReordenarSecciones()
  const eliminarMutation = useEliminarSeccion()

  const [drawer, setDrawer] = useState<EstadoDrawer>({ tipo: "cerrado" })
  const [eliminarSolicitado, setEliminarSolicitado] = useState<SolicitudEliminar | null>(null)

  const modulo = modulosQuery.data?.items.find((item) => item.id === moduloId)
  const secciones = seccionesQuery.data?.items ?? []
  const totalContenidos = secciones.reduce((acc, sec) => acc + sec.contenidos.length, 0)

  const seccionEditar =
    drawer.tipo === "editar" ? secciones.find((item) => item.id === drawer.seccionId) : undefined

  const volverAlCurso = (): void => {
    if (cursoId) {
      navigate(RUTAS.admin.cursoEditar(cursoId))
      return
    }
    navigate(RUTAS.admin.cursos)
  }

  const navegarAlEditor = (seccionId: string): void => {
    if (cursoId && moduloId) {
      navigate(RUTAS.admin.cursoModuloSeccionEditor(cursoId, moduloId, seccionId))
    }
  }

  const reordenar = (idsEnNuevoOrden: readonly string[]): void => {
    if (!(cursoId && moduloId)) {
      return
    }
    reordenarMutation.mutate(
      { cursoId, moduloId, ids: idsEnNuevoOrden },
      {
        onSuccess: () => toast.success("Orden actualizado"),
        onError: (error) => toast.error(mensajeDeError(error, "actualizar el orden")),
      },
    )
  }

  const ejecutarEliminar = (): void => {
    if (!(cursoId && moduloId && eliminarSolicitado)) {
      return
    }
    const { seccionId } = eliminarSolicitado
    eliminarMutation.mutate(
      { cursoId, moduloId, seccionId },
      {
        onSuccess: () => {
          toast.success("Seccion eliminada")
          setEliminarSolicitado(null)
        },
        onError: (error) => {
          // 409 del back trae mensaje contextualizado en espanol — lo mostramos literal.
          toast.error(mensajeDeError(error, "eliminar la seccion"))
          setEliminarSolicitado(null)
        },
      },
    )
  }

  const cargandoContexto = cursoQuery.isLoading || modulosQuery.isLoading

  return (
    <Box slot="content" padding={{ base: "lg", md: "xl" }}>
      <Stack gap="2xl">
        <Breadcrumb
          cursoTitulo={cursoQuery.data?.title ?? ""}
          moduloTitulo={modulo?.titulo ?? ""}
          onCursos={() => navigate(RUTAS.admin.cursos)}
          onCurso={volverAlCurso}
        />

        {cargandoContexto ? (
          <NxtSkeleton variant="card" />
        ) : modulo ? (
          <NxlModuleContextAdmin
            moduleId={modulo.id}
            number={modulo.orden}
            title={modulo.titulo}
            duration={modulo.duracionEstimada}
            sectionsCount={secciones.length}
            contentsCount={totalContenidos}
            weight={modulo.peso}
            areaName={modulo.area?.nombre ?? ""}
            areaColor={(modulo.area?.color ?? "slate") as NxlModuleContextAdminAreaColor}
            onNxlModuleContextNewSection={() => setDrawer({ tipo: "crear" })}
          />
        ) : null}

        <SeccionesContent
          query={seccionesQuery}
          secciones={secciones}
          onCrearPrimera={() => setDrawer({ tipo: "crear" })}
          onReordenar={reordenar}
          onAbrirEditor={navegarAlEditor}
          onRenombrar={(seccionId) => setDrawer({ tipo: "editar", seccionId })}
          onEliminar={(seccionId, titulo) => setEliminarSolicitado({ seccionId, titulo })}
        />

        {cursoId && moduloId ? (
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
              // UX: tras crear, llevamos al admin directo al lienzo para que
              // empiece a escribir sin pasos intermedios.
              navegarAlEditor(seccionCreada.id)
            }}
            onEditarExito={() => {
              toast.success("Seccion actualizada")
              setDrawer({ tipo: "cerrado" })
            }}
          />
        ) : null}

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
      </Stack>
    </Box>
  )
}

interface BreadcrumbProps {
  readonly cursoTitulo: string
  readonly moduloTitulo: string
  readonly onCursos: () => void
  readonly onCurso: () => void
}

function Breadcrumb({ cursoTitulo, moduloTitulo, onCursos, onCurso }: BreadcrumbProps) {
  return (
    <Stack direction={{ base: "column", md: "row" }} align="center" justify="between" gap="md">
      <Stack direction="row" align="center" gap="xs" wrap={true}>
        <NxtButton variant="ghost" size="sm" onNxtButtonClick={onCursos}>
          Cursos
        </NxtButton>
        <NxtIcon name="chevron-right" size="sm" />
        <NxtButton variant="ghost" size="sm" onNxtButtonClick={onCurso}>
          {cursoTitulo || "Curso"}
        </NxtButton>
        <NxtIcon name="chevron-right" size="sm" />
        <NxtText size="md" weight="bold">
          {moduloTitulo || "Modulo"}
        </NxtText>
      </Stack>

      <NxtButton variant="secondary" size="sm" icon="chevron-left" onNxtButtonClick={onCurso}>
        Volver al curso
      </NxtButton>
    </Stack>
  )
}

const SKELETON_SECCION_KEYS = ["sec-sk-1", "sec-sk-2", "sec-sk-3"] as const

function SkeletonSecciones() {
  return (
    <Stack gap="md">
      {SKELETON_SECCION_KEYS.map((key) => (
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
            No pudimos cargar las secciones
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

interface SeccionesContentProps {
  readonly query: ReturnType<typeof useSeccionesAdmin>
  readonly secciones: readonly SeccionAdminItem[]
  readonly onCrearPrimera: () => void
  readonly onReordenar: (idsEnNuevoOrden: readonly string[]) => void
  readonly onAbrirEditor: (seccionId: string) => void
  readonly onRenombrar: (seccionId: string) => void
  readonly onEliminar: (seccionId: string, titulo: string) => void
}

// Extraido como subcomponente para bajar la complejidad cognitiva del orquestador
// `ModuloSeccionesPage`. Contiene la maquina de estados visuales del hub:
// loading -> error -> vacio -> lista reordenable.
function SeccionesContent({
  query,
  secciones,
  onCrearPrimera,
  onReordenar,
  onAbrirEditor,
  onRenombrar,
  onEliminar,
}: SeccionesContentProps) {
  if (query.isLoading) {
    return <SkeletonSecciones />
  }
  if (query.isError) {
    return <PantallaError onReintentar={() => query.refetch()} />
  }
  if (secciones.length === 0) {
    return (
      <NxtEmpty
        icon="layers"
        mood="info"
        title="Sin secciones aun"
        description="Crea la primera seccion para empezar a agregar contenidos al modulo."
      >
        <NxtButton variant="primary" icon="plus" onNxtButtonClick={onCrearPrimera}>
          Crear primera seccion
        </NxtButton>
      </NxtEmpty>
    )
  }
  return (
    <NxtSortableList
      handle=".drag-handle--section"
      variant="separated"
      onNxtSortableReorder={(event: CustomEvent) => {
        const detail = event.detail as NxtSortableReorderDetail
        onReordenar(detail.order)
      }}
    >
      {secciones.map((seccion) => (
        <NxlSectionAdmin
          key={seccion.id}
          data-sortable-id={seccion.id}
          sectionId={seccion.id}
          number={seccion.orden}
          title={seccion.titulo}
          contentsCount={seccion.contenidos.length}
          totalDuration={duracionTotal(seccion)}
          evaluablesCount={contarEvaluables(seccion)}
          onNxlSectionAdminClick={(e: CustomEvent<{ sectionId: string }>) =>
            onAbrirEditor(e.detail.sectionId)
          }
          onNxlSectionAdminEdit={(e: CustomEvent<{ sectionId: string }>) =>
            onRenombrar(e.detail.sectionId)
          }
          onNxlSectionAdminDelete={(e: CustomEvent<{ sectionId: string }>) =>
            onEliminar(e.detail.sectionId, seccion.titulo)
          }
        />
      ))}
    </NxtSortableList>
  )
}

// Tipos evaluables segun convencion del DS (debe coincidir con el mapeo
// interno de `nxl-content-row-admin` que existira en F4). Por ahora vive
// aqui en la app porque es la unica que lo necesita; al construir el
// `nxl-section-editor-shell` se mudara al DS.
function contarEvaluables(seccion: SeccionAdminItem): number {
  return seccion.contenidos.filter(
    (cont) => cont.tipo === "EJEMPLO_CODIGO" || cont.tipo === "EJERCICIO" || cont.tipo === "TEST",
  ).length
}

function duracionTotal(seccion: SeccionAdminItem): number {
  return seccion.contenidos.reduce((acc, cont) => acc + (cont.duracionEstimada ?? 0), 0)
}

function mensajeDeError(error: unknown, accion: string): string {
  if (error instanceof ApiError) {
    return error.message
  }
  return `No pudimos ${accion}. Reintenta en unos segundos.`
}
