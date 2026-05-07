import { NxtCard, NxtEmpty, NxtProgress, NxtTag, NxtText } from "@carlos2280/nexott-ui/react"
import { Box, Stack } from "@carlos2280/nexott-ui/react-primitives"
import type { CursoAreaDetalle } from "@nexott-learn/shared-types"
import { formatPeso, formatPuntaje } from "../lib/format"

interface AreasCardProps {
  readonly areas: readonly CursoAreaDetalle[]
}

// MAESTRO §6.2 · Áreas configuradas del curso con peso (suma 100%) y puntaje
// objetivo por área. Vista read-only — la edición es Capa 3.
export function AreasCard({ areas }: AreasCardProps) {
  const sumaPesos = areas.reduce((acc, a) => acc + a.peso, 0)
  const pesosOk = Math.abs(sumaPesos - 100) < 0.01

  if (areas.length === 0) {
    return (
      <NxtCard
        variant="surface"
        padding="lg"
        title="Áreas del curso"
        description="Aún no hay áreas configuradas. Agrega al menos una para poder publicar."
      >
        <NxtEmpty
          icon="layers"
          title="Sin áreas"
          description="Configura las áreas que pesan en este perfil de cliente."
        />
      </NxtCard>
    )
  }

  const ordenadas = [...areas].sort((a, b) => a.orden - b.orden)

  return (
    <NxtCard
      variant="surface"
      padding="lg"
      title="Áreas del curso"
      icon="layers"
      iconColor="indigo"
    >
      <Stack direction="column" gap="md">
        <Stack direction="row" gap="sm" align="center" justify="between" wrap={true}>
          <NxtText size="sm" tone="muted">
            {areas.length} área{areas.length === 1 ? "" : "s"} · pesos a nivel curso
          </NxtText>
          <NxtTag variant={pesosOk ? "success" : "warning"} size="sm">
            {pesosOk ? "Suma 100%" : `Suma ${formatPeso(sumaPesos)}`}
          </NxtTag>
        </Stack>

        <Stack direction="column" gap="md">
          {ordenadas.map((cursoArea) => (
            <AreaRow key={cursoArea.id} cursoArea={cursoArea} />
          ))}
        </Stack>
      </Stack>
    </NxtCard>
  )
}

function AreaRow({ cursoArea }: { readonly cursoArea: CursoAreaDetalle }) {
  const { area, peso, puntajeObjetivo, modulosCount } = cursoArea

  return (
    <Stack direction="column" gap="xs">
      {/* Fila 1: dot de color · nombre · tags · % */}
      <Stack direction="row" gap="sm" align="center">
        <Box
          aria-hidden={true}
          style={{
            width: "10px",
            height: "10px",
            borderRadius: "9999px",
            background: area.color || "var(--nx-brand)",
            flexShrink: 0,
          }}
        />
        <Box style={{ flex: "1 1 auto", minWidth: 0 }}>
          <NxtText size="md" weight="semibold">
            {area.nombre}
          </NxtText>
        </Box>
        <NxtTag variant="neutral" size="sm">
          {modulosCount} mód{modulosCount === 1 ? "" : "s"}
        </NxtTag>
        <NxtTag variant="info" size="sm">
          {formatPuntaje(puntajeObjetivo)}
        </NxtTag>
        <Box style={{ minWidth: "48px", textAlign: "right" }}>
          <NxtText size="sm" weight="semibold">
            {formatPeso(peso)}
          </NxtText>
        </Box>
      </Stack>
      {/* Fila 2: barra de progreso a ancho completo */}
      <NxtProgress variant="bar" value={peso} max={100} size="sm" color="brand" />
    </Stack>
  )
}
