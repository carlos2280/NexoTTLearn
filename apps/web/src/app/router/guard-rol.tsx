import { useUsuarioActual } from "@/features/auth/hooks/use-usuario-actual"
import type { RolUsuario } from "@nexott-learn/shared-types"
import type { ReactNode } from "react"
import { Navigate } from "react-router-dom"

interface GuardRolProps {
  readonly children: ReactNode
  readonly permitidos: readonly RolUsuario[]
  readonly redirigirA: string
}

export function GuardRol({ children, permitidos, redirigirA }: GuardRolProps) {
  const { data: usuario, isLoading } = useUsuarioActual()

  if (isLoading) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <p className="text-text-tertiary">Cargando sesión…</p>
      </div>
    )
  }

  if (!(usuario && permitidos.includes(usuario.rol))) {
    return <Navigate to={redirigirA} replace={true} />
  }

  return <>{children}</>
}
