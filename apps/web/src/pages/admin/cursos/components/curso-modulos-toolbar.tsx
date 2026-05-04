import { NxtButton, NxtCard, NxtEyebrow, NxtTag, NxtText } from "@carlos2280/nexott-ui/react"
import { Stack } from "@carlos2280/nexott-ui/react-primitives"

interface CursoModulosToolbarProps {
  // Suma de pesos definidos. null = ningun modulo tiene peso configurado.
  readonly pesoTotal: number | null
  readonly onNuevoModulo: () => void
  readonly onClonarModulo: () => void
}

export function CursoModulosToolbar({
  pesoTotal,
  onNuevoModulo,
  onClonarModulo,
}: CursoModulosToolbarProps) {
  return (
    <Stack gap="md">
      {/* Toolbar: eyebrow + acciones (los contadores van en el banner de peso) */}
      <Stack direction={{ base: "column", md: "row" }} align="center" justify="between" gap="md">
        <NxtEyebrow accent="bar">Modulos del Curso</NxtEyebrow>

        <Stack direction="row" gap="sm" wrap={true}>
          <NxtButton variant="secondary" icon="copy" onNxtButtonClick={onClonarModulo}>
            Clonar de otro curso
          </NxtButton>
          <NxtButton variant="primary" icon="plus" onNxtButtonClick={onNuevoModulo}>
            Nuevo modulo
          </NxtButton>
        </Stack>
      </Stack>

      {/* Banner de peso total — card propia para destacar el estado */}
      <NxtCard variant="surface" padding="sm">
        <Stack direction="row" align="center" gap="sm" wrap={true}>
          <NxtText size="sm" tone="dim">
            Peso total:
          </NxtText>
          <NxtText size="sm" weight="semibold">
            {formatearPeso(pesoTotal)}
          </NxtText>
          <ChipPesoTotal pesoTotal={pesoTotal} />
        </Stack>
      </NxtCard>
    </Stack>
  )
}

interface ChipPesoTotalProps {
  readonly pesoTotal: number | null
}

function ChipPesoTotal({ pesoTotal }: ChipPesoTotalProps) {
  if (pesoTotal === null) {
    return <NxtTag variant="neutral">Sin definir</NxtTag>
  }

  // Tolerancia de 0.5% para absorber el ruido de aritmetica float.
  if (Math.abs(pesoTotal - 100) < 0.5) {
    return <NxtTag variant="emerald">Correcto</NxtTag>
  }

  return <NxtTag variant="amber">Ajustar</NxtTag>
}

function formatearPeso(peso: number | null): string {
  if (peso === null) {
    return "—"
  }
  // Mostrar entero si es entero, o 1 decimal en caso contrario.
  return `${Number.isInteger(peso) ? String(peso) : peso.toFixed(1)}%`
}
