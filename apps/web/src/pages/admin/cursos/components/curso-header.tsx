import { NxtBadge, NxtButton, NxtHeading, NxtIcon, NxtText } from "@carlos2280/nexott-ui/react"
import { Stack } from "@carlos2280/nexott-ui/react-primitives"
import type { EstadoCursoApi } from "@nexott-learn/shared-types"

interface CursoHeaderProps {
  readonly tituloEnVivo: string
  readonly estadoEnVivo: EstadoCursoApi
  readonly modo: "crear" | "editar"
  readonly onVolver: () => void
  readonly onGuardar: () => void
  readonly puedeGuardar: boolean
  readonly guardando: boolean
  // Default true para no romper consumidores existentes. El Tab Modulos
  // pasa false porque el guardado vive dentro del propio drawer del modulo.
  readonly mostrarGuardar?: boolean
}

export function CursoHeader({
  tituloEnVivo,
  estadoEnVivo,
  modo,
  onVolver,
  onGuardar,
  puedeGuardar,
  guardando,
  mostrarGuardar = true,
}: CursoHeaderProps) {
  const tituloMostrado =
    tituloEnVivo.trim().length > 0
      ? tituloEnVivo
      : modo === "crear"
        ? "Nuevo curso"
        : "Curso sin titulo"

  return (
    <Stack direction={{ base: "column", md: "row" }} align="center" justify="between" gap="md">
      <Stack direction="row" align="center" gap="sm" wrap={true}>
        <NxtButton variant="ghost" size="sm" icon="chevron-left" onNxtButtonClick={onVolver}>
          Cursos
        </NxtButton>
        <NxtIcon name="chevron-right" size="sm" />
        <NxtHeading level={2}>{tituloMostrado}</NxtHeading>
        <BadgeEstado estado={estadoEnVivo} />
      </Stack>

      {mostrarGuardar ? (
        <NxtButton
          variant="primary"
          size="md"
          icon="check-circle"
          disabled={!puedeGuardar}
          loading={guardando}
          onNxtButtonClick={onGuardar}
        >
          {modo === "crear" ? "Crear curso" : "Guardar cambios"}
        </NxtButton>
      ) : null}
    </Stack>
  )
}

interface BadgeEstadoProps {
  readonly estado: EstadoCursoApi
}

function BadgeEstado({ estado }: BadgeEstadoProps) {
  const config = obtenerConfigBadge(estado)
  return (
    <NxtBadge variant={config.variant} soft={true}>
      <Stack direction="row" align="center" gap="xs">
        <NxtBadge variant={config.variant} dot={true} />
        <NxtText size="xs" weight="semibold">
          {config.label}
        </NxtText>
      </Stack>
    </NxtBadge>
  )
}

type EstadoBadgeConfig = {
  readonly variant: "neutral" | "success" | "warning"
  readonly label: string
}

function obtenerConfigBadge(estado: EstadoCursoApi): EstadoBadgeConfig {
  switch (estado) {
    case "PUBLICADO":
      return { variant: "success", label: "Publicado" }
    case "DESHABILITADO":
      return { variant: "warning", label: "Deshabilitado" }
    default:
      return { variant: "neutral", label: "Borrador" }
  }
}
