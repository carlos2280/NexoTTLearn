import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { DUR, EASE } from "@/shared/lib/motion"
import { LoginShell } from "./components/login-shell"
import { PasoAvisoPrivacidad } from "./components/paso-aviso-privacidad"
import { PasoBienvenida } from "./components/paso-bienvenida"
import { PasoCambiarPassword } from "./components/paso-cambiar-password"
import { PasoCredenciales } from "./components/paso-credenciales"
import { PasoMfa } from "./components/paso-mfa"
import { useLoginFlow } from "./hooks/use-login-flow"

export function LoginPage() {
  const flow = useLoginFlow()
  const reducedMotion = useReducedMotion()

  const variants = reducedMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      }
    : {
        initial: { opacity: 0, y: 28, filter: "blur(8px)" },
        animate: { opacity: 1, y: 0, filter: "blur(0px)" },
        exit: { opacity: 0, y: -28, filter: "blur(8px)" },
      }

  const transition = {
    duration: DUR.storytelling,
    ease: EASE.default,
  }

  return (
    <LoginShell paso={flow.paso}>
      <AnimatePresence mode="wait">
        {flow.paso === "credenciales" ? (
          <motion.div
            key="credenciales"
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transition}
          >
            <PasoCredenciales onExito={flow.onLoginExitoso} />
          </motion.div>
        ) : null}

        {flow.paso === "mfa" && flow.mfaChallenge ? (
          <motion.div
            key="mfa"
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transition}
          >
            <PasoMfa
              challenge={flow.mfaChallenge}
              onExito={flow.onMfaExitoso}
              onReiniciar={flow.reiniciar}
            />
          </motion.div>
        ) : null}

        {flow.paso === "cambiar-password" ? (
          <motion.div
            key="cambiar-password"
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transition}
          >
            <PasoCambiarPassword onExito={flow.onCambioPasswordExitoso} />
          </motion.div>
        ) : null}

        {flow.paso === "aviso-privacidad" ? (
          <motion.div
            key="aviso-privacidad"
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transition}
          >
            <PasoAvisoPrivacidad onExito={flow.onAvisoAceptado} />
          </motion.div>
        ) : null}

        {flow.paso === "bienvenida" && flow.usuario ? (
          <motion.div
            key="bienvenida"
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transition}
          >
            <PasoBienvenida usuario={flow.usuario} />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </LoginShell>
  )
}
