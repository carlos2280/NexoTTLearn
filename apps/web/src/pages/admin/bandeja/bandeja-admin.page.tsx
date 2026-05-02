import { useUsuarioActual } from "@/features/auth/hooks/use-usuario-actual"
import { NxtCard } from "@carlos2280/nexott-ui/react"
import { Box, Stack } from "@carlos2280/nexott-ui/react-primitives"

export function BandejaAdminPage() {
  const { data: usuario } = useUsuarioActual()

  if (!usuario) {
    return null
  }

  return (
    <Box slot="content" padding="xl">
      <Stack gap="lg">
        <NxtCard
          variant="surface"
          padding="lg"
          title={`Hola, ${usuario.nombre}`}
          description="Bandeja del administrador."
        />
        <NxtCard
          variant="outlined"
          padding="lg"
          title="Bandeja Admin en construccion"
          description="Sprint 1 — Hero saludo + KPIs con sparklines + alertas + timeline + quick actions."
        />
      </Stack>
    </Box>
  )
}
