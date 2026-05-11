import { cn } from "@/shared/lib/cn"

interface SparklineProps {
  readonly puntos: readonly number[]
  readonly ancho?: number
  readonly alto?: number
  readonly tono?: "acento" | "success" | "warning" | "danger"
  readonly className?: string
}

const TOKEN_POR_TONO = {
  acento: "var(--color-accent)",
  success: "var(--color-success)",
  warning: "var(--color-warning)",
  danger: "var(--color-danger)",
} as const

const TOKEN_SOFT_POR_TONO = {
  acento: "var(--color-accent-soft)",
  success: "var(--color-success-soft)",
  warning: "var(--color-warning-soft)",
  danger: "var(--color-danger-soft)",
} as const

export function Sparkline({
  puntos,
  ancho = 96,
  alto = 28,
  tono = "acento",
  className,
}: SparklineProps) {
  if (puntos.length < 2) {
    return null
  }

  const min = Math.min(...puntos)
  const max = Math.max(...puntos)
  const rango = max - min || 1
  const pasoX = ancho / (puntos.length - 1)

  const coordenadas = puntos.map((valor, i) => {
    const x = i * pasoX
    const y = alto - ((valor - min) / rango) * (alto - 2) - 1
    return [x, y] as const
  })

  const linea = coordenadas
    .map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(" ")

  const area = `${linea} L ${ancho.toFixed(2)} ${alto.toFixed(2)} L 0 ${alto.toFixed(2)} Z`
  const idGradiente = `spark-grad-${tono}`

  return (
    <svg
      width={ancho}
      height={alto}
      viewBox={`0 0 ${ancho} ${alto}`}
      role="presentation"
      aria-hidden={true}
      className={cn("overflow-visible", className)}
    >
      <defs>
        <linearGradient id={idGradiente} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={TOKEN_SOFT_POR_TONO[tono]} stopOpacity="0.9" />
          <stop offset="100%" stopColor={TOKEN_SOFT_POR_TONO[tono]} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${idGradiente})`} />
      <path
        d={linea}
        fill="none"
        stroke={TOKEN_POR_TONO[tono]}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
