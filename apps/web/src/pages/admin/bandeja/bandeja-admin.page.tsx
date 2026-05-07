import { useUsuarioActual } from "@/features/auth/hooks/use-usuario-actual"
import { NxtEmpty } from "@carlos2280/nexott-ui/react"
import { Box } from "@carlos2280/nexott-ui/react-primitives"

export function BandejaAdminPage() {
  const { data: usuario } = useUsuarioActual()

  if (!usuario) {
    return null
  }

  return (
    <Box slot="content" padding={{ base: "lg", md: "xl" }}>
      <NxtEmpty
        icon="dashboard"
        title="Bandeja en construcción"
        description="Estamos rediseñando la bandeja del administrador. Vuelve pronto."
      />
    </Box>
  )
}
