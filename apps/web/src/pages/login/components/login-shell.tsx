import { DUR, EASE } from "@/shared/lib/motion"
import { motion, useReducedMotion } from "framer-motion"
import type { ReactNode } from "react"
import type { PasoLogin } from "../login.types"
import { EscenarioMarca } from "./escenario-marca"

interface LoginShellProps {
  readonly children: ReactNode
  readonly paso: PasoLogin
}

export function LoginShell({ children, paso }: LoginShellProps) {
  const reducedMotion = useReducedMotion()
  const esCierre = paso === "bienvenida" || paso === "despedida"

  return (
    <div className="flex min-h-full flex-col lg:grid lg:grid-cols-[60%_40%]">
      <EscenarioMarca paso={paso} />

      <motion.section
        initial={reducedMotion ? { opacity: 1 } : { opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: DUR.storytelling, delay: 0.2, ease: EASE.default }}
        className="relative flex flex-1 flex-col bg-surface"
      >
        <motion.div
          animate={{
            paddingTop: esCierre ? 64 : 32,
            paddingBottom: esCierre ? 64 : 32,
          }}
          transition={{ duration: DUR.storytelling, ease: EASE.default }}
          className="flex flex-1 items-center justify-center px-5 sm:px-10 lg:px-12"
        >
          <div className="w-full max-w-[380px]">{children}</div>
        </motion.div>
      </motion.section>
    </div>
  )
}
