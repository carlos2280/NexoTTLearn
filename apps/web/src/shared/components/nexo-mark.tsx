import { cn } from "@/shared/lib/cn"

interface NexoMarkProps {
  readonly tono?: "acento" | "solido" | "tinta"
  readonly tamano?: number
  readonly className?: string
}

export function NexoMark({ tono = "solido", tamano = 32, className }: NexoMarkProps) {
  const radio = Math.round(tamano * 0.22)

  if (tono === "solido") {
    return (
      <svg
        viewBox="0 0 32 32"
        width={tamano}
        height={tamano}
        role="img"
        aria-label="NexoTT Learn"
        className={cn("shrink-0", className)}
      >
        <rect width="32" height="32" rx={radio} fill="var(--color-accent)" />
        <path
          d="M9 23 L9 9 L23 23 L23 9"
          stroke="var(--color-canvas)"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <circle cx="23" cy="23" r="2.4" fill="var(--color-canvas)" />
      </svg>
    )
  }

  const traza = tono === "acento" ? "var(--color-accent)" : "var(--color-text-primary)"
  const nodo = tono === "acento" ? "var(--color-accent)" : "var(--color-accent)"

  return (
    <svg
      viewBox="0 0 32 32"
      width={tamano}
      height={tamano}
      role="img"
      aria-label="NexoTT Learn"
      className={cn("shrink-0", className)}
    >
      <path
        d="M9 23 L9 9 L23 23 L23 9"
        stroke={traza}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="23" cy="23" r="2.6" fill={nodo} />
    </svg>
  )
}
