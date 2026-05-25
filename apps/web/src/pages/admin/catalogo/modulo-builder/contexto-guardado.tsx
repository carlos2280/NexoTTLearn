import { type ReactNode, createContext, useCallback, useContext, useMemo, useState } from "react"
import type { EstadoGuardado } from "./editores/shared/use-auto-guardar-bloque"

interface ContextoValor {
  readonly estado: EstadoGuardado
  readonly reportar: (estado: EstadoGuardado) => void
  readonly reset: () => void
}

const Contexto = createContext<ContextoValor | null>(null)

interface ProveedorProps {
  readonly children: ReactNode
}

/**
 * Contexto compartido del estado de autoguardado del builder.
 *
 * Cada editor reporta su estado actual; el topbar consume el agregado para
 * mostrar un solo indicador global ("Guardando…" / "Guardado").
 */
export function ProveedorGuardadoBuilder({ children }: ProveedorProps) {
  const [estado, setEstado] = useState<EstadoGuardado>("limpio")

  const reportar = useCallback((siguiente: EstadoGuardado) => {
    setEstado(siguiente)
  }, [])

  const reset = useCallback(() => setEstado("limpio"), [])

  const valor = useMemo<ContextoValor>(
    () => ({ estado, reportar, reset }),
    [estado, reportar, reset],
  )

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

export function useGuardadoBuilder(): ContextoValor {
  const valor = useContext(Contexto)
  if (!valor) {
    // En tests o si se usa fuera del builder, devolvemos un noop.
    return {
      estado: "limpio",
      reportar: (_estado: EstadoGuardado) => undefined,
      reset: () => undefined,
    }
  }
  return valor
}
