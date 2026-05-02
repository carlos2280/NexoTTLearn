import { NxtLayoutAuth, NxtSuccessMark } from "@carlos2280/nexott-ui/react"
import { useEffect } from "react"
import { AUTH_TIMINGS } from "../constants/timings"

interface AuthSuccessScreenProps {
  /** Titulo grande del panel hero. Soporta \n para salto de linea. */
  readonly heroTitle: string
  /** Subtitulo del hero (descriptivo). */
  readonly heroSubtitle?: string
  /** Frase del manifesto (debajo del hero). */
  readonly manifesto: string
  /** Texto principal junto al check. */
  readonly label: string
  /** Texto secundario opcional debajo del label. */
  readonly sublabel?: string
  /** Callback ejecutado al terminar la pantalla intersticial. */
  readonly onComplete: () => void
  /** Override del timing en ms. Por defecto AUTH_TIMINGS.successScreenDuration. */
  readonly durationMs?: number
}

/**
 * Pantalla intersticial de exito para flujos de auth.
 *
 * Mantiene el envoltorio NxtLayoutAuth (mismo ambiente cromatico)
 * y reemplaza el formulario por un NxtSuccessMark grande con tone="brand"
 * (espectro completo: el "exito" en NexoTT es entrar al producto).
 *
 * Tras durationMs, ejecuta onComplete (tipicamente un navigate).
 */
export function AuthSuccessScreen({
  heroTitle,
  heroSubtitle,
  manifesto,
  label,
  sublabel,
  onComplete,
  durationMs = AUTH_TIMINGS.successScreenDuration,
}: AuthSuccessScreenProps) {
  useEffect(() => {
    const timer = window.setTimeout(onComplete, durationMs)
    return () => {
      window.clearTimeout(timer)
    }
  }, [onComplete, durationMs])

  return (
    <NxtLayoutAuth
      theme="nexott-learn"
      appMark="Nx"
      appName="NexoTT"
      appSub="Learn"
      heroTitle={heroTitle}
      heroSubtitle={heroSubtitle ?? ""}
      manifesto={manifesto}
      version="v0.1"
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "320px",
        }}
      >
        <NxtSuccessMark tone="brand" size="lg" label={label} sublabel={sublabel ?? ""} />
      </div>
    </NxtLayoutAuth>
  )
}
