import type { ReactNode } from "react"
import { Navigate, useLocation } from "react-router-dom"
import { useSesion } from "../../hooks/useSesion"

type Props = {
  children: ReactNode
}

export function RutaProtegida({ children }: Props) {
  const { data: sesion, isLoading } = useSesion()
  const location = useLocation()

  if (isLoading) {
    return null
  }

  if (!sesion) {
    return <Navigate to="/login" replace={true} state={{ from: location.pathname }} />
  }

  return <>{children}</>
}
