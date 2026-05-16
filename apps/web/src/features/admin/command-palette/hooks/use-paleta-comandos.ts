import { useCallback, useEffect, useState } from "react"

interface PaletaComandos {
  readonly abierta: boolean
  readonly abrir: () => void
  readonly cerrar: () => void
  readonly alternar: () => void
}

export function usePaletaComandos(): PaletaComandos {
  const [abierta, setAbierta] = useState(false)

  const abrir = useCallback(() => setAbierta(true), [])
  const cerrar = useCallback(() => setAbierta(false), [])
  const alternar = useCallback(() => setAbierta((v) => !v), [])

  useEffect(() => {
    function manejarAtajo(event: KeyboardEvent) {
      const esK = event.key === "k" || event.key === "K"
      if (esK && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setAbierta((v) => !v)
      }
    }
    window.addEventListener("keydown", manejarAtajo)
    return () => window.removeEventListener("keydown", manejarAtajo)
  }, [])

  return { abierta, abrir, cerrar, alternar }
}
