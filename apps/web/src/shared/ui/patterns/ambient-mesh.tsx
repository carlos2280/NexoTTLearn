import { cn } from "@/shared/lib/cn"

interface AmbientMeshProps {
  readonly className?: string
}

// Capa de ambiente fija detras del contenido. Solo el scrim radial muy suave
// (--hero-scrim). Sin grid, sin orbes — version "limpia" para pruebas.
export function AmbientMesh({ className }: AmbientMeshProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-60",
        "[background-image:var(--hero-scrim)]",
        className,
      )}
    />
  )
}
