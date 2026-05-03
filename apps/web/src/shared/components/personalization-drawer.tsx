import { NxtDrawer, NxtEyebrow, NxtFontToggle, NxtThemeToggle } from "@carlos2280/nexott-ui/react"
import { Stack } from "@carlos2280/nexott-ui/react-primitives"

type Props = {
  open: boolean
  onClose: () => void
}

export function PersonalizationDrawer({ open, onClose }: Props) {
  return (
    <NxtDrawer
      open={open}
      side="right"
      size="sm"
      title="Personalizar"
      icon="settings"
      onNxtDrawerClose={onClose}
    >
      <Stack gap="lg">
        <Stack gap="sm">
          <NxtEyebrow accent="bar">Apariencia</NxtEyebrow>
          <NxtThemeToggle variant="cards" />
        </Stack>
        <Stack gap="sm">
          <NxtEyebrow accent="bar">Tipografia</NxtEyebrow>
          <NxtFontToggle variant="cards" />
        </Stack>
      </Stack>
    </NxtDrawer>
  )
}
