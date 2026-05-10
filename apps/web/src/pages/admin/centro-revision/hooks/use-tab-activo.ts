import { useCallback } from "react"
import { useSearchParams } from "react-router-dom"

export type TabCentroRevision = "entregas" | "proyectos"

const TAB_DEFAULT: TabCentroRevision = "entregas"

function isTabValido(value: string): value is TabCentroRevision {
  return value === "entregas" || value === "proyectos"
}

export function useTabActivo() {
  const [params, setParams] = useSearchParams()
  const raw = params.get("tab") ?? ""
  const tab: TabCentroRevision = isTabValido(raw) ? raw : TAB_DEFAULT

  const setTab = useCallback(
    (next: TabCentroRevision) => {
      setParams((prev) => {
        const next_ = new URLSearchParams(prev)
        next_.set("tab", next)
        next_.delete("id")
        return next_
      })
    },
    [setParams],
  )

  return { tab, setTab }
}
