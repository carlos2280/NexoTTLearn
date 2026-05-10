import { useCallback } from "react"
import { useSearchParams } from "react-router-dom"

export function useItemSeleccionado() {
  const [params, setParams] = useSearchParams()
  const itemId = params.get("id") ?? null

  const seleccionar = useCallback(
    (id: string | null) => {
      setParams((prev) => {
        const next = new URLSearchParams(prev)
        if (id) {
          next.set("id", id)
        } else {
          next.delete("id")
        }
        return next
      })
    },
    [setParams],
  )

  return { itemId, seleccionar }
}
