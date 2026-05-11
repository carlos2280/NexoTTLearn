import { motion, useReducedMotion } from "framer-motion"
import type { PasoLogin } from "../login.types"
import { ConstelacionFondo } from "./constelacion-fondo"
import { FraseRotativa } from "./frase-rotativa"
import { MarcaCockpit } from "./marca-cockpit"
import { SaludoContextual } from "./saludo-contextual"
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

const GRADIENTE_BIENVENIDA =
  "radial-gradient(circle at 35% 55%, rgb(var(--color-warmth-rgb) / 0.32), transparent 55%)," +
  "radial-gradient(circle at 70% 70%, rgb(var(--color-glow-rgb) / 0.22), transparent 55%)"

const GRADIENTE_DESPEDIDA =
  "radial-gradient(circle at 50% 60%, rgb(var(--color-warmth-rgb) / 0.38), transparent 60%)," +
  "radial-gradient(circle at 75% 30%, rgb(var(--color-glow-rgb) / 0.16), transparent 55%)"

export function EscenarioMarca({ paso }: EscenarioMarcaProps) {
  const reducedMotion = useReducedMotion()
  const esBienvenida = paso === "bienvenida"
  const esDespedida = paso === "despedida"
  const esCierre = esBienvenida || esDespedida

  return (
    <motion.aside
      animate={{ backgroundColor: ATMOSFERA_POR_PASO[paso] }}
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
        style={{ background: GRADIENTE_BIENVENIDA }}
      />

      <motion.div
        aria-hidden="true"
        animate={{ opacity: esDespedida ? 1 : 0 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="pointer-events-none absolute inset-0"
        style={{ background: GRADIENTE_DESPEDIDA }}
      />

      <div className="relative z-10 flex h-full flex-col justify-between gap-6 px-5 py-6 sm:px-8 sm:py-8 lg:gap-0 lg:px-16 lg:py-14">
        <motion.div
          initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center justify-end gap-4"
        >
          <MarcaCockpit />
        </motion.div>

        <motion.div
          animate={{
            scale: esCierre ? 0.78 : 1,
            y: esCierre ? -16 : 0,
          }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="flex max-w-[720px] origin-left flex-col gap-4 lg:gap-8"
        >
          <WordmarkHero />
          <div className="hidden lg:block">{esCierre ? null : <FraseRotativa />}</div>
        </motion.div>

        <motion.div
          initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
          animate={{ opacity: esCierre ? 0.4 : 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="hidden flex-col gap-3 lg:flex"
        >
          <SaludoContextual variant="timestamp" />
          <div className="flex max-w-[440px] flex-col gap-1">
            <p className="text-body-sm text-text-secondary">
              Preparamos a colaboradores para la
              <span className="font-serif text-text-primary italic"> entrevista que importa</span>.
            </p>
            <p className="text-caption text-text-tertiary">
              Acceso restringido. Cada sesión queda registrada en la ficha del colaborador.
            </p>
          </div>
        </motion.div>
      </div>
    </motion.aside>
  )
}
