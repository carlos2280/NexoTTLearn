import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

interface EmptyStateProps {
  readonly icono: LucideIcon
  readonly titulo: string
  readonly descripcion: string
  readonly accion?: ReactNode
}

export function EmptyState({ icono: Icono, titulo, descripcion, accion }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-border border-dashed bg-surface px-6 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent-on-soft">
        <Icono className="h-5 w-5" aria-hidden={true} />
      </div>
      <h3 className="text-body text-text-primary">{titulo}</h3>
      <p className="max-w-md text-body-sm text-text-secondary">{descripcion}</p>
      {accion ? <div className="mt-2">{accion}</div> : null}
    </div>
  )
}
