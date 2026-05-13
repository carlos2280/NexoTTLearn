import { useUsuarioActual } from "@/features/auth/hooks/use-usuario-actual"
import { AvatarIniciales } from "@/shared/components/ui/avatar-iniciales"
import { MenuAcciones } from "@/shared/components/ui/menu-acciones"
import { RUTAS } from "@/shared/constants/rutas"
import { ChevronDown, LogOut, User } from "lucide-react"
import { useNavigate } from "react-router-dom"

/**
 * Menú del usuario en el topbar del admin.
 *
 * Centraliza "Mi cuenta" + "Cerrar sesión" en un dropdown del avatar.
 * Pensado para crecer: en el futuro entrarán aquí "Tema", "Atajos",
 * "Notificaciones", etc., sin romper la composición del topbar.
 */
export function AdminUserMenu() {
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
            onClick: () => navigate(RUTAS.cuenta),
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
          className="flex items-center gap-2 rounded-pill py-1 pr-2 pl-1 transition-colors duration-fast ease-default hover:bg-subtle focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2"
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
