import { cn } from "@/shared/lib/cn"
import { motion } from "framer-motion"
import type { ReactNode } from "react"

interface ImmersiveShellProps {
  readonly topbar: ReactNode
  readonly banner?: ReactNode
  readonly leftColumn: ReactNode
  readonly canvas: ReactNode
  readonly rightColumn: ReactNode
}

/**
 * Layout full-screen sin sidebar admin. 3 columnas: estructura · canvas ·
 * inspector. El topbar es propio (48px) y por debajo opcionalmente un banner
 * de 32px. La transición de entrada (stagger) está modelada aquí: cada
 * columna se materializa con un delay distinto, comunicando "ahora estás en
 * otro espacio de trabajo".
 */
export function ImmersiveShell({
  topbar,
  banner,
  leftColumn,
  canvas,
  rightColumn,
}: ImmersiveShellProps) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-40 flex flex-col",
        "bg-surface-0 text-text-primary",
        "antialiased",
      )}
    >
      <motion.header
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
        className={cn(
          "relative z-20 flex h-12 shrink-0 items-center gap-3 border-glass-border border-b",
          "bg-surface-1/80 px-4 backdrop-blur",
        )}
      >
        {topbar}
      </motion.header>

      {banner ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.32, delay: 0.12 }}
          className="relative z-10 shrink-0"
        >
          {banner}
        </motion.div>
      ) : null}

      <div className="relative flex min-h-0 flex-1">
        <motion.aside
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.32, delay: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
          className={cn(
            "flex w-[280px] shrink-0 flex-col overflow-hidden border-glass-border border-r",
            "bg-surface-1/60",
          )}
        >
          {leftColumn}
        </motion.aside>

        <motion.main
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.36, delay: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
          className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-surface-0"
        >
          {canvas}
        </motion.main>

        <motion.aside
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.32, delay: 0.26, ease: [0.2, 0.8, 0.2, 1] }}
          className={cn(
            "flex w-[320px] shrink-0 flex-col overflow-hidden border-glass-border border-l",
            "bg-surface-1/60",
          )}
        >
          {rightColumn}
        </motion.aside>
      </div>
    </div>
  )
}
