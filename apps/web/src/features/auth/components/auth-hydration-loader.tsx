import { useEffect, useState } from "react"
import { AUTH_TIMINGS } from "../constants/timings"

/**
 * Loader minimalista para hidratacion de sesion en pantallas auth.
 *
 * Sustituye el `return null` durante isLoading. Mantiene el ambiente
 * cromatico de auth (fondo + logo brand) para que la transicion
 * a la pantalla real no se sienta como un flash.
 *
 * Solo se renderiza despues de AUTH_TIMINGS.hydrationLoaderDelay ms
 * para evitar el flash cuando la query resuelve casi inmediato.
 */
export function AuthHydrationLoader() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setVisible(true)
    }, AUTH_TIMINGS.hydrationLoaderDelay)
    return () => {
      window.clearTimeout(timer)
    }
  }, [])

  return (
    <output
      aria-live="polite"
      aria-label="Cargando sesion"
      className={`fixed inset-0 z-0 flex items-center justify-center bg-surface-0 transition-opacity duration-200 ${visible ? "opacity-100" : "opacity-0"}`}
    >
      <span
        aria-hidden="true"
        className="grid size-14 animate-[breathing_2.4s_ease-in-out_infinite] place-items-center rounded-[var(--radius-xl)] bg-[linear-gradient(135deg,var(--brand-violet)_0%,var(--brand-cyan)_100%)] font-extrabold text-lg text-white tracking-tight shadow-[0_8px_32px_rgb(124_58_237/0.35)]"
      >
        Nx
      </span>
    </output>
  )
}
