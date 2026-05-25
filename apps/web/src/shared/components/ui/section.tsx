import { cn } from "@/shared/lib/cn"
import type { ReactNode } from "react"

interface SectionProps {
  readonly eyebrow?: ReactNode
  readonly titulo: ReactNode
  readonly descripcion?: ReactNode
  readonly accion?: ReactNode
  readonly children: ReactNode
  readonly className?: string
  readonly id?: string
}

export function Section({
  eyebrow,
  titulo,
  descripcion,
  accion,
  children,
  className,
  id,
}: SectionProps) {
  const tituloId = id ? `${id}-titulo` : undefined
  return (
    <section aria-labelledby={tituloId} className={cn("flex flex-col gap-4", className)}>
      <header className="flex items-end justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          {eyebrow ? <span className="nx-eyebrow text-text-tertiary">{eyebrow}</span> : null}
          <h2 id={tituloId} className="truncate text-h3 text-text-primary">
            {titulo}
          </h2>
          {descripcion ? <p className="text-body-sm text-text-secondary">{descripcion}</p> : null}
        </div>
        {accion ? <div className="flex shrink-0 items-center gap-2">{accion}</div> : null}
      </header>
      {children}
    </section>
  )
}
