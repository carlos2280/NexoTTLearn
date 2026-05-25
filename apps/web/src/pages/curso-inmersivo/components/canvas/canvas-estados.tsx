import { Skeleton } from "@/shared/components/ui/skeleton"
import type { LucideIcon } from "lucide-react"

export function CargandoBloques() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-32 w-full rounded-2xl" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  )
}

export function ErrorBloques() {
  return (
    <article className="rounded-2xl border border-danger/30 bg-danger-soft p-5 text-body-sm text-danger-on-soft">
      No pudimos cargar los bloques de esta sección. Reintenta en un momento.
    </article>
  )
}

export function SeccionVacia() {
  return (
    <article className="flex flex-col gap-2 rounded-2xl border border-border border-dashed bg-canvas p-8 text-center">
      <span className="nx-eyebrow text-text-tertiary">Sin bloques aún</span>
      <p className="text-body text-text-secondary">
        El administrador todavía no añadió contenido a esta sección.
      </p>
    </article>
  )
}

interface CentradoProps {
  readonly icono: LucideIcon
  readonly titulo: string
  readonly descripcion: string
}

export function Centrado({ icono: Icono, titulo, descripcion }: CentradoProps) {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <article className="flex max-w-md flex-col items-center gap-3 text-center">
        <span
          aria-hidden={true}
          className="grid h-12 w-12 place-items-center rounded-2xl bg-accent-soft text-accent-on-soft"
        >
          <Icono className="h-6 w-6" />
        </span>
        <h2 className="text-h2 text-text-primary">{titulo}</h2>
        <p className="text-body text-text-secondary">{descripcion}</p>
      </article>
    </main>
  )
}
