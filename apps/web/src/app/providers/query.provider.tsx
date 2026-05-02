import { USUARIO_ACTUAL_KEY } from "@/features/auth/hooks/use-usuario-actual"
import { setOnUnauthorized } from "@/shared/api/http-client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { PropsWithChildren } from "react"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
})

// Cuando un endpoint protegido responde 401, la sesion expiro mid-flight.
// Invalidamos el usuario en cache: la siguiente consulta a /auth/me devolvera
// null y GuardSesion redirigira a /login automaticamente.
setOnUnauthorized(() => {
  queryClient.setQueryData(USUARIO_ACTUAL_KEY, null)
  queryClient.invalidateQueries({ queryKey: USUARIO_ACTUAL_KEY })
})

export function QueryProvider({ children }: PropsWithChildren) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
