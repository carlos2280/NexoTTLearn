import { motion, useReducedMotion } from "framer-motion"
import type { PasoLogin } from "../login.types"
import { ConstelacionFondo } from "./constelacion-fondo"
import { FraseRotativa } from "./frase-rotativa"
import { IndicadorVida } from "./indicador-vida"
import { SaludoContextual } from "./saludo-contextual"
import { StreamVivo } from "./stream-vivo"
import { WordmarkHero } from "./wordmark-hero"

interface EscenarioMarcaProps {
  readonly paso: PasoLogin
}

const COLORES_POR_PASO: Record<PasoLogin, string> = {
  credenciales: "#EEF2FF",
  mfa: "#E0E7FF",
  "cambiar-password": "#E6FAF5",
  "aviso-privacidad": "#F3E8FF",
  bienvenida: "#FFF1E6",
}

export function EscenarioMarca({ paso }: EscenarioMarcaProps) {
  const reducedMotion = useReducedMotion()
  const esBienvenida = paso === "bienvenida"

  return (
    <motion.aside
      animate={{ backgroundColor: COLORES_POR_PASO[paso] }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
      className="nx-grain relative isolate overflow-hidden"
    >
      <ConstelacionFondo />
      <StreamVivo />

      <motion.div
        aria-hidden="true"
        animate={{ opacity: esBienvenida ? 1 : 0 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 35% 55%, rgba(255,176,98,0.32), transparent 55%)," +
            "radial-gradient(circle at 70% 70%, rgba(244,114,182,0.22), transparent 55%)",
        }}
      />

      <div className="relative z-10 flex h-full flex-col justify-between px-8 py-10 lg:px-16 lg:py-14">
        <motion.div
          initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center justify-between gap-4"
        >
          <span className="font-medium text-[11px] text-[var(--color-accent-on-soft)] uppercase leading-4 tracking-[0.22em]">
            Plataforma interna · NTT Data
          </span>
          <IndicadorVida />
        </motion.div>

        <motion.div
          animate={{
            scale: esBienvenida ? 0.78 : 1,
            y: esBienvenida ? -16 : 0,
          }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="flex max-w-[720px] origin-left flex-col gap-6 lg:gap-8"
        >
          <WordmarkHero />
          {esBienvenida ? null : <FraseRotativa />}
        </motion.div>

        <motion.div
          initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
          animate={{ opacity: esBienvenida ? 0.4 : 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="flex flex-col gap-2"
        >
          <SaludoContextual variant="timestamp" />
          <p className="max-w-[360px] text-[12px] text-[var(--color-text-tertiary)] leading-4">
            Acceso restringido a colaboradores autorizados.
          </p>
        </motion.div>
      </div>
    </motion.aside>
  )
}
