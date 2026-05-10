import type { TabDiagnostico } from "@/features/admin-diagnostico/types/diagnostico"
import { useCallback, useMemo } from "react"
import { useSearchParams } from "react-router-dom"

const TAB_PARAM = "tab"

function parseTab(raw: string | null): TabDiagnostico | undefined {
  if (raw === "1") {
    return 1
  }
  if (raw === "2") {
    return 2
  }
  if (raw === "3") {
    return 3
  }
  return undefined
}

interface UseTabActivaResult {
  readonly tabActiva: TabDiagnostico
  readonly setTabActiva: (tab: TabDiagnostico) => void
}

export function useTabActiva(tabPorDefecto: TabDiagnostico): UseTabActivaResult {
  const [params, setParams] = useSearchParams()
  const fromUrl = useMemo(() => parseTab(params.get(TAB_PARAM)), [params])
  const tabActiva: TabDiagnostico = fromUrl ?? tabPorDefecto

  const setTabActiva = useCallback(
    (tab: TabDiagnostico) => {
      const next = new URLSearchParams(params)
      next.set(TAB_PARAM, String(tab))
      setParams(next, { replace: true })
    },
    [params, setParams],
  )

  return { tabActiva, setTabActiva }
}
