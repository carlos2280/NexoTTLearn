import { cn } from "@/shared/lib/cn"

interface AvatarInicialesProps {
  readonly nombre: string
  readonly apellido: string
  readonly className?: string
}

export function AvatarIniciales({ nombre, apellido, className }: AvatarInicialesProps) {
  const iniciales = `${nombre[0] ?? ""}${apellido[0] ?? ""}`.toUpperCase()
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-full",
        "bg-[linear-gradient(135deg,var(--brand-violet)_0%,var(--brand-cyan)_100%)]",
        "font-semibold text-white text-xs",
        className,
      )}
    >
      {iniciales}
    </span>
  )
}
