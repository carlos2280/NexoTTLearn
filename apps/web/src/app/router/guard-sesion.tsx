import { useUsuarioActual } from "@/features/auth/hooks/use-usuario-actual"
import { RUTAS } from "@/shared/constants/rutas"
import type { ReactNode } from "react"
import { Navigate } from "react-router-dom"

interface GuardSesionProps {
  readonly children: ReactNode
}

export function GuardSesion({ children }: GuardSesionProps) {
  const { data: usuario, isLoading, isError } = useUsuarioActual()

  if (isLoading) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <p className="text-[var(--color-text-tertiary)]">Cargando sesión…</p>
      </div>
    )
  }

  if (isError || !usuario) {
    return <Navigate to={RUTAS.login} replace={true} />
  }

  return <>{children}</>
}
