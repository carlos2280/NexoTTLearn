import type { UsuarioSesion } from "@/features/auth/types"
import { motion, useReducedMotion } from "framer-motion"

interface PasoDespedidaProps {
  readonly usuario: UsuarioSesion | null
}

export function PasoDespedida({ usuario }: PasoDespedidaProps) {
  const reducedMotion = useReducedMotion()
  const ease: [number, number, number, number] = [0.16, 1, 0.3, 1]
  const nombre = usuario?.nombre ?? "colaborador"

  return (
    <div className="relative flex flex-col items-start gap-6 lg:gap-8">
      <motion.p
        initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 14, filter: "blur(8px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.6, ease }}
        className="nx-eyebrow text-warmth-on-soft"
      >
        Sesión cerrada con éxito
      </motion.p>

      <motion.h2
        initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.7, ease }}
        className="text-h1 text-text-primary sm:text-display-md lg:text-display-lg"
      >
        <span className="block">Hasta pronto,</span>
        <motion.span
          initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 24, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay: 0.45, duration: 0.8, ease }}
          className="font-normal font-serif text-warmth italic"
        >
          {nombre}
          <span className="text-text-tertiary">.</span>
        </motion.span>
      </motion.h2>

      <motion.div
        initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.95, duration: 0.6, ease }}
        className="flex flex-col gap-2"
      >
        <p className="max-w-[340px] text-body-lg text-text-secondary">
          Lo de hoy quedó guardado en tu ficha. Te acercaste un paso más a la
          <span className="font-serif text-text-primary italic"> entrevista que importa</span>.
        </p>
        <p className="nx-eyebrow font-mono text-text-tertiary">Volviendo al inicio</p>
      </motion.div>

      <motion.div
        initial={{ width: "100%" }}
        animate={{ width: 0 }}
        transition={{ delay: 0.7, duration: 2.1, ease: "linear" }}
        className="mt-2 h-[2px] max-w-[200px] origin-right bg-warmth"
        aria-hidden="true"
      />
    </div>
  )
}
