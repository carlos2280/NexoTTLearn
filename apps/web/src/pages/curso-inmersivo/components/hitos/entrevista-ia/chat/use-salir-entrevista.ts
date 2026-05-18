import { useCallback, useEffect, useState } from "react"

interface UseSalirEntrevistaParams {
  readonly habilitado: boolean
  readonly onSalir: (() => void) | undefined
}

interface UseSalirEntrevistaResult {
  readonly confirmacionAbierta: boolean
  readonly setConfirmacionAbierta: (abierto: boolean) => void
  readonly pedirSalir: () => void
  readonly confirmarSalir: () => Promise<void>
}

/**
 * Encapsula el flujo de "salir de la entrevista": atajo Esc, apertura de
 * confirmacion y ejecucion del callback. Cuando el dialog esta abierto,
 * Radix captura Esc para cerrarlo, asi que el listener global no dispara
 * doble efecto.
 */
export function useSalirEntrevista({
  habilitado,
  onSalir,
}: UseSalirEntrevistaParams): UseSalirEntrevistaResult {
  const [confirmacionAbierta, setConfirmacionAbierta] = useState(false)

  const pedirSalir = useCallback(() => {
    if (habilitado) {
      setConfirmacionAbierta(true)
    }
  }, [habilitado])

  useEffect(() => {
    if (!habilitado) {
      return
    }
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape" && !confirmacionAbierta) {
        e.preventDefault()
        setConfirmacionAbierta(true)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [habilitado, confirmacionAbierta])

  const confirmarSalir = useCallback((): Promise<void> => {
    setConfirmacionAbierta(false)
    onSalir?.()
    return Promise.resolve()
  }, [onSalir])

  return { confirmacionAbierta, setConfirmacionAbierta, pedirSalir, confirmarSalir }
}
