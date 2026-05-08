import { useCallback } from "react"
import { useSearchParams } from "react-router-dom"

export type MantenedoresTab = "usuarios" | "areas"

const TAB_PARAM = "tab"
const DEFAULT_TAB: MantenedoresTab = "usuarios"

function parseTab(raw: string | null): MantenedoresTab {
  return raw === "areas" ? "areas" : DEFAULT_TAB
}

export function useMantenedoresTab() {
  const [params, setParams] = useSearchParams()
  const tab = parseTab(params.get(TAB_PARAM))

  const setTab = useCallback(
    (next: MantenedoresTab) => {
      setParams(
        (prev) => {
          const copia = new URLSearchParams(prev)
          if (next === DEFAULT_TAB) {
            copia.delete(TAB_PARAM)
          } else {
            copia.set(TAB_PARAM, next)
          }
          return copia
        },
        { replace: true },
      )
    },
    [setParams],
  )

  return { tab, setTab }
}
