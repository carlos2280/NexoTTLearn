import { cn } from "@/shared/lib/cn"

interface ProgressRingProps {
  readonly valor: number
  readonly tamano?: number
  readonly grosor?: number
  readonly tono?: "acento" | "success" | "warning" | "danger"
  readonly etiqueta?: string
  readonly className?: string
}

const TOKEN_POR_TONO = {
  acento: "var(--color-accent)",
  success: "var(--color-success)",
  warning: "var(--color-warning)",
  danger: "var(--color-danger)",
} as const

export function ProgressRing({
  valor,
  tamano = 48,
  grosor = 4,
  tono = "acento",
  etiqueta,
  className,
}: ProgressRingProps) {
  const seguro = Math.max(0, Math.min(100, valor))
  const radio = (tamano - grosor) / 2
  const circunferencia = 2 * Math.PI * radio
  const offset = circunferencia - (seguro / 100) * circunferencia

  return (
    <div
      role="img"
      aria-label={etiqueta ?? `Progreso ${seguro}%`}
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: tamano, height: tamano }}
    >
      <svg
        width={tamano}
        height={tamano}
        viewBox={`0 0 ${tamano} ${tamano}`}
        className="-rotate-90"
        aria-hidden={true}
      >
        <circle
          cx={tamano / 2}
          cy={tamano / 2}
          r={radio}
          stroke="var(--color-muted)"
          strokeWidth={grosor}
          fill="none"
        />
        <circle
          cx={tamano / 2}
          cy={tamano / 2}
          r={radio}
          stroke={TOKEN_POR_TONO[tono]}
          strokeWidth={grosor}
          strokeLinecap="round"
          strokeDasharray={circunferencia}
          strokeDashoffset={offset}
          fill="none"
          style={{
            transition: "stroke-dashoffset var(--duration-cinematic) var(--ease-default)",
          }}
        />
      </svg>
      <span className="tabular absolute font-medium text-text-primary text-xs">{seguro}%</span>
    </div>
  )
}
