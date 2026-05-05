import { useCursoAdmin } from "@/features/admin-cursos/hooks/use-curso-admin"
import { useModulosAdmin } from "@/features/admin-modulos/hooks/use-modulos-admin"
import { useActualizarSeccion } from "@/features/admin-secciones/hooks/use-actualizar-seccion"
import { useSeccionesAdmin } from "@/features/admin-secciones/hooks/use-secciones-admin"
import { SectionEditorCanvas } from "@/features/admin/section-editor/components/section-editor-canvas"
import { SectionEditorShell } from "@/features/admin/section-editor/components/section-editor-shell"
import { SectionEditorSidebar } from "@/features/admin/section-editor/components/section-editor-sidebar"
import { SectionTitleInline } from "@/features/admin/section-editor/components/section-title-inline"
import type { AutoSaveState } from "@/features/admin/section-editor/hooks/use-auto-save"
import { useSectionEditorRouting } from "@/features/admin/section-editor/hooks/use-section-editor-routing"
import { ApiError } from "@/shared/api/api-error"
import { RUTAS } from "@/shared/constants/rutas"
import {
  NxtButton,
  NxtCard,
  NxtEmpty,
  NxtEyebrow,
  NxtIcon,
  NxtIconTile,
  NxtSkeleton,
  NxtText,
  toast,
} from "@carlos2280/nexott-ui/react"
import { Box, Stack } from "@carlos2280/nexott-ui/react-primitives"
import type { ModuloAdminItem, SeccionAdminItem } from "@nexott-learn/shared-types"
import { useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { SeccionDrawer } from "./components/seccion-drawer"

// Sprint F4.1: editor de seccion del admin. Layout topbar + sidebar + canvas.
//
// Reglas del routing (en useSectionEditorRouting):
//  - seccionId === "primera": resuelve la primera seccion del modulo y
//    redirige (replace) a su id real. Si el modulo esta vacio, se queda en
//    empty state con CTA "Crear primera seccion".
//  - 404 (seccion eliminada por otra sesion): toast + navigate al hub.

export function SeccionEditorPage() {
  const {
    id: cursoId,
    moduloId,
    seccionId,
  } = useParams<{ id: string; moduloId: string; seccionId: string }>()
  const navigate = useNavigate()

  const cursoQuery = useCursoAdmin(cursoId, { enabled: Boolean(cursoId) })
  const modulosQuery = useModulosAdmin(cursoId)
  const seccionesQuery = useSeccionesAdmin(cursoId, moduloId)

  const modulo = modulosQuery.data?.items.find((m) => m.id === moduloId)
  const secciones = seccionesQuery.data?.items ?? []
  const modulosCurso = useMemo(() => modulosQuery.data?.items ?? [], [modulosQuery.data])

  useSectionEditorRouting({
    cursoId,
    moduloId,
    seccionId,
    seccionesData: seccionesQuery.data,
  })

  const seccionActiva: SeccionAdminItem | undefined =
    seccionId && seccionId !== "primera" ? secciones.find((s) => s.id === seccionId) : undefined

  const cargandoContexto =
    cursoQuery.isLoading || modulosQuery.isLoading || seccionesQuery.isLoading

  if (cargandoContexto) {
    return (
      <Box slot="content" padding={{ base: "lg", md: "xl" }}>
        <Stack gap="md">
          <NxtSkeleton variant="card" />
          <NxtSkeleton variant="card" />
        </Stack>
      </Box>
    )
  }

  if (!(cursoId && moduloId)) {
    return null
  }

  if (!modulo) {
    return <ModuloNoEncontrado onVolver={() => navigate(RUTAS.admin.cursoEditar(cursoId))} />
  }

  if (secciones.length === 0) {
    return (
      <ModuloSinSeccionesView
        cursoId={cursoId}
        moduloId={moduloId}
        cursoTitulo={cursoQuery.data?.title ?? ""}
        modulo={modulo}
        modulosCurso={modulosCurso}
      />
    )
  }

  if (seccionId === "primera" || !seccionActiva) {
    return (
      <SectionEditorShell
        cursoId={cursoId}
        moduloId={moduloId}
        cursoTitulo={cursoQuery.data?.title ?? ""}
        moduloActivo={modulo}
        modulosCurso={modulosCurso}
        seccionActiva={undefined}
        autoSaveState="idle"
        autoSaveLastSavedAt={null}
        sidebar={
          <SectionEditorSidebar
            cursoId={cursoId}
            moduloId={moduloId}
            secciones={secciones}
            activeSectionId={undefined}
          />
        }
        main={<NxtSkeleton variant="card" />}
      />
    )
  }

  return (
    <SeccionEditorActivaView
      cursoId={cursoId}
      moduloId={moduloId}
      cursoTitulo={cursoQuery.data?.title ?? ""}
      modulo={modulo}
      modulosCurso={modulosCurso}
      secciones={secciones}
      seccionActiva={seccionActiva}
    />
  )
}

interface ModuloNoEncontradoProps {
  readonly onVolver: () => void
}

function ModuloNoEncontrado({ onVolver }: ModuloNoEncontradoProps) {
  return (
    <Box slot="content" padding={{ base: "lg", md: "xl" }}>
      <NxtCard variant="surface" padding="lg" accent="rose">
        <Stack direction="row" align="center" gap="md">
          <NxtIconTile name="alert-triangle" gradient="rose" size="md" />
          <Stack gap="xs" style={{ flex: 1 }}>
            <NxtText size="md" weight="semibold">
              No pudimos cargar el modulo
            </NxtText>
            <NxtText size="sm" tone="dim">
              Es posible que haya sido eliminado.
            </NxtText>
          </Stack>
          <NxtButton variant="ghost" size="md" onNxtButtonClick={onVolver}>
            Volver al curso
          </NxtButton>
        </Stack>
      </NxtCard>
    </Box>
  )
}

interface ModuloSinSeccionesViewProps {
  readonly cursoId: string
  readonly moduloId: string
  readonly cursoTitulo: string
  readonly modulo: ModuloAdminItem
  readonly modulosCurso: readonly ModuloAdminItem[]
}

function ModuloSinSeccionesView({
  cursoId,
  moduloId,
  cursoTitulo,
  modulo,
  modulosCurso,
}: ModuloSinSeccionesViewProps) {
  const navigate = useNavigate()
  const [drawerAbierto, setDrawerAbierto] = useState(false)

  return (
    <SectionEditorShell
      cursoId={cursoId}
      moduloId={moduloId}
      cursoTitulo={cursoTitulo}
      moduloActivo={modulo}
      modulosCurso={modulosCurso}
      seccionActiva={undefined}
      autoSaveState="idle"
      autoSaveLastSavedAt={null}
      sidebar={
        <SectionEditorSidebar
          cursoId={cursoId}
          moduloId={moduloId}
          secciones={[]}
          activeSectionId={undefined}
        />
      }
      main={
        <>
          <NxtEyebrow accent="bar">Modulo {modulo.orden} · Seccion</NxtEyebrow>
          <NxtEmpty
            icon="layers"
            mood="info"
            title="Aun no hay secciones"
            description="Crea la primera seccion para empezar a agregar bloques al modulo."
          >
            <NxtButton
              variant="primary"
              icon="plus"
              onNxtButtonClick={() => setDrawerAbierto(true)}
            >
              Crear primera seccion
            </NxtButton>
          </NxtEmpty>
          <SeccionDrawer
            abierto={drawerAbierto}
            cursoId={cursoId}
            moduloId={moduloId}
            modo={{ tipo: "crear" }}
            onCerrar={() => setDrawerAbierto(false)}
            onCrearExito={(seccionCreada) => {
              toast.success("Seccion creada")
              setDrawerAbierto(false)
              navigate(RUTAS.admin.cursoModuloSeccionEditor(cursoId, moduloId, seccionCreada.id))
            }}
            onEditarExito={() => setDrawerAbierto(false)}
          />
        </>
      }
    />
  )
}

interface SeccionEditorActivaViewProps {
  readonly cursoId: string
  readonly moduloId: string
  readonly cursoTitulo: string
  readonly modulo: ModuloAdminItem
  readonly modulosCurso: readonly ModuloAdminItem[]
  readonly secciones: readonly SeccionAdminItem[]
  readonly seccionActiva: SeccionAdminItem
}

function SeccionEditorActivaView({
  cursoId,
  moduloId,
  cursoTitulo,
  modulo,
  modulosCurso,
  secciones,
  seccionActiva,
}: SeccionEditorActivaViewProps) {
  const [tituloSaveState, setTituloSaveState] = useState<AutoSaveState>("idle")
  const [tituloLastSavedAt, setTituloLastSavedAt] = useState<number | null>(null)
  const actualizarSeccionMutation = useActualizarSeccion()

  const totalDuracion = seccionActiva.contenidos.reduce(
    (acc, c) => acc + (c.duracionEstimada ?? 0),
    0,
  )

  const onSaveTitulo = async (nuevoTitulo: string): Promise<void> => {
    try {
      await actualizarSeccionMutation.mutateAsync({
        cursoId,
        moduloId,
        seccionId: seccionActiva.id,
        input: { titulo: nuevoTitulo },
      })
      setTituloLastSavedAt(Date.now())
    } catch (error) {
      toast.error(mensajeDeError(error, "guardar el titulo"))
      throw error
    }
  }

  return (
    <SectionEditorShell
      cursoId={cursoId}
      moduloId={moduloId}
      cursoTitulo={cursoTitulo}
      moduloActivo={modulo}
      modulosCurso={modulosCurso}
      seccionActiva={seccionActiva}
      autoSaveState={tituloSaveState}
      autoSaveLastSavedAt={tituloLastSavedAt}
      sidebar={
        <SectionEditorSidebar
          cursoId={cursoId}
          moduloId={moduloId}
          secciones={secciones}
          activeSectionId={seccionActiva.id}
        />
      }
      main={
        <>
          <NxtEyebrow accent="bar">Modulo {modulo.orden} · Seccion</NxtEyebrow>
          <SectionTitleInline
            value={seccionActiva.titulo}
            onSave={onSaveTitulo}
            onStateChange={setTituloSaveState}
          />
          <NxtText size="sm" tone="dim">
            <NxtIcon name="layers" size="xs" /> {seccionActiva.contenidos.length}{" "}
            {seccionActiva.contenidos.length === 1 ? "bloque" : "bloques"}
            {totalDuracion > 0 ? ` · ${totalDuracion} min` : ""}
          </NxtText>
          <SectionEditorCanvas
            cursoId={cursoId}
            moduloId={moduloId}
            seccionId={seccionActiva.id}
            bloques={seccionActiva.contenidos}
          />
        </>
      }
    />
  )
}

function mensajeDeError(error: unknown, accion: string): string {
  if (error instanceof ApiError) {
    return error.message
  }
  return `No pudimos ${accion}. Reintenta en unos segundos.`
}
