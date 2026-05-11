import { useSaludoTemporal } from "@/features/admin/layout/hooks/use-saludo-temporal"
import { useUsuarioActual } from "@/features/auth/hooks/use-usuario-actual"
import { Kbd } from "@/shared/components/ui/kbd"
import { useRelojVivo } from "@/shared/hooks/use-reloj-vivo"
import { motion, useReducedMotion } from "framer-motion"

interface HeroBienvenidaProps {
  readonly onAbrirPaleta: () => void
}

export function HeroBienvenida({ onAbrirPaleta }: HeroBienvenidaProps) {
  const { data: usuario } = useUsuarioActual()
  const { saludo } = useSaludoTemporal()
  const { hora, fechaLarga } = useRelojVivo()
  const reduceMotion = useReducedMotion()

  const variantes = reduceMotion
    ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
    : { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } }

  return (
    <header className="flex flex-col gap-6">
      <motion.div
        initial={variantes.initial}
        animate={variantes.animate}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="nx-eyebrow flex items-center gap-2 text-text-tertiary"
      >
        <span
          aria-hidden={true}
          className="nx-pulse-dot inline-block h-1.5 w-1.5 rounded-pill bg-success"
        />
        <span>{fechaLarga}</span>
        <span className="text-border-strong">·</span>
        <span className="tabular">{hora}</span>
      </motion.div>

      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <motion.h1
          initial={variantes.initial}
          animate={variantes.animate}
          transition={{ duration: 0.6, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
          className="text-h1 text-text-primary"
        >
          <span className="text-text-secondary">{saludo},</span>
          {usuario ? <> {usuario.nombre}</> : null}
          <span aria-hidden={true} className="text-accent">
            {" "}
            ·
          </span>
        </motion.h1>

        <motion.button
          type="button"
          onClick={onAbrirPaleta}
          initial={variantes.initial}
          animate={variantes.animate}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="group inline-flex h-10 w-full max-w-sm items-center justify-between gap-3 rounded-md border border-border bg-surface px-3 text-body-sm text-text-tertiary shadow-sm transition-all duration-fast ease-default hover:border-border-strong hover:text-text-secondary md:w-auto"
          aria-label="Abrir panel rápido — Atajo Cmd K"
        >
          <span className="truncate">Buscar, navegar, ejecutar…</span>
          <span className="flex shrink-0 items-center gap-1">
            <Kbd>⌘</Kbd>
            <Kbd>K</Kbd>
          </span>
        </motion.button>
      </div>

      <motion.p
        initial={variantes.initial}
        animate={variantes.animate}
        transition={{ duration: 0.6, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-2xl text-body text-text-secondary"
      >
        Hoy hay <strong className="text-text-primary">3 casos</strong> esperando tu decisión y{" "}
        <strong className="text-text-primary">14 cursos</strong> corriendo. Empieza por lo que está
        a punto de vencer.
      </motion.p>
    </header>
  )
}
