import {
  NxtBadge,
  NxtButton,
  NxtEyebrow,
  NxtHeading,
  NxtMenu,
  NxtMenuItem,
  NxtMenuSep,
  NxtText,
} from "@carlos2280/nexott-ui/react"
import { Box, Stack } from "@carlos2280/nexott-ui/react-primitives"
import type { CursoDetalle, EstadoCurso } from "@nexott-learn/shared-types"
import { formatFechaCorta, formatRelativo } from "../lib/format"

interface BadgeEstado {
  readonly variant: "info" | "success" | "neutral"
  readonly label: string
}

function badgeParaEstado(estado: EstadoCurso): BadgeEstado {
  if (estado === "BORRADOR") {
    return { variant: "info", label: "Borrador" }
  }
  if (estado === "ACTIVO") {
    return { variant: "success", label: "Activo" }
  }
  return { variant: "neutral", label: "Cerrado" }
}

interface CursoDetalleHeaderProps {
  readonly curso: CursoDetalle
  readonly onEditar: () => void
  readonly onDuplicar: () => void
  readonly onDespublicar: () => void
  readonly onCerrar: () => void
  readonly onEliminar: () => void
}

export function CursoDetalleHeader({
  curso,
  onEditar,
  onDuplicar,
  onDespublicar,
  onCerrar,
  onEliminar,
}: CursoDetalleHeaderProps) {
  const badgeEstado = badgeParaEstado(curso.estado)
  const puedeDespublicar = curso.estado === "ACTIVO"
  const puedeCerrar = curso.estado === "ACTIVO"
  const puedeEliminar = curso.estado === "BORRADOR" && curso.contadores.inscripcionesActivas === 0

  return (
    <Stack direction="column" gap="md">
      <Stack direction="row" gap="md" align="start" justify="between" wrap={true}>
        <Stack direction="column" gap="xs">
          <NxtEyebrow>{curso.empresaCliente}</NxtEyebrow>
          <Stack direction="row" gap="sm" align="center" wrap={true}>
            <NxtHeading level={1}>{curso.titulo}</NxtHeading>
            <NxtBadge variant={badgeEstado.variant} label={badgeEstado.label} />
            {curso.permiteInscripcionLibre ? (
              <NxtBadge variant="info" label="Catálogo libre" />
            ) : null}
          </Stack>
          {curso.descripcion ? (
            <Box style={{ maxWidth: "70ch" }}>
              <NxtText size="md">{curso.descripcion}</NxtText>
            </Box>
          ) : null}
        </Stack>

        <Stack direction="row" gap="sm" align="center">
          <NxtButton variant="brand" icon="edit" onNxtButtonClick={onEditar}>
            Editar
          </NxtButton>
          <NxtMenu placement="bottom-end" trigger="click">
            <NxtButton slot="trigger" variant="ghost" icon="more-horizontal">
              Más
            </NxtButton>
            <NxtMenuItem label="Duplicar" icon="copy" onNxtMenuItemClick={() => onDuplicar()} />
            {puedeDespublicar ? (
              <NxtMenuItem
                label="Despublicar"
                icon="lock"
                onNxtMenuItemClick={() => onDespublicar()}
              />
            ) : null}
            {puedeCerrar ? (
              <NxtMenuItem
                label="Cerrar curso"
                icon="x-circle"
                onNxtMenuItemClick={() => onCerrar()}
              />
            ) : null}
            {puedeEliminar ? (
              <>
                <NxtMenuSep label="" />
                <NxtMenuItem
                  label="Eliminar"
                  icon="trash"
                  danger={true}
                  onNxtMenuItemClick={() => onEliminar()}
                />
              </>
            ) : null}
          </NxtMenu>
        </Stack>
      </Stack>

      <Stack direction="row" gap="lg" wrap={true}>
        <MetadataItem label="Inicio" value={formatFechaCorta(curso.fechaInicio)} />
        <MetadataItem label="Deadline" value={formatFechaCorta(curso.deadline)} />
        <MetadataItem label="Duración" value={curso.duracionEstimada ?? "—"} />
        <MetadataItem
          label="Áreas"
          value={`${curso.contadores.areas} · ${curso.contadores.modulos} módulos`}
        />
        <MetadataItem
          label="Inscripciones activas"
          value={String(curso.contadores.inscripcionesActivas)}
        />
        <MetadataItem label="Última edición" value={formatRelativo(curso.updatedAt)} />
      </Stack>
    </Stack>
  )
}

function MetadataItem({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <Stack direction="column" gap="xs">
      <NxtText size="xs" tone="muted">
        {label}
      </NxtText>
      <NxtText size="md" weight="medium">
        {value}
      </NxtText>
    </Stack>
  )
}
