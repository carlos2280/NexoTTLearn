import type { LoginInput, LoginResponse, UsuarioPublico } from "@nexott-learn/shared-types"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ApiError, api } from "../lib/api"

const SESION_KEY = ["sesion", "me"] as const

export function useSesion() {
  return useQuery<UsuarioPublico | null>({
    queryKey: SESION_KEY,
    queryFn: async () => {
      try {
        return await api<UsuarioPublico>("/auth/me")
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          return null
        }
        throw err
      }
    },
    staleTime: 60_000,
  })
}

export function useLogin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: LoginInput) =>
      api<LoginResponse>("/auth/login", { method: "POST", body: input }),
    onSuccess: (data) => {
      qc.setQueryData(SESION_KEY, data.usuario)
    },
  })
}

export function useLogout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api<void>("/auth/logout", { method: "POST" }),
    onSuccess: () => {
      qc.setQueryData(SESION_KEY, null)
      qc.clear()
    },
  })
}
