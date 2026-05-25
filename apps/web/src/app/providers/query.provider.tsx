import { USUARIO_ACTUAL_KEY } from "@/features/auth/hooks/use-usuario-actual"
import { EVENTO_NO_AUTORIZADO } from "@/shared/api/http-client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { PropsWithChildren } from "react"
import { useEffect, useState } from "react"

export function QueryProvider({ children }: PropsWithChildren) {
  const [client] = useState(
    () =>
      new QueryClient({
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
      }),
  )

  useEffect(() => {
    function manejarNoAutorizado() {
      client.setQueryData(USUARIO_ACTUAL_KEY, null)
      client.invalidateQueries({ queryKey: USUARIO_ACTUAL_KEY })
    }
    window.addEventListener(EVENTO_NO_AUTORIZADO, manejarNoAutorizado)
    return () => window.removeEventListener(EVENTO_NO_AUTORIZADO, manejarNoAutorizado)
  }, [client])

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
