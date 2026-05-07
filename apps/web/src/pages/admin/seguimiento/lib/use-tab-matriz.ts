import type { SeguimientoTab } from "@nexott-learn/shared-types"
import { useCallback } from "react"
import { useSearchParams } from "react-router-dom"

const VALORES: readonly SeguimientoTab[] = ["actual", "inicial"]

function parseTab(raw: string | null): SeguimientoTab {
  if (raw === "inicial" || raw === "actual") {
    return raw
  }
  return "actual"
}

export function useTabMatriz(): {
  readonly tab: SeguimientoTab
  readonly setTab: (next: SeguimientoTab) => void
} {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = parseTab(searchParams.get("tab"))

  const setTab = useCallback(
    (next: SeguimientoTab) => {
      const params = new URLSearchParams(searchParams)
      if (next === "actual") {
        params.delete("tab")
      } else {
        params.set("tab", next)
      }
      setSearchParams(params, { replace: true })
    },
    [searchParams, setSearchParams],
  )

  return { tab, setTab }
}

export const TABS_MATRIZ_DISPONIBLES = VALORES
