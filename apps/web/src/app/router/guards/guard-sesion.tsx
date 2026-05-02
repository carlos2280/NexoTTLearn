import { useUsuarioActual } from "@/features/auth/hooks/use-usuario-actual"
import { RUTAS } from "@/shared/constants/rutas"
import { Navigate, Outlet, useLocation } from "react-router-dom"

// Bloquea rutas que requieren sesion. Si no hay usuario, redirige a /login
// preservando la ruta original en location.state.from para volver despues del login.
export function GuardSesion() {
  const { data: usuario, isLoading } = useUsuarioActual()
  const location = useLocation()

  if (isLoading) {
    return null
  }

  if (!usuario) {
    return <Navigate to={RUTAS.login} replace={true} state={{ from: location.pathname }} />
  }

  return <Outlet />
}
