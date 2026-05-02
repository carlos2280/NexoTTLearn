import { useUsuarioActual } from "@/features/auth/hooks/use-usuario-actual"
import { NxtCard } from "@carlos2280/nexott-ui/react"
import { Box, Stack } from "@carlos2280/nexott-ui/react-primitives"

export function BandejaPage() {
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
          description="Aqui veras tu siguiente paso, pendientes y novedades."
        />
        <NxtCard
          variant="outlined"
          padding="lg"
          title="Bandeja en construccion"
          description="Sprint 1 — Esta pantalla mostrara hero saludo + Tu siguiente paso + stream de Pendientes/Novedades."
        />
      </Stack>
    </Box>
  )
}
