import { cn } from "@/shared/lib/cn"

type NodeType = "curso" | "area" | "modulo" | "seccion"

const CONFIG: Record<NodeType, { label: string; bg: string; ariaLabel: string }> = {
  curso: { label: "C", bg: "bg-brand-violet", ariaLabel: "Curso" },
  area: { label: "A", bg: "bg-info", ariaLabel: "Área" },
  modulo: { label: "M", bg: "bg-success", ariaLabel: "Módulo" },
  seccion: { label: "S", bg: "bg-warning", ariaLabel: "Sección" },
}

interface NodeTypeBadgeProps {
  readonly type: NodeType
  readonly className?: string
}

export function NodeTypeBadge({ type, className }: NodeTypeBadgeProps) {
  const { label, bg, ariaLabel } = CONFIG[type]
  return (
    <span
      aria-label={ariaLabel}
      className={cn(
        "inline-flex size-[18px] shrink-0 items-center justify-center rounded-full",
        "font-medium text-[10px] text-white leading-none",
        bg,
        className,
      )}
    >
      {label}
    </span>
  )
}
