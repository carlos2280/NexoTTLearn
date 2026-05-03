import { useLogout } from "@/features/auth/hooks/use-logout"
import { RUTAS } from "@/shared/constants/rutas"
import { NxtAvatar, NxtMenu, NxtMenuItem, NxtMenuSep } from "@carlos2280/nexott-ui/react"
import type { UsuarioPublico } from "@nexott-learn/shared-types"
import { useNavigate } from "react-router-dom"

type Props = {
  usuario: UsuarioPublico
  onPersonalizarClick?: () => void
}

export function UserMenu({ usuario, onPersonalizarClick }: Props) {
  const navigate = useNavigate()
  const logoutMutation = useLogout()

  const iniciales = `${usuario.nombre[0] ?? ""}${usuario.apellido[0] ?? ""}`.toUpperCase()

  const cerrarSesion = async (): Promise<void> => {
    await logoutMutation.mutateAsync()
    navigate(RUTAS.login, { replace: true })
  }

  return (
    <NxtMenu placement="bottom-end" minWidth={240}>
      <button
        slot="trigger"
        type="button"
        aria-label="Menu de usuario"
        style={{
          background: "transparent",
          border: "none",
          padding: 0,
          cursor: "pointer",
          borderRadius: "var(--nx-radius-full)",
        }}
      >
        <NxtAvatar initials={iniciales} ring={true} size="sm" />
      </button>

      <NxtMenuSep label={`${usuario.nombre} ${usuario.apellido}`} />
      <NxtMenuItem
        icon="user"
        label="Mi perfil"
        onNxtMenuItemClick={() => navigate(RUTAS.perfil)}
      />
      <NxtMenuItem
        icon="settings"
        label="Personalizar"
        onNxtMenuItemClick={() => onPersonalizarClick?.()}
        disabled={!onPersonalizarClick}
      />
      <NxtMenuItem icon="lock" label="Seguridad (MFA)" disabled={true} />
      <NxtMenuSep />
      <NxtMenuItem
        icon="log-out"
        label="Cerrar sesion"
        danger={true}
        onNxtMenuItemClick={async () => {
          await cerrarSesion()
        }}
      />
    </NxtMenu>
  )
}
