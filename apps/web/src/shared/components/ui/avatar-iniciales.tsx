import { cn } from "@/shared/lib/cn"
import { calcularIniciales } from "@/shared/lib/iniciales"

type Tamano = "sm" | "md" | "lg"

interface AvatarInicialesProps {
  readonly nombre: string
  readonly tamano?: Tamano
  readonly className?: string
}

const TAMANO_CLASES: Record<Tamano, string> = {
  sm: "h-7 w-7 text-caption",
  md: "h-9 w-9 text-body-sm",
  lg: "h-11 w-11 text-body",
}

export function AvatarIniciales({ nombre, tamano = "md", className }: AvatarInicialesProps) {
  const iniciales = calcularIniciales(nombre)
  return (
    <span
      aria-hidden={true}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-accent-soft font-semibold text-accent-on-soft",
        TAMANO_CLASES[tamano],
        className,
      )}
    >
      {iniciales}
    </span>
  )
}
