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
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--nx-bg, #0e0e0e)",
        opacity: visible ? 1 : 0,
        transition: "opacity 200ms ease",
        zIndex: 0,
      }}
    >
      <span
        aria-hidden={true}
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontWeight: 800,
          fontSize: 18,
          letterSpacing: "-0.03em",
          background:
            "var(--nx-gradient-brand, linear-gradient(135deg, #8B5CF6, #6366F1, #06B6D4))",
          boxShadow: "0 8px 32px var(--nx-brand-glow, rgba(99, 102, 241, 0.35))",
          animation: "nxt-auth-loader-breathe 2.4s ease-in-out infinite",
        }}
      >
        Nx
        <style>{`
          @keyframes nxt-auth-loader-breathe {
            0%, 100% {
              transform: scale(1);
              box-shadow: 0 8px 32px rgba(99, 102, 241, 0.30);
            }
            50% {
              transform: scale(1.05);
              box-shadow: 0 12px 44px rgba(99, 102, 241, 0.55);
            }
          }
          @media (prefers-reduced-motion: reduce) {
            output > span {
              animation: none !important;
            }
          }
        `}</style>
      </span>
    </output>
  )
}
