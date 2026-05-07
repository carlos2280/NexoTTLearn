import { useIsMutating, useQueryClient } from "@tanstack/react-query"
import { useEffect, useState } from "react"

export type SaveStatus =
  | { readonly tipo: "guardando" }
  | { readonly tipo: "guardado"; readonly lastSavedAt: number }
  | { readonly tipo: "ocioso" }

interface UseSaveStatusOptions {
  readonly tickMs?: number
}

// Combina el contador de mutaciones activas (TanStack) con un timestamp del
// ultimo success. El tick periodico no cambia la fuente de verdad, solo
// fuerza re-render para que "hace 3s" siga vivo sin nuevas mutaciones.
export function useSaveStatus({ tickMs = 5_000 }: UseSaveStatusOptions = {}): SaveStatus {
  const qc = useQueryClient()
  const mutating = useIsMutating()
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null)
  const [, setTick] = useState(0)

  useEffect(() => {
    const cache = qc.getMutationCache()
    const unsub = cache.subscribe((event) => {
      if (event.type === "updated" && event.mutation.state.status === "success") {
        setLastSavedAt(Date.now())
      }
    })
    return unsub
  }, [qc])

  useEffect(() => {
    if (lastSavedAt == null) {
      return
    }
    const id = window.setInterval(() => setTick((n) => n + 1), tickMs)
    return () => {
      window.clearInterval(id)
    }
  }, [lastSavedAt, tickMs])

  if (mutating > 0) {
    return { tipo: "guardando" }
  }
  if (lastSavedAt != null) {
    return { tipo: "guardado", lastSavedAt }
  }
  return { tipo: "ocioso" }
}

export function formatRelativeFromNow(timestamp: number, now: number = Date.now()): string {
  const seconds = Math.max(0, Math.floor((now - timestamp) / 1000))
  if (seconds < 5) {
    return "ahora"
  }
  if (seconds < 60) {
    return `hace ${seconds}s`
  }
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) {
    return `hace ${minutes}m`
  }
  const hours = Math.floor(minutes / 60)
  return `hace ${hours}h`
}
