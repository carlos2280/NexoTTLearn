import { useAreas } from "@/features/admin-areas/hooks/use-areas"
import { useEliminarArea } from "@/features/admin-areas/hooks/use-eliminar-area"
import { useRestaurarArea } from "@/features/admin-areas/hooks/use-restaurar-area"
import { ApiError } from "@/shared/api/api-error"
import {
  NxtBadge,
  NxtButton,
  NxtCard,
  NxtConfirmDialog,
  NxtEmpty,
  NxtInputField,
  NxtSelect,
  NxtSelectOption,
  NxtSkeleton,
  NxtText,
  toast,
} from "@carlos2280/nexott-ui/react"
import { Box, Grid, Stack } from "@carlos2280/nexott-ui/react-primitives"
import type { Area, EstadoArea } from "@nexott-learn/shared-types"
import { useMemo, useState } from "react"
import { AreaFormModal } from "./area-form-modal"

type FiltroEstado = EstadoArea | "TODAS"

const PAGE_SIZE = 20
const SKELETON_KEYS = ["sk-1", "sk-2", "sk-3", "sk-4", "sk-5", "sk-6"] as const

export function AreasTab() {
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("ACTIVA")
  const [busqueda, setBusqueda] = useState("")
  const [page, setPage] = useState(1)

  const [modalAbierto, setModalAbierto] = useState(false)
  const [areaEditando, setAreaEditando] = useState<Area | undefined>()

  const [confirmAbierto, setConfirmAbierto] = useState(false)
  const [areaAEliminar, setAreaAEliminar] = useState<Area | undefined>()

  const queryParams = useMemo(
    () => ({
      estado: filtroEstado === "TODAS" ? undefined : filtroEstado,
      q: busqueda.trim() || undefined,
      page,
      pageSize: PAGE_SIZE,
    }),
    [filtroEstado, busqueda, page],
  )

  const { data, isLoading, isError, refetch } = useAreas(queryParams)
  const eliminarMutation = useEliminarArea()
  const restaurarMutation = useRestaurarArea()

  const items = data?.items ?? []
  const total = data?.total ?? 0

  const abrirCrear = (): void => {
    setAreaEditando(undefined)
    setModalAbierto(true)
  }

  const abrirEditar = (area: Area): void => {
    setAreaEditando(area)
    setModalAbierto(true)
  }

  const cerrarModal = (): void => setModalAbierto(false)

  const pedirConfirmEliminar = (area: Area): void => {
    setAreaAEliminar(area)
    setConfirmAbierto(true)
  }

  const confirmarEliminar = async (): Promise<void> => {
    if (!areaAEliminar) {
      return
    }
    try {
      const resp = await eliminarMutation.mutateAsync(areaAEliminar.id)
      toast.success(resp.tipo === "ELIMINADA" ? "Área eliminada" : "Área marcada como obsoleta")
      setConfirmAbierto(false)
      setAreaAEliminar(undefined)
    } catch (err) {
      toast.error(mensajeApiError(err, "No pudimos eliminar el área."))
    }
  }

  const restaurar = async (area: Area): Promise<void> => {
    try {
      await restaurarMutation.mutateAsync(area.id)
      toast.success("Área restaurada")
    } catch (err) {
      toast.error(mensajeApiError(err, "No pudimos restaurar el área."))
    }
  }

  return (
    <Stack gap="lg">
      <AreasToolbar
        filtroEstado={filtroEstado}
        busqueda={busqueda}
        onCambioFiltro={(estado) => {
          setFiltroEstado(estado)
          setPage(1)
        }}
        onCambioBusqueda={(valor) => {
          setBusqueda(valor)
          setPage(1)
        }}
        onCrear={abrirCrear}
      />

      <AreasContenido
        isLoading={isLoading}
        isError={isError}
        items={items}
        busqueda={busqueda}
        restaurando={restaurarMutation.isPending}
        onReintentar={refetch}
        onCrear={abrirCrear}
        onEditar={abrirEditar}
        onEliminar={pedirConfirmEliminar}
        onRestaurar={restaurar}
      />

      <AreasPaginacion
        visible={!isLoading && total > PAGE_SIZE}
        page={page}
        total={total}
        onPrev={() => setPage((p) => Math.max(1, p - 1))}
        onNext={() => setPage((p) => p + 1)}
      />

      <AreaFormModal abierto={modalAbierto} area={areaEditando} onCerrar={cerrarModal} />

      <NxtConfirmDialog
        open={confirmAbierto}
        title={`¿Eliminar "${areaAEliminar?.nombre ?? ""}"?`}
        description="Si el área está referenciada por algún curso, quedará marcada como OBSOLETA. Si no, se eliminará por completo."
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="danger"
        icon="alert-triangle"
        loading={eliminarMutation.isPending}
        onNxtConfirmDialogConfirm={confirmarEliminar}
        onNxtConfirmDialogCancel={() => {
          setConfirmAbierto(false)
          setAreaAEliminar(undefined)
        }}
      />
    </Stack>
  )
}

// ---------------------------------------------------------------- Toolbar
interface AreasToolbarProps {
  readonly filtroEstado: FiltroEstado
  readonly busqueda: string
  readonly onCambioFiltro: (estado: FiltroEstado) => void
  readonly onCambioBusqueda: (valor: string) => void
  readonly onCrear: () => void
}

function AreasToolbar({
  filtroEstado,
  busqueda,
  onCambioFiltro,
  onCambioBusqueda,
  onCrear,
}: AreasToolbarProps) {
  return (
    <Stack direction={{ base: "column", md: "row" }} gap="md" align="stretch" justify="between">
      <Stack direction={{ base: "column", sm: "row" }} gap="sm" align="stretch">
        <NxtSelect
          label="Estado"
          value={filtroEstado}
          onNxtSelectChange={(event) => onCambioFiltro(event.detail.value as FiltroEstado)}
        >
          <NxtSelectOption value="ACTIVA">Activas</NxtSelectOption>
          <NxtSelectOption value="OBSOLETA">Obsoletas</NxtSelectOption>
          <NxtSelectOption value="TODAS">Todas</NxtSelectOption>
        </NxtSelect>

        <NxtInputField
          variant="filled"
          label="Buscar"
          placeholder="Nombre del área"
          value={busqueda}
          onChange={(event) => onCambioBusqueda((event.target as HTMLInputElement).value)}
        />
      </Stack>

      <NxtButton variant="primary" icon="plus-circle" onNxtButtonClick={onCrear}>
        Nueva área
      </NxtButton>
    </Stack>
  )
}

// ---------------------------------------------------------------- Contenido
interface AreasContenidoProps {
  readonly isLoading: boolean
  readonly isError: boolean
  readonly items: readonly Area[]
  readonly busqueda: string
  readonly restaurando: boolean
  readonly onReintentar: () => void
  readonly onCrear: () => void
  readonly onEditar: (area: Area) => void
  readonly onEliminar: (area: Area) => void
  readonly onRestaurar: (area: Area) => Promise<void>
}

function AreasContenido(props: AreasContenidoProps) {
  if (props.isLoading) {
    return (
      <Grid columns={{ base: 1, md: 2, lg: 3 }} gap="md">
        {SKELETON_KEYS.map((key) => (
          <NxtSkeleton key={key} variant="card" />
        ))}
      </Grid>
    )
  }
  if (props.isError) {
    return (
      <NxtEmpty
        icon="alert-triangle"
        title="No pudimos cargar las áreas"
        description="Verifica que la API esté disponible e intenta de nuevo."
      >
        <NxtButton slot="action" variant="primary" onNxtButtonClick={props.onReintentar}>
          Reintentar
        </NxtButton>
      </NxtEmpty>
    )
  }
  if (props.items.length === 0) {
    return (
      <NxtEmpty
        icon="layers"
        title={props.busqueda ? "Sin resultados" : "Aún no hay áreas"}
        description={
          props.busqueda
            ? "Prueba con otro término de búsqueda."
            : "Crea la primera área del catálogo para empezar a configurar cursos."
        }
      >
        {!props.busqueda && (
          <NxtButton slot="action" variant="primary" onNxtButtonClick={props.onCrear}>
            Crear primera área
          </NxtButton>
        )}
      </NxtEmpty>
    )
  }
  return (
    <Grid columns={{ base: 1, md: 2, lg: 3 }} gap="md">
      {props.items.map((area) => (
        <AreaCard
          key={area.id}
          area={area}
          onEditar={() => props.onEditar(area)}
          onEliminar={() => props.onEliminar(area)}
          onRestaurar={() => props.onRestaurar(area)}
          restaurando={props.restaurando}
        />
      ))}
    </Grid>
  )
}

// ---------------------------------------------------------------- Paginación
interface AreasPaginacionProps {
  readonly visible: boolean
  readonly page: number
  readonly total: number
  readonly onPrev: () => void
  readonly onNext: () => void
}

function AreasPaginacion({ visible, page, total, onPrev, onNext }: AreasPaginacionProps) {
  if (!visible) {
    return null
  }
  const totalPaginas = Math.max(1, Math.ceil(total / PAGE_SIZE))
  return (
    <Stack direction="row" justify="center" gap="sm" align="center">
      <NxtButton variant="ghost" size="sm" disabled={page <= 1} onNxtButtonClick={onPrev}>
        Anterior
      </NxtButton>
      <NxtText size="sm" tone="muted">
        Página {page} de {totalPaginas} · {total} áreas
      </NxtText>
      <NxtButton
        variant="ghost"
        size="sm"
        disabled={page >= totalPaginas}
        onNxtButtonClick={onNext}
      >
        Siguiente
      </NxtButton>
    </Stack>
  )
}

// ---------------------------------------------------------------- Card
interface AreaCardProps {
  readonly area: Area
  readonly onEditar: () => void
  readonly onEliminar: () => void
  readonly onRestaurar: () => Promise<void>
  readonly restaurando: boolean
}

function AreaCard({ area, onEditar, onEliminar, onRestaurar, restaurando }: AreaCardProps) {
  const esObsoleta = area.estado === "OBSOLETA"

  return (
    <NxtCard>
      <Box padding="lg">
        <Stack gap="md">
          <Stack direction="row" align="center" justify="between" gap="sm">
            <ColorChip color={area.color} />
            {esObsoleta ? (
              <NxtBadge variant="warning" soft={true} label="Obsoleta" />
            ) : (
              <NxtBadge variant="success" soft={true} label="Activa" />
            )}
          </Stack>

          <Stack gap="xs">
            <NxtText size="lg" weight="semibold">
              {area.nombre}
            </NxtText>
            <NxtText size="sm" tone="muted">
              {area.descripcion ?? "Sin descripción"}
            </NxtText>
            <NxtText size="xs" tone="dim">
              Orden: {area.orden}
            </NxtText>
          </Stack>

          <Stack direction="row" gap="xs" justify="end">
            {esObsoleta ? (
              <NxtButton
                variant="secondary"
                size="sm"
                disabled={restaurando}
                onNxtButtonClick={onRestaurar}
              >
                Restaurar
              </NxtButton>
            ) : (
              <>
                <NxtButton variant="ghost" size="sm" onNxtButtonClick={onEditar}>
                  Editar
                </NxtButton>
                <NxtButton variant="danger" size="sm" onNxtButtonClick={onEliminar}>
                  Eliminar
                </NxtButton>
              </>
            )}
          </Stack>
        </Stack>
      </Box>
    </NxtCard>
  )
}

// ---------------------------------------------------------------- ColorChip
const COLORES_DS_HEX: Record<string, string> = {
  indigo: "#6366f1",
  emerald: "#10b981",
  violet: "#8b5cf6",
  amber: "#f59e0b",
  rose: "#f43f5e",
  cyan: "#06b6d4",
  sky: "#0ea5e9",
  slate: "#64748b",
}

function ColorChip({ color }: { readonly color: string }) {
  const hex = color.startsWith("#") ? color : (COLORES_DS_HEX[color] ?? "#94a3b8")
  return (
    <span
      aria-label={`Color del área: ${color}`}
      style={{
        display: "inline-block",
        width: "1rem",
        height: "1rem",
        borderRadius: "9999px",
        backgroundColor: hex,
        border: "1px solid rgba(0,0,0,.1)",
      }}
    />
  )
}

// ---------------------------------------------------------------- helpers
function mensajeApiError(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : `${fallback} Intenta nuevamente.`
}
