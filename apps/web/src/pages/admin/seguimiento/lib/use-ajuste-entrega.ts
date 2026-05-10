import { useCallback, useState } from "react"
import type { EntregaAjustable } from "../components/fila-entrega-reciente"

export function useAjusteEntrega() {
  const [entrega, setEntrega] = useState<EntregaAjustable | null>(null)
  const abrir = useCallback((e: EntregaAjustable) => {
    setEntrega(e)
  }, [])
  const cerrar = useCallback(() => {
    setEntrega(null)
  }, [])
  return { entrega, abrir, cerrar }
}
