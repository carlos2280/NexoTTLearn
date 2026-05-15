import { DUR, EASE } from "@/shared/lib/motion"
import { motion, useReducedMotion } from "framer-motion"
import { ShieldCheck } from "lucide-react"
import type { ReactNode } from "react"
import type { PasoLogin } from "../login.types"
import { EscenarioMarca } from "./escenario-marca"

interface LoginShellProps {
  readonly children: ReactNode
  readonly paso: PasoLogin
}

const EYEBROW_POR_PASO: Record<PasoLogin, string> = {
  credenciales: "Inicio · paso 1 de 1",
  mfa: "Seguridad · paso 2 de 2",
  "cambiar-password": "Primer acceso · obligatorio",
  "aviso-privacidad": "Política · primer acceso",
  bienvenida: "Sesión iniciada",
  despedida: "Cerrando sesión",
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
        {/* Fondo del panel — gradient muy sutil para que no sea papel plano */}
        <div
          aria-hidden={true}
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 90% 0%, rgb(var(--color-accent-rgb) / 0.04), transparent 60%), radial-gradient(ellipse 70% 60% at 10% 100%, rgb(var(--color-aurora-violet-rgb) / 0.03), transparent 60%)",
          }}
        />

        {/* Header del panel — eyebrow contextual + sello discreto */}
        <motion.header
          animate={{ opacity: esCierre ? 0 : 1 }}
          transition={{ duration: DUR.cinematic, ease: EASE.default }}
          className="relative z-10 flex items-center justify-between px-6 pt-6 sm:px-10 sm:pt-8 lg:px-12 lg:pt-10"
        >
          <span className="nx-eyebrow text-text-tertiary">{EYEBROW_POR_PASO[paso]}</span>
          <span className="inline-flex items-center gap-1.5 font-mono text-[10px] text-text-tertiary">
            <ShieldCheck className="h-3 w-3" style={{ color: "var(--color-state-solido)" }} />
            cifrado
          </span>
        </motion.header>

        <motion.div
          animate={{
            paddingTop: esCierre ? 64 : 32,
            paddingBottom: esCierre ? 64 : 32,
          }}
          transition={{ duration: DUR.storytelling, ease: EASE.default }}
          className="relative z-10 flex flex-1 items-center justify-center px-5 sm:px-10 lg:px-12"
        >
          <div className="w-full max-w-[440px]">{children}</div>
        </motion.div>

        {/* Footer del panel — firma de marca discreta */}
        <motion.footer
          animate={{ opacity: esCierre ? 0 : 1 }}
          transition={{ duration: DUR.cinematic, ease: EASE.default }}
          className="relative z-10 flex items-center justify-between px-6 pb-6 sm:px-10 sm:pb-8 lg:px-12 lg:pb-10"
        >
          <span className="font-mono text-[10px] text-text-tertiary">NexoTT Learn</span>
          <span className="font-mono text-[10px] text-text-tertiary">
            Plataforma interna · v2026.1
          </span>
        </motion.footer>
      </motion.section>
    </div>
  )
}
