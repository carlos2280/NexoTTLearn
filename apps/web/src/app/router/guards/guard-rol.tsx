import { useUsuarioActual } from "@/features/auth/hooks/use-usuario-actual"
import { RUTAS } from "@/shared/constants/rutas"
import type { Rol } from "@nexott-learn/shared-types"
import { Navigate, Outlet } from "react-router-dom"

interface GuardRolProps {
  readonly rol: Rol
}

// Restringe el acceso a rutas que requieren un rol especifico.
// Asume que GuardSesion ya garantizo que existe usuario.
export function GuardRol({ rol }: GuardRolProps) {
  const { data: usuario } = useUsuarioActual()

  if (!usuario) {
    return <Navigate to={RUTAS.login} replace={true} />
  }

  if (usuario.rol !== rol) {
    return <Navigate to={RUTAS.login} replace={true} />
  }

  return <Outlet />
}
