import { useLogout } from "@/features/auth/hooks/use-logout"
import { useUsuarioActual } from "@/features/auth/hooks/use-usuario-actual"
import { RUTAS } from "@/shared/constants/rutas"
import { NxtAvatar, NxtButton, NxtLayout, NxtLogo, NxtTopbar } from "@carlos2280/nexott-ui/react"
import { Stack } from "@carlos2280/nexott-ui/react-primitives"
import { Outlet, useNavigate } from "react-router-dom"

export function LayoutAdmin() {
  const navigate = useNavigate()
  const { data: usuario } = useUsuarioActual()
  const logoutMutation = useLogout()

  if (!usuario) {
    return null
  }

  const iniciales = `${usuario.nombre[0] ?? ""}${usuario.apellido[0] ?? ""}`.toUpperCase()

  const cerrarSesion = async (): Promise<void> => {
    await logoutMutation.mutateAsync()
    navigate(RUTAS.login, { replace: true })
  }

  return (
    <NxtLayout theme="nexott-learn">
      <NxtTopbar slot="topbar">
        <NxtLogo slot="logo" mark="Nx" text="NexoTT" subtext="Learn · Admin" />
        <Stack slot="actions" direction="row" align="center" gap="md">
          <span style={{ fontSize: "var(--nx-text-sm)", color: "var(--nx-text-secondary)" }}>
            {usuario.nombre} {usuario.apellido} · ADMIN
          </span>
          <NxtAvatar initials={iniciales} size="sm" />
          <NxtButton
            variant="ghost"
            size="sm"
            onNxtButtonClick={async () => {
              await cerrarSesion()
            }}
          >
            Cerrar sesion
          </NxtButton>
        </Stack>
      </NxtTopbar>

      <Outlet />
    </NxtLayout>
  )
}
