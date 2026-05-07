import { AuthShell } from "@/shared/ui/patterns/auth-shell"
import { motion } from "framer-motion"
import { Check } from "lucide-react"
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
    return () => window.clearTimeout(timer)
  }, [onComplete, durationMs])

  return (
    <AuthShell
      appMark="Nx"
      appName="NexoTT"
      appSub="Learn"
      heroEyebrow="Acceso confirmado"
      heroTitle={heroTitle}
      heroSubtitle={heroSubtitle}
      manifesto={manifesto}
      version="v0.1"
    >
      <SuccessMark label={label} sublabel={sublabel} />
    </AuthShell>
  )
}

interface SuccessMarkProps {
  readonly label: string
  readonly sublabel?: string
}

function SuccessMark({ label, sublabel }: SuccessMarkProps) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center gap-6 text-center">
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
        className="relative grid size-24 place-items-center rounded-full bg-[linear-gradient(135deg,var(--brand-violet)_0%,var(--brand-cyan)_100%)] shadow-[0_12px_40px_-8px_rgb(124_58_237/0.6)]"
      >
        <span
          aria-hidden="true"
          className="absolute inset-0 animate-[breathing_4s_ease-in-out_infinite] rounded-full bg-[linear-gradient(135deg,var(--brand-violet)_0%,var(--brand-cyan)_100%)] opacity-50 blur-xl"
        />
        <motion.span
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.45, delay: 0.25, ease: "easeOut" }}
          className="relative"
        >
          <Check className="size-12 text-white" strokeWidth={3} aria-hidden="true" />
        </motion.span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="flex flex-col items-center gap-1.5"
      >
        <h2 className="font-bold text-2xl text-text-primary tracking-tight">{label}</h2>
        {sublabel ? <p className="text-sm text-text-secondary">{sublabel}</p> : null}
      </motion.div>
    </div>
  )
}
