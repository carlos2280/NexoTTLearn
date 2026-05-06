import { useUsuarioActual } from "@/features/auth/hooks/use-usuario-actual"
import { RUTAS } from "@/shared/constants/rutas"
import { obtenerSaludo } from "@/shared/lib/saludo"
import {
  NxtButton,
  NxtCard,
  NxtEyebrow,
  NxtHeading,
  NxtIconTile,
  NxtText,
} from "@carlos2280/nexott-ui/react"
import { Box, Grid, Stack } from "@carlos2280/nexott-ui/react-primitives"
import { useNavigate } from "react-router-dom"

// Bandeja admin · placeholder transitorio durante la migración v2.
// Los KPIs reales viven en /admin/dashboard del backend, que se reescribe en
// PR-09. Mientras tanto, esta pantalla muestra solo el saludo + accesos a
// secciones que SÍ están activas tras la migración. El código previo con
// KPIs/streams/colas vive en `pages/admin/_legacy/` como referencia.

export function BandejaAdminPage() {
  const { data: usuario } = useUsuarioActual()
  const navigate = useNavigate()

  if (!usuario) {
    return null
  }

  const saludo = `${obtenerSaludo()}, ${usuario.nombre}`

  return (
    <Box slot="content" padding={{ base: "lg", md: "xl" }}>
      <Stack gap="2xl">
        <Stack gap="xs">
          <NxtHeading level={1}>{saludo}</NxtHeading>
          <NxtText tone="muted">
            Estamos migrando módulos al nuevo modelo. Por ahora puedes gestionar el catálogo de
            áreas. Cursos y otros módulos vuelven en próximas entregas.
          </NxtText>
        </Stack>

        <Grid columns={{ base: 1, md: 2 }} gap="lg">
          <NxtCard onNxtCardClick={() => navigate(RUTAS.admin.mantenedores)}>
            <Box padding="lg">
              <Stack gap="md">
                <NxtIconTile name="users" size="lg" gradient="indigo" />
                <Stack gap="xs">
                  <NxtEyebrow accent="bar">Disponible</NxtEyebrow>
                  <NxtHeading level={3}>Mantenedores</NxtHeading>
                  <NxtText tone="muted">
                    Catálogo global de áreas y, próximamente, gestión de usuarios.
                  </NxtText>
                </Stack>
                <NxtButton variant="secondary" size="sm" icon="chevron-right">
                  Ir a mantenedores
                </NxtButton>
              </Stack>
            </Box>
          </NxtCard>

          <NxtCard>
            <Box padding="lg">
              <Stack gap="md">
                <NxtIconTile name="book" size="lg" gradient="slate" />
                <Stack gap="xs">
                  <NxtEyebrow accent="bar">Próximamente</NxtEyebrow>
                  <NxtHeading level={3}>Cursos</NxtHeading>
                  <NxtText tone="muted">
                    Editor de cursos en migración al nuevo modelo de áreas y pesos.
                  </NxtText>
                </Stack>
              </Stack>
            </Box>
          </NxtCard>
        </Grid>
      </Stack>
    </Box>
  )
}
