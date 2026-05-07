import { NxtAlert, NxtCard, NxtDivider, NxtEmpty, NxtText } from "@carlos2280/nexott-ui/react"
import { Box, Stack } from "@carlos2280/nexott-ui/react-primitives"
import type { EntrevistaIADetalleAdmin } from "@nexott-learn/shared-types"

interface EntrevistaIACardProps {
  readonly activa: boolean
  readonly entrevista: EntrevistaIADetalleAdmin | null | undefined
  readonly loading: boolean
  readonly error: Error | null
}

// MAESTRO §11 · Entrevista Final IA.
export function EntrevistaIACard({ activa, entrevista, loading, error }: EntrevistaIACardProps) {
  if (!activa) {
    return (
      <NxtCard
        variant="surface"
        padding="lg"
        title="Entrevista Final IA"
        description="No configurada para este curso."
        icon="message"
        iconColor="violet"
      >
        <NxtEmpty
          icon="message"
          title="Sin entrevista IA"
          description="Activa esta sección si el cliente requiere validación final con IA."
        />
      </NxtCard>
    )
  }

  if (loading) {
    return (
      <NxtCard variant="surface" padding="lg" title="Entrevista Final IA" loading={true}>
        <NxtText size="sm" tone="muted">
          Cargando configuración…
        </NxtText>
      </NxtCard>
    )
  }

  if (error) {
    return (
      <NxtCard variant="surface" padding="lg" title="Entrevista Final IA">
        <NxtAlert
          variant="error"
          heading="No pudimos cargar la entrevista IA"
          message={error.message}
        />
      </NxtCard>
    )
  }

  if (!entrevista) {
    return (
      <NxtCard variant="surface" padding="lg" title="Entrevista Final IA">
        <NxtAlert
          variant="warning"
          heading="Configuración pendiente"
          message="La entrevista IA está marcada como activa pero aún no tiene contenido."
        />
      </NxtCard>
    )
  }

  return (
    <NxtCard
      variant="surface"
      padding="lg"
      title="Entrevista Final IA"
      description="Validación final con cliente simulado por IA"
      icon="message"
      iconColor="violet"
    >
      <Stack direction="column" gap="lg">
        {/* Bloque escenario: perfil + contexto */}
        <Stack direction="column" gap="md">
          <Stack direction="column" gap="xs">
            <NxtText size="xs" weight="semibold" tone="muted">
              PERFIL DEL CLIENTE
            </NxtText>
            <Box style={{ maxWidth: "70ch" }}>
              <NxtText size="md">{entrevista.perfilCliente}</NxtText>
            </Box>
          </Stack>

          <Stack direction="column" gap="xs">
            <NxtText size="xs" weight="semibold" tone="muted">
              CONTEXTO DE NEGOCIO
            </NxtText>
            <Box style={{ maxWidth: "70ch" }}>
              <NxtText size="md">{entrevista.contextoNegocio}</NxtText>
            </Box>
          </Stack>
        </Stack>

        <NxtDivider />

        {/* Bloque parámetros: 4 métricas con jerarquía fuerte */}
        <Stack direction="column" gap="sm">
          <NxtText size="xs" weight="semibold" tone="muted">
            PARÁMETROS DE EJECUCIÓN
          </NxtText>
          <Stack direction="row" gap="lg" wrap={true}>
            <ParamItem label="Modo" value={entrevista.modo === "TEXTO" ? "Texto" : "Voz"} />
            <ParamItem label="Preguntas" value={String(entrevista.numeroPreguntas)} />
            <ParamItem label="Máx. intentos" value={String(entrevista.maxIntentos)} />
            <ParamItem label="Umbral aprobación" value={`≥ ${entrevista.umbralAprobacion}`} />
          </Stack>
        </Stack>

        {/* Aviso de deuda — separado de la config real */}
        <NxtAlert
          variant="info"
          heading="Rúbrica por área del curso"
          message="La configuración de pesos por área se habilitará en la siguiente iteración."
        />
      </Stack>
    </NxtCard>
  )
}

function ParamItem({ label, value }: { readonly label: string; readonly value: string }) {
  return (
    <Stack direction="column" gap="xs">
      <NxtText size="xs" tone="muted">
        {label}
      </NxtText>
      <NxtText size="lg" weight="bold">
        {value}
      </NxtText>
    </Stack>
  )
}
