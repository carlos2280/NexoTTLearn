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
  const esBienvenida = paso === "bienvenida"

  return (
    <div className="grid min-h-full grid-cols-1 lg:grid-cols-[60%_40%]">
      <EscenarioMarca paso={paso} />

      <motion.section
        initial={reducedMotion ? { opacity: 1 } : { opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="relative flex flex-col bg-[var(--color-surface)]"
      >
        <motion.div
          animate={{
            paddingTop: esBienvenida ? 80 : 40,
            paddingBottom: esBienvenida ? 80 : 40,
          }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-1 items-center justify-center px-6 sm:px-10 lg:px-12"
        >
          <div className="w-full max-w-[380px]">{children}</div>
        </motion.div>
        {esBienvenida ? null : (
          <motion.footer
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-[var(--color-border)] border-t px-6 py-6 sm:px-10 lg:px-12"
          >
            <p className="text-[11px] text-[var(--color-text-tertiary)] leading-4">
              ¿Problemas para entrar? Tu administrador puede regenerar el acceso.
            </p>
          </motion.footer>
        )}
      </motion.section>
    </div>
  )
}
