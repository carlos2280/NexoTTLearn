import { useUsuarioActual } from "@/features/auth/hooks/use-usuario-actual"
import { AvatarIniciales } from "@/shared/components/ui/avatar-iniciales"
import { MenuAcciones } from "@/shared/components/ui/menu-acciones"
import { RUTAS } from "@/shared/constants/rutas"
import { ChevronDown, LogOut, User } from "lucide-react"
import { useNavigate } from "react-router-dom"

interface AdminUserMenuProps {
  readonly onAbrirCuenta: () => void
}

/**
 * Menú del usuario en el topbar del admin.
 *
 * "Mi cuenta" abre el drawer (sin perder contexto). "Cerrar sesión" navega.
 * Pensado para crecer: aquí entrarán en el futuro "Tema", "Atajos",
 * "Notificaciones", sin romper la composición del topbar.
 */
export function AdminUserMenu({ onAbrirCuenta }: AdminUserMenuProps) {
  const { data: usuario } = useUsuarioActual()
  const navigate = useNavigate()

  if (!usuario) {
    return null
  }

  return (
    <MenuAcciones
      etiquetaAria={`Menú de ${usuario.nombre}`}
      grupos={[
        [
          {
            id: "cuenta",
            etiqueta: "Mi cuenta",
            icono: User,
            onClick: onAbrirCuenta,
          },
        ],
        [
          {
            id: "logout",
            etiqueta: "Cerrar sesión",
            icono: LogOut,
            onClick: () => navigate(RUTAS.logout),
          },
        ],
      ]}
      trigger={
        <button
          type="button"
          aria-label={`Menú de ${usuario.nombre}`}
          className="flex cursor-pointer items-center gap-2 rounded-pill py-1 pr-2 pl-1 transition-colors duration-fast ease-default hover:bg-subtle focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
        >
          <AvatarIniciales nombre={usuario.nombre} tamano="sm" />
          <span className="hidden text-body-sm text-text-primary sm:inline">{usuario.nombre}</span>
          <ChevronDown
            className="hidden h-3.5 w-3.5 text-text-tertiary sm:inline"
            strokeWidth={2}
            aria-hidden={true}
          />
        </button>
      }
    />
  )
}
