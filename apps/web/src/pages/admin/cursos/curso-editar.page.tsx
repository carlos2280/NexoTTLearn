import { useCursoAdmin } from "@/features/admin-cursos/hooks/use-curso-admin"
import { RUTAS } from "@/shared/constants/rutas"
import {
  NxtButton,
  NxtCard,
  NxtConfirmDialog,
  NxtIconTile,
  NxtSkeleton,
  NxtText,
  toast,
} from "@carlos2280/nexott-ui/react"
import { Box, Stack } from "@carlos2280/nexott-ui/react-primitives"
import type { CursoAdminDetalle } from "@nexott-learn/shared-types"
import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { CursoFormGeneral } from "./components/curso-form-general"
import { CursoHeader } from "./components/curso-header"
import { CursoModulosTab } from "./components/curso-modulos-tab"
import { CursoTabs, type TabActiva } from "./components/curso-tabs"
import { useCursoGeneralForm } from "./hooks/use-curso-general-form"

export function CursoEditarPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const modoTipo: "crear" | "editar" = id ? "editar" : "crear"

  const detalleQuery = useCursoAdmin(id, { enabled: modoTipo === "editar" })

  // Estado del dialog "salir con cambios sin guardar".
  const [dialogSalirAbierto, setDialogSalirAbierto] = useState(false)
  const [tabActiva, setTabActiva] = useState<TabActiva>("general")

  if (modoTipo === "editar" && detalleQuery.isLoading) {
    return <PantallaCargando />
  }

  if (modoTipo === "editar" && detalleQuery.isError) {
    return <PantallaError onReintentar={() => detalleQuery.refetch()} />
  }

  return (
    <CursoEditarContenido
      modoTipo={modoTipo}
      cursoId={id}
      detalle={detalleQuery.data}
      tabActiva={tabActiva}
      onCambioTab={setTabActiva}
      dialogSalirAbierto={dialogSalirAbierto}
      onSolicitarSalir={() => setDialogSalirAbierto(true)}
      onConfirmarSalir={() => {
        setDialogSalirAbierto(false)
        navigate(RUTAS.admin.cursos)
      }}
      onCancelarSalir={() => setDialogSalirAbierto(false)}
      onSalirSinCambios={() => navigate(RUTAS.admin.cursos)}
      onCrearExito={(curso) => {
        toast.success("Curso creado")
        navigate(RUTAS.admin.cursoEditar(curso.id))
      }}
      onEditarExito={() => {
        toast.success("Cambios guardados")
      }}
    />
  )
}

interface CursoEditarContenidoProps {
  readonly modoTipo: "crear" | "editar"
  readonly cursoId: string | undefined
  readonly detalle: CursoAdminDetalle | undefined
  readonly tabActiva: TabActiva
  readonly onCambioTab: (tab: TabActiva) => void
  readonly dialogSalirAbierto: boolean
  readonly onSolicitarSalir: () => void
  readonly onConfirmarSalir: () => void
  readonly onCancelarSalir: () => void
  readonly onSalirSinCambios: () => void
  readonly onCrearExito: (curso: CursoAdminDetalle) => void
  readonly onEditarExito: () => void
}

function CursoEditarContenido({
  modoTipo,
  cursoId,
  detalle,
  tabActiva,
  onCambioTab,
  dialogSalirAbierto,
  onSolicitarSalir,
  onConfirmarSalir,
  onCancelarSalir,
  onSalirSinCambios,
  onCrearExito,
  onEditarExito,
}: CursoEditarContenidoProps) {
  const form = useCursoGeneralForm({
    modo: modoTipo === "crear" ? { tipo: "crear" } : { tipo: "editar", id: cursoId ?? "" },
    detalle,
    onCrearExito,
    onEditarExito,
  })

  const tituloEnVivo = form.watch("titulo")
  const estadoEnVivo = form.estado

  const puedeGuardar = calcularPuedeGuardar({
    isSubmitting: form.isSubmitting,
    isValid: form.formState.isValid,
    isDirty: form.formState.isDirty,
    modoTipo,
  })

  // Solo bloqueamos la salida si hay cambios pendientes en el form general.
  // El Tab Modulos persiste cada cambio inmediatamente (no acumula dirty).
  const intentarSalir = (): void => {
    if (tabActiva === "general" && form.formState.isDirty) {
      onSolicitarSalir()
      return
    }
    onSalirSinCambios()
  }

  // En modo crear el Tab Modulos esta disabled: requiere cursoId para todos
  // sus endpoints. Se habilita despues de crear el curso (entonces ya hay id).
  const modulosHabilitado = modoTipo === "editar" && Boolean(cursoId)
  const enTabGeneral = tabActiva === "general"

  return (
    <Box slot="content" padding={{ base: "lg", md: "xl" }}>
      <Stack gap="2xl">
        <CursoHeader
          tituloEnVivo={tituloEnVivo}
          estadoEnVivo={estadoEnVivo}
          modo={modoTipo}
          onVolver={intentarSalir}
          onGuardar={() => form.enviar()}
          puedeGuardar={puedeGuardar}
          guardando={form.isSubmitting}
          mostrarGuardar={enTabGeneral}
        />

        <CursoTabs
          activa={tabActiva}
          onCambioTab={onCambioTab}
          modulosHabilitado={modulosHabilitado}
          modulosCount={detalle?.modules ?? 0}
          participantesCount={detalle?.participantsCount ?? 0}
        />

        {enTabGeneral ? (
          <form
            onSubmit={(event) => {
              event.preventDefault()
              form.enviar()
            }}
            noValidate={true}
          >
            <CursoFormGeneral form={form} modo={modoTipo} />
          </form>
        ) : modoTipo === "editar" && cursoId ? (
          <CursoModulosTab cursoId={cursoId} />
        ) : null}
      </Stack>

      <NxtConfirmDialog
        open={dialogSalirAbierto}
        variant="warning"
        icon="alert-triangle"
        title="Tienes cambios sin guardar"
        description="Si sales ahora perderas los cambios que hiciste en este curso."
        confirmText="Salir igual"
        cancelText="Seguir editando"
        onNxtConfirmDialogConfirm={onConfirmarSalir}
        onNxtConfirmDialogCancel={onCancelarSalir}
      />
    </Box>
  )
}

interface CalcularPuedeGuardarArgs {
  readonly isSubmitting: boolean
  readonly isValid: boolean
  readonly isDirty: boolean
  readonly modoTipo: "crear" | "editar"
}

function calcularPuedeGuardar(args: CalcularPuedeGuardarArgs): boolean {
  if (args.isSubmitting || !args.isValid) {
    return false
  }
  // En crear basta con que el form sea valido. En editar exigimos cambios.
  return args.modoTipo === "crear" || args.isDirty
}

const SKELETON_KEYS = ["sk-1", "sk-2", "sk-3"] as const

function PantallaCargando() {
  return (
    <Box slot="content" padding={{ base: "lg", md: "xl" }}>
      <Stack gap="2xl">
        {SKELETON_KEYS.map((key) => (
          <NxtSkeleton key={key} variant="card" />
        ))}
      </Stack>
    </Box>
  )
}

interface PantallaErrorProps {
  readonly onReintentar: () => void
}

function PantallaError({ onReintentar }: PantallaErrorProps) {
  return (
    <Box slot="content" padding={{ base: "lg", md: "xl" }}>
      <NxtCard variant="surface" padding="lg" accent="rose">
        <Stack direction="row" align="center" gap="md">
          <NxtIconTile name="alert-triangle" gradient="rose" size="md" />
          <Stack gap="xs" style={{ flex: 1 }}>
            <NxtText size="md" weight="semibold">
              No pudimos cargar el curso
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
    </Box>
  )
}
