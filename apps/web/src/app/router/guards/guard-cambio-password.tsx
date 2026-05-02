import { useUsuarioActual } from "@/features/auth/hooks/use-usuario-actual"
import { RUTAS } from "@/shared/constants/rutas"
import { Navigate, Outlet } from "react-router-dom"

// Si el usuario tiene debeCambiarPassword=true, fuerza el redirect a /cambiar-password
// antes de poder navegar a cualquier ruta protegida.
export function GuardCambioPassword() {
  const { data: usuario } = useUsuarioActual()

  if (usuario?.debeCambiarPassword) {
    return <Navigate to={RUTAS.cambiarPassword} replace={true} />
  }

  return <Outlet />
}
