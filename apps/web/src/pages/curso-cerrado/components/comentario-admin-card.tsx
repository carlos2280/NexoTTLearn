import { motion, useReducedMotion } from "framer-motion"

interface ComentarioAdminCardProps {
  readonly comentario: string
}

export function ComentarioAdminCard({ comentario }: ComentarioAdminCardProps) {
  const reducedMotion = useReducedMotion()
  const ease: [number, number, number, number] = [0.16, 1, 0.3, 1]

  return (
    <motion.aside
      initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1.2, duration: 0.7, ease }}
      className="flex w-full max-w-xl flex-col gap-3 rounded-2xl border border-border bg-subtle p-6 text-left"
      aria-labelledby="comentario-admin-titulo"
    >
      <span id="comentario-admin-titulo" className="nx-eyebrow font-mono text-text-tertiary">
        Mensaje del admin
      </span>
      <p className="text-body text-text-primary leading-relaxed">{comentario}</p>
      <p className="text-caption text-text-tertiary">— Admin</p>
    </motion.aside>
  )
}
