import { NxtButton, NxtCard, NxtIconTile, NxtText } from "@carlos2280/nexott-ui/react"
import { Stack } from "@carlos2280/nexott-ui/react-primitives"

interface CursoModulosEmptyProps {
  readonly onCrearPrimero: () => void
}

export function CursoModulosEmpty({ onCrearPrimero }: CursoModulosEmptyProps) {
  return (
    <NxtCard variant="surface" padding="lg">
      <Stack align="center" gap="md">
        <NxtIconTile name="layers" gradient="indigo" size="lg" />
        <Stack align="center" gap="xs">
          <NxtText size="md" weight="semibold">
            No hay modulos todavia
          </NxtText>
          <NxtText size="sm" tone="dim">
            Crea el primer modulo del curso para empezar a estructurar el contenido.
          </NxtText>
        </Stack>
        <NxtButton variant="primary" icon="plus" onNxtButtonClick={onCrearPrimero}>
          Crear primer modulo
        </NxtButton>
      </Stack>
    </NxtCard>
  )
}
