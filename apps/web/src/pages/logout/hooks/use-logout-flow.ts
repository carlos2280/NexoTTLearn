import { logout } from "@/features/auth/api/logout.api"
import { USUARIO_ACTUAL_KEY } from "@/features/auth/hooks/use-usuario-actual"
import type { UsuarioSesion } from "@/features/auth/types"
import { RUTAS } from "@/shared/constants/rutas"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

const DURACION_DESPEDIDA_MS = 2800

export type EstadoLogout = "cerrando" | "despedida" | "redirigiendo"

interface UseLogoutFlowResult {
  readonly estado: EstadoLogout
  readonly usuario: UsuarioSesion | null
  readonly error: Error | null
  readonly reintentar: () => void
}

export function useLogoutFlow(): UseLogoutFlowResult {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [estado, setEstado] = useState<EstadoLogout>("cerrando")

  const usuario = queryClient.getQueryData<UsuarioSesion>(USUARIO_ACTUAL_KEY) ?? null

  const mutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.setQueryData(USUARIO_ACTUAL_KEY, null)
      queryClient.removeQueries({ queryKey: USUARIO_ACTUAL_KEY })
      setEstado("despedida")
    },
  })

  useEffect(() => {
    if (!mutation.isIdle) {
      return
    }
    mutation.mutate()
  }, [mutation])

  useEffect(() => {
    if (estado !== "despedida") {
      return
    }
    const id = window.setTimeout(() => {
      setEstado("redirigiendo")
      navigate(RUTAS.login, { replace: true })
    }, DURACION_DESPEDIDA_MS)
    return () => window.clearTimeout(id)
  }, [estado, navigate])

  return {
    estado,
    usuario,
    error: mutation.error,
    reintentar: () => {
      mutation.reset()
      setEstado("cerrando")
    },
  }
}
