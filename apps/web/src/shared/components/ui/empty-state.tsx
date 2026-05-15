import { cn } from "@/shared/lib/cn"
import { DUR, EASE } from "@/shared/lib/motion"
import { motion, useReducedMotion } from "framer-motion"
import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

type Tono = "plain" | "panel"

interface EmptyStateProps {
  readonly icono: LucideIcon
  readonly titulo: string
  readonly descripcion: string
  readonly accion?: ReactNode
  readonly tono?: Tono
  readonly className?: string
}

export function EmptyState({
  icono: Icono,
  titulo,
  descripcion,
  accion,
  tono = "plain",
  className,
}: EmptyStateProps) {
  const reducedMotion = useReducedMotion()

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DUR.page, ease: EASE.default }}
      className={cn(
        "mx-auto flex max-w-md flex-col items-center justify-center gap-4 px-6 py-16 text-center",
        tono === "panel" && "rounded-2xl border border-border bg-surface shadow-sm",
        className,
      )}
    >
      <div className="relative">
        <div
          aria-hidden={true}
          className="-m-3 absolute inset-0 rounded-full bg-[radial-gradient(circle,rgb(var(--color-aurora-violet-rgb)/0.1),transparent_70%)]"
        />
        <div className="relative flex h-14 w-14 items-center justify-center rounded-full border border-border bg-subtle text-text-secondary">
          <Icono className="h-6 w-6" aria-hidden={true} />
        </div>
      </div>
      <div className="space-y-1.5">
        <h3 className="text-h3 text-text-primary">{titulo}</h3>
        <p className="text-body-sm text-text-secondary">{descripcion}</p>
      </div>
      {accion ? <div className="mt-2">{accion}</div> : null}
    </motion.div>
  )
}
