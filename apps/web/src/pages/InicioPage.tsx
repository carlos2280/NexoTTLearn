import {
  NxtAvatar,
  NxtButton,
  NxtCard,
  NxtLayout,
  NxtLogo,
  NxtTopbar,
} from "@carlos2280/nexott-ui/react"
import { Box, Stack } from "@carlos2280/nexott-ui/react-primitives"
import { useLogout, useSesion } from "../hooks/useSesion"

export function InicioPage() {
  const { data: sesion } = useSesion()
  const logout = useLogout()

  if (!sesion) {
    return null
  }

  const iniciales = `${sesion.nombre[0] ?? ""}${sesion.apellido[0] ?? ""}`.toUpperCase()

  return (
    <NxtLayout theme="nexott-learn">
      <NxtTopbar slot="topbar">
        <NxtLogo slot="logo" mark="Nx" text="NexoTT" subtext="Learn" />
        <Stack slot="actions" direction="row" align="center" gap="md">
          <span style={{ fontSize: "var(--nx-text-sm)", color: "var(--nx-text-secondary)" }}>
            {sesion.nombre} {sesion.apellido} · {sesion.rol}
          </span>
          <NxtAvatar initials={iniciales} size="sm" />
          <NxtButton
            variant="ghost"
            size="sm"
            onNxtButtonClick={() => {
              logout.mutate()
            }}
          >
            Cerrar sesion
          </NxtButton>
        </Stack>
      </NxtTopbar>

      <Box slot="content" padding="xl">
        <Stack gap="lg">
          <NxtCard
            variant="surface"
            padding="lg"
            title={`Bienvenido, ${sesion.nombre}`}
            description={`Sesion activa. Aqui se construira la bandeja segun el rol (${sesion.rol}).`}
          />

          {sesion.debeCambiarPassword && (
            <Box surface="card" padding="md" radius="md">
              <span style={{ color: "var(--nx-amber-400)", fontSize: "var(--nx-text-sm)" }}>
                Debes cambiar tu contrasena en el primer acceso.
              </span>
            </Box>
          )}
        </Stack>
      </Box>
    </NxtLayout>
  )
}
