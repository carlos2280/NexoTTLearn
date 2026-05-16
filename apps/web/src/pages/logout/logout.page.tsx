import { LoginShell } from "@/pages/login/components/login-shell"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { PasoCerrando } from "./components/paso-cerrando"
import { PasoDespedida } from "./components/paso-despedida"
import { PasoErrorLogout } from "./components/paso-error-logout"
import { useLogoutFlow } from "./hooks/use-logout-flow"

export function LogoutPage() {
  const flow = useLogoutFlow()
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
    duration: 0.55,
    ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
  }

  const paso = flow.error ? "credenciales" : "despedida"

  return (
    <LoginShell paso={paso}>
      <AnimatePresence mode="wait">
        {flow.error ? (
          <motion.div
            key="error"
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transition}
          >
            <PasoErrorLogout
              mensaje={flow.error.message ?? "Inténtalo nuevamente."}
              onReintentar={flow.reintentar}
            />
          </motion.div>
        ) : flow.estado === "cerrando" ? (
          <motion.div
            key="cerrando"
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transition}
          >
            <PasoCerrando />
          </motion.div>
        ) : (
          <motion.div
            key="despedida"
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={transition}
          >
            <PasoDespedida usuario={flow.usuario} />
          </motion.div>
        )}
      </AnimatePresence>
    </LoginShell>
  )
}
