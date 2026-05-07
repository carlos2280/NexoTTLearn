import { NxtCard, NxtText } from "@carlos2280/nexott-ui/react"
import { Box, Stack } from "@carlos2280/nexott-ui/react-primitives"
import type { CursoDetalle } from "@nexott-learn/shared-types"

interface UmbralesCardProps {
  readonly curso: CursoDetalle
}

interface UmbralFila {
  readonly etiqueta: string
  readonly rango: string
  readonly tone: string
  readonly accent: string
}

// MAESTRO §9.8 · Umbrales de logro del curso.
// Convención: enDesarrollo < aprobado < excelencia (estricto).
export function UmbralesCard({ curso }: UmbralesCardProps) {
  // Orden visual: peor → mejor (lectura natural izquierda a derecha).
  const filas: readonly UmbralFila[] = [
    {
      etiqueta: "Insuficiente",
      rango: `< ${curso.umbralEnDesarrollo}`,
      tone: "No cumple",
      accent: "var(--nx-rose, #F43F5E)",
    },
    {
      etiqueta: "En desarrollo",
      rango: `${curso.umbralEnDesarrollo} – ${curso.umbralAprobado - 1}`,
      tone: "Necesita refuerzo",
      accent: "var(--nx-amber, #F59E0B)",
    },
    {
      etiqueta: "Aprobado",
      rango: `${curso.umbralAprobado} – ${curso.umbralExcelencia - 1}`,
      tone: "Cumple objetivos",
      accent: "var(--nx-sky, #0EA5E9)",
    },
    {
      etiqueta: "Excelencia",
      rango: `≥ ${curso.umbralExcelencia}`,
      tone: "Logro destacado",
      accent: "var(--nx-emerald, #10B981)",
    },
  ]

  return (
    <NxtCard
      variant="surface"
      padding="lg"
      title="Umbrales de logro"
      description="Etiquetas que se asignan a la nota final del curso (escala 0–100)."
      icon="check-circle"
      iconColor="emerald"
    >
      <Stack direction="row" gap="md" wrap={true}>
        {filas.map((fila) => (
          <UmbralBox key={fila.etiqueta} fila={fila} />
        ))}
      </Stack>
    </NxtCard>
  )
}

function UmbralBox({ fila }: { readonly fila: UmbralFila }) {
  return (
    <Box
      style={{
        flex: "1 1 200px",
        minWidth: "180px",
        padding: "var(--nx-space-5)",
        borderRadius: "var(--nx-radius-lg, 14px)",
        background: "var(--nx-surface-2, rgba(255,255,255,0.02))",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Barra de color superior — sutil, identidad por color */}
      <Box
        aria-hidden={true}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "3px",
          background: fila.accent,
        }}
      />
      <Stack direction="column" gap="sm">
        <NxtText size="xs" weight="semibold" tone="muted">
          {fila.etiqueta.toUpperCase()}
        </NxtText>
        <Box style={{ marginTop: "var(--nx-space-1)" }}>
          <NxtText size="lg" weight="bold">
            {fila.rango}
          </NxtText>
        </Box>
        <NxtText size="sm" tone="muted">
          {fila.tone}
        </NxtText>
      </Stack>
    </Box>
  )
}
