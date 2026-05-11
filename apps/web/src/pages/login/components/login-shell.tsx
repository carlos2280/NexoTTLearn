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
        transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="relative flex flex-1 flex-col bg-surface"
      >
        <motion.div
          animate={{
            paddingTop: esCierre ? 64 : 32,
            paddingBottom: esCierre ? 64 : 32,
          }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-1 items-center justify-center px-5 sm:px-10 lg:px-12"
        >
          <div className="w-full max-w-[380px]">{children}</div>
        </motion.div>
        {esCierre ? null : (
          <motion.footer
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col gap-2 border-border border-t px-5 py-5 sm:px-10 sm:py-6 lg:px-12"
          >
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
              <span className="nx-eyebrow font-mono text-text-tertiary">NXT · LEARN</span>
              <span className="nx-eyebrow tabular font-mono text-text-tertiary">
                SESIÓN ENCRIPTADA
              </span>
            </div>
            <p className="text-caption text-text-tertiary">
              ¿Sin acceso? Tu administrador regenera la contraseña. La identidad y los registros
              nunca salen del sistema interno.
            </p>
          </motion.footer>
        )}
      </motion.section>
    </div>
  )
}
