import { motion } from "framer-motion"
import { DUR, EASE } from "@/shared/lib/motion"
import type { PasoLogin } from "../login.types"
import { ConstelacionFondo } from "./constelacion-fondo"
import { FraseRotativa } from "./frase-rotativa"
import { StreamVivo } from "./stream-vivo"
import { WordmarkHero } from "./wordmark-hero"

interface EscenarioMarcaProps {
  readonly paso: PasoLogin
}

const ATMOSFERA_POR_PASO: Record<PasoLogin, string> = {
  credenciales: "var(--color-atmos-credenciales)",
  mfa: "var(--color-atmos-mfa)",
  "cambiar-password": "var(--color-atmos-cambiar-password)",
  "aviso-privacidad": "var(--color-atmos-aviso-privacidad)",
  bienvenida: "var(--color-atmos-bienvenida)",
  despedida: "var(--color-atmos-despedida)",
}

/** Cada paso tiene su propio gradiente radial sutil definido en tokens. */
const GRADIENTE_POR_PASO: Record<PasoLogin, string> = {
  credenciales: "var(--gradient-atmos-credenciales)",
  mfa: "var(--gradient-atmos-mfa)",
  "cambiar-password": "var(--gradient-atmos-cambiar-password)",
  "aviso-privacidad": "var(--gradient-atmos-aviso-privacidad)",
  bienvenida: "var(--gradient-atmos-bienvenida)",
  despedida: "var(--gradient-atmos-despedida)",
}

const PASOS: readonly PasoLogin[] = [
  "credenciales",
  "mfa",
  "cambiar-password",
  "aviso-privacidad",
  "bienvenida",
  "despedida",
]

export function EscenarioMarca({ paso }: EscenarioMarcaProps) {
  const esCierre = paso === "bienvenida" || paso === "despedida"

  return (
    <motion.aside
      animate={{ backgroundColor: ATMOSFERA_POR_PASO[paso] }}
      transition={{ duration: DUR.cinematic, ease: EASE.default }}
      className="nx-grain relative isolate overflow-hidden"
    >
      <ConstelacionFondo />
      <StreamVivo />

      {PASOS.map((p) => (
        <motion.div
          key={p}
          aria-hidden="true"
          animate={{ opacity: p === paso ? 1 : 0 }}
          transition={{ duration: DUR.cinematic, ease: EASE.default }}
          className="pointer-events-none absolute inset-0"
          style={{ background: GRADIENTE_POR_PASO[p] }}
        />
      ))}

      <div className="relative z-10 flex h-full items-center px-5 py-6 sm:px-8 sm:py-8 lg:px-16 lg:py-14">
        <motion.div
          animate={{
            scale: esCierre ? 0.78 : 1,
            y: esCierre ? -16 : 0,
          }}
          transition={{ duration: DUR.cinematic, ease: EASE.default }}
          className="flex max-w-[720px] origin-left flex-col gap-4 lg:gap-8"
        >
          <WordmarkHero />
          <div className="hidden lg:block">{esCierre ? null : <FraseRotativa />}</div>
        </motion.div>
      </div>
    </motion.aside>
  )
}
