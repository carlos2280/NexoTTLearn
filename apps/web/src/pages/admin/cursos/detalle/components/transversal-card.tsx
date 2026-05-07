import {
  NxtAlert,
  NxtCard,
  NxtDivider,
  NxtEmpty,
  NxtProgress,
  NxtText,
} from "@carlos2280/nexott-ui/react"
import { Box, Stack } from "@carlos2280/nexott-ui/react-primitives"
import type { ProyectoTransversalDetalleAdmin } from "@nexott-learn/shared-types"
import { formatPeso } from "../lib/format"

interface TransversalCardProps {
  readonly activo: boolean
  readonly transversal: ProyectoTransversalDetalleAdmin | null | undefined
  readonly loading: boolean
  readonly error: Error | null
}

// MAESTRO §10.2 · Proyecto Transversal del curso.
// La presencia del registro es el flag "activo". Si el curso lo declara
// activo pero no devolvemos data, mostramos placeholder.
export function TransversalCard({ activo, transversal, loading, error }: TransversalCardProps) {
  if (!activo) {
    return (
      <NxtCard
        variant="surface"
        padding="lg"
        title="Proyecto Transversal"
        description="No configurado para este curso."
        icon="trending-up"
        iconColor="amber"
      >
        <NxtEmpty
          icon="trending-up"
          title="Sin proyecto transversal"
          description="Activa esta sección si el curso necesita un entregable integrador."
        />
      </NxtCard>
    )
  }

  if (loading) {
    return (
      <NxtCard variant="surface" padding="lg" title="Proyecto Transversal" loading={true}>
        <NxtText size="sm" tone="muted">
          Cargando configuración…
        </NxtText>
      </NxtCard>
    )
  }

  if (error) {
    return (
      <NxtCard variant="surface" padding="lg" title="Proyecto Transversal">
        <NxtAlert
          variant="error"
          heading="No pudimos cargar el proyecto transversal"
          message={error.message}
        />
      </NxtCard>
    )
  }

  if (!transversal) {
    return (
      <NxtCard variant="surface" padding="lg" title="Proyecto Transversal">
        <NxtAlert
          variant="warning"
          heading="Configuración pendiente"
          message="El proyecto transversal está marcado como activo pero aún no tiene contenido."
        />
      </NxtCard>
    )
  }

  const capas = [
    { label: "Análisis Objetivo", n: 1, valor: transversal.pesoCapa1 },
    { label: "IA Cualitativa", n: 2, valor: transversal.pesoCapa2 },
    { label: "Comprensión IA", n: 3, valor: transversal.pesoCapa3 },
  ]

  return (
    <NxtCard
      variant="surface"
      padding="lg"
      title={transversal.titulo}
      description="Proyecto Transversal del curso"
      icon="trending-up"
      iconColor="amber"
    >
      <Stack direction="column" gap="lg">
        {/* Enunciado */}
        <Box style={{ maxWidth: "70ch" }}>
          <NxtText size="md">{transversal.enunciado}</NxtText>
        </Box>

        <NxtDivider />

        {/* Decisión: umbral de aprobación destacado */}
        <Stack direction="row" gap="md" align="center" justify="between">
          <Stack direction="column" gap="xs">
            <NxtText size="xs" weight="semibold" tone="muted">
              UMBRAL DE APROBACIÓN
            </NxtText>
            <NxtText size="sm" tone="muted">
              Nota mínima para aprobar el proyecto
            </NxtText>
          </Stack>
          <NxtText size="lg" weight="bold">
            ≥ {transversal.umbralAprobacion}
          </NxtText>
        </Stack>

        <NxtDivider />

        {/* Ponderaciones: las 3 capas */}
        <Stack direction="column" gap="sm">
          <NxtText size="xs" weight="semibold" tone="muted">
            PONDERACIÓN POR CAPA (suma 100%)
          </NxtText>
          <Stack direction="column" gap="sm">
            {capas.map((capa) => (
              <Stack key={capa.n} direction="row" gap="md" align="center">
                <Box style={{ width: "28px", flexShrink: 0 }}>
                  <NxtText size="sm" weight="semibold" tone="muted">
                    C{capa.n}
                  </NxtText>
                </Box>
                <Box style={{ flex: "1 1 auto", minWidth: 0 }}>
                  <NxtText size="sm" weight="medium">
                    {capa.label}
                  </NxtText>
                </Box>
                <Box style={{ width: "120px", flexShrink: 0 }}>
                  <NxtProgress variant="bar" value={capa.valor} max={100} size="sm" color="brand" />
                </Box>
                <Box style={{ width: "44px", textAlign: "right", flexShrink: 0 }}>
                  <NxtText size="sm" weight="semibold">
                    {formatPeso(capa.valor)}
                  </NxtText>
                </Box>
              </Stack>
            ))}
          </Stack>
        </Stack>
      </Stack>
    </NxtCard>
  )
}
