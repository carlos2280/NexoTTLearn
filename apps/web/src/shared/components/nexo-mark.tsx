import { cn } from "@/shared/lib/cn"
import { useId } from "react"

type TonoNexoMark = "solido" | "acento" | "tinta" | "aurora-solid" | "aurora-glow" | "aurora-line"

interface NexoMarkProps {
  readonly tono?: TonoNexoMark
  readonly tamano?: number
  readonly className?: string
}

const PATH_N = "M9 23 L9 9 L23 23 L23 9"
const VIEWBOX = "0 0 32 32"

interface RenderProps {
  readonly tamano: number
  readonly className?: string
  readonly gradId: string
}

function AuroraGradientDef({ gradId }: { readonly gradId: string }) {
  return (
    <defs>
      <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="var(--color-aurora-cyan)" />
        <stop offset="55%" stopColor="var(--color-aurora-violet)" />
        <stop offset="100%" stopColor="var(--color-aurora-magenta)" />
      </linearGradient>
    </defs>
  )
}

function AuroraSolidMark({ tamano, className, gradId }: RenderProps) {
  const radio = Math.round(tamano * 0.22)
  return (
    <svg
      viewBox={VIEWBOX}
      width={tamano}
      height={tamano}
      role="img"
      aria-label="NexoTT Learn"
      className={cn("shrink-0", className)}
    >
      <AuroraGradientDef gradId={gradId} />
      <rect width="32" height="32" rx={radio} fill={`url(#${gradId})`} />
      <path
        d={PATH_N}
        stroke="#ffffff"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="23" cy="23" r="2.4" fill="var(--color-aurora-cyan)" />
    </svg>
  )
}

function AuroraGlowMark({ tamano, className, gradId }: RenderProps) {
  return (
    <svg
      viewBox={VIEWBOX}
      width={tamano}
      height={tamano}
      role="img"
      aria-label="NexoTT Learn"
      className={cn("shrink-0", className)}
      style={{
        filter:
          "drop-shadow(0 0 8px rgb(var(--color-aurora-cyan-rgb) / 0.55)) drop-shadow(0 0 16px rgb(var(--color-aurora-violet-rgb) / 0.35))",
      }}
    >
      <AuroraGradientDef gradId={gradId} />
      <path
        d={PATH_N}
        stroke={`url(#${gradId})`}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="23" cy="23" r="2.6" fill="var(--color-aurora-cyan)" />
    </svg>
  )
}

function AuroraLineMark({ tamano, className, gradId }: RenderProps) {
  return (
    <svg
      viewBox={VIEWBOX}
      width={tamano}
      height={tamano}
      role="img"
      aria-label="NexoTT Learn"
      className={cn("shrink-0", className)}
    >
      <AuroraGradientDef gradId={gradId} />
      <path
        d={PATH_N}
        stroke={`url(#${gradId})`}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <circle cx="23" cy="23" r="2.6" fill="var(--color-aurora-cyan)" />
    </svg>
  )
}

function SolidoMark({ tamano, className }: Omit<RenderProps, "gradId">) {
  const radio = Math.round(tamano * 0.22)
  return (
    <svg
      viewBox={VIEWBOX}
      width={tamano}
      height={tamano}
      role="img"
      aria-label="NexoTT Learn"
      className={cn("shrink-0", className)}
    >
      <rect width="32" height="32" rx={radio} fill="var(--color-accent)" />
      <path
        d={PATH_N}
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

function LineMark({
  tamano,
  className,
  traza,
  nodo,
}: Omit<RenderProps, "gradId"> & { readonly traza: string; readonly nodo: string }) {
  return (
    <svg
      viewBox={VIEWBOX}
      width={tamano}
      height={tamano}
      role="img"
      aria-label="NexoTT Learn"
      className={cn("shrink-0", className)}
    >
      <path
        d={PATH_N}
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

export function NexoMark({ tono = "solido", tamano = 32, className }: NexoMarkProps) {
  const gradId = `nm-grad-${useId()}`
  const props = { tamano, className, gradId }

  if (tono === "aurora-solid") {
    return <AuroraSolidMark {...props} />
  }
  if (tono === "aurora-glow") {
    return <AuroraGlowMark {...props} />
  }
  if (tono === "aurora-line") {
    return <AuroraLineMark {...props} />
  }
  if (tono === "solido") {
    return <SolidoMark tamano={tamano} className={className} />
  }

  // tinta = trazo + nodo en currentColor (el padre decide vía text-*).
  // acento = trazo y nodo en indigo (para usos sobre superficies claras).
  const traza = tono === "acento" ? "var(--color-accent)" : "currentColor"
  const nodo = tono === "acento" ? "var(--color-accent)" : "currentColor"
  return <LineMark tamano={tamano} className={className} traza={traza} nodo={nodo} />
}
