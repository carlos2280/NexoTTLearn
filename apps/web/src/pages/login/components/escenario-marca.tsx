import { NexoMark } from "@/shared/components/nexo-mark"
import { DUR, EASE } from "@/shared/lib/motion"
import { motion } from "framer-motion"
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
      {/* Aurora — capa de identidad siempre presente. Respira lento. */}
      <div aria-hidden="true" className="nx-aurora-drift" />

      <ConstelacionFondo />
      <StreamVivo />

      {PASOS.map((p) => (
        <motion.div
          key={p}
          aria-hidden="true"
          animate={{ opacity: p === paso ? 1 : 0 }}
          transition={{ duration: DUR.cinematic, ease: EASE.default }}
          className="pointer-events-none absolute inset-0 mix-blend-overlay"
          style={{ background: GRADIENTE_POR_PASO[p] }}
        />
      ))}

      {/* Vignette — oscurece la zona del contenido para que el texto blanco lea. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: "var(--gradient-aurora-vignette)" }}
      />

      {/* Sello del mark — esquina inferior izquierda, ancla la marca al panel.
          Variante "tinta" (línea blanca) para no sumar color sobre la aurora. */}
      <div
        aria-hidden="true"
        className="absolute bottom-6 left-6 z-10 text-white/85 lg:bottom-10 lg:left-16"
      >
        <NexoMark tono="tinta" tamano={40} />
      </div>

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
