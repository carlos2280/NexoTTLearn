import { Sparkline } from "@/shared/components/ui/sparkline"
import { cn } from "@/shared/lib/cn"
import { ArrowDownRight, ArrowUpRight, type LucideIcon, Minus } from "lucide-react"
import { type VariantProps, tv } from "tailwind-variants"

const kpiCardStyles = tv({
  base: [
    "relative flex flex-col gap-4 overflow-hidden rounded-2xl",
    "border bg-surface",
    "transition-[transform,box-shadow,border-color] duration-base ease-default",
    "hover:-translate-y-0.5",
  ],
  variants: {
    variant: {
      hero: [
        "border-accent/20 p-6",
        "bg-[image:var(--gradient-card-acento)]",
        "shadow-[var(--shadow-card-elevated)]",
      ],
      compact: [
        "border-border p-5",
        "shadow-[var(--shadow-card-resting)]",
        "hover:border-border-strong hover:shadow-[var(--shadow-card-elevated)]",
      ],
    },
  },
  defaultVariants: { variant: "compact" },
})

type TonoSparkline = "acento" | "success" | "warning" | "danger"

interface KpiCardProps extends VariantProps<typeof kpiCardStyles> {
  readonly eyebrow: string
  readonly value: string | number
  readonly unit?: string
  readonly delta?: number
  readonly serie?: readonly number[]
  readonly tono?: TonoSparkline
  readonly footer?: string
  readonly icon?: LucideIcon
  readonly className?: string
}

/**
 * KpiCard — tarjeta de métrica única en todo el sistema.
 *
 * Filosofía Stripe: número grande limpio + delta + sparkline. Sin chip de
 * icono coloreado (antipatrón "dashboard 2014"). Si pasas `icon`, aparece
 * pequeño y monocromático en el footer.
 *
 * variant="hero" para el KPI estrella de la pantalla (1 por sección).
 * variant="compact" para los satélites.
 */
export function KpiCard(props: KpiCardProps) {
  const { variant, eyebrow, className } = props
  const esHero = variant === "hero"

  return (
    <article className={cn(kpiCardStyles({ variant }), className)}>
      <span className="nx-eyebrow text-text-tertiary">{eyebrow}</span>
      <ValueLine value={props.value} unit={props.unit} delta={props.delta} esHero={esHero} />
      <TrendArea serie={props.serie} tono={props.tono} esHero={esHero} />
      <FooterLine icon={props.icon} text={props.footer} />
    </article>
  )
}

interface ValueLineProps {
  readonly value: string | number
  readonly unit?: string
  readonly delta?: number
  readonly esHero: boolean
}

function ValueLine({ value, unit, delta, esHero }: ValueLineProps) {
  const valorFormateado = typeof value === "number" ? value.toLocaleString("es-ES") : value
  return (
    <div className="flex items-baseline gap-2">
      <span
        className={cn(
          "tabular font-medium text-text-primary leading-none tracking-tight",
          esHero ? "text-display-lg" : "text-display-md",
        )}
      >
        {valorFormateado}
      </span>
      {unit ? (
        <span
          className={cn("font-semibold text-text-secondary", esHero ? "text-h2" : "text-body-lg")}
        >
          {unit}
        </span>
      ) : null}
      {delta !== undefined ? <DeltaBadge delta={delta} /> : null}
    </div>
  )
}

interface TrendAreaProps {
  readonly serie?: readonly number[]
  readonly tono?: TonoSparkline
  readonly esHero: boolean
}

function TrendArea({ serie, tono, esHero }: TrendAreaProps) {
  if (!serie || serie.length < 2) {
    return null
  }
  return (
    <div className={cn("mt-auto w-full", esHero ? "h-16" : "h-10")}>
      <Sparkline
        puntos={serie}
        tono={tono ?? "acento"}
        ancho={esHero ? 320 : 160}
        alto={esHero ? 64 : 40}
        className="w-full"
      />
    </div>
  )
}

interface FooterLineProps {
  readonly icon?: LucideIcon
  readonly text?: string
}

function FooterLine({ icon: Icono, text }: FooterLineProps) {
  if (!(text || Icono)) {
    return null
  }
  return (
    <footer className="flex items-center gap-1.5 text-caption text-text-tertiary">
      {Icono ? <Icono className="h-3 w-3 shrink-0" aria-hidden={true} /> : null}
      {text ? <span className="truncate">{text}</span> : null}
    </footer>
  )
}

function DeltaBadge({ delta }: { readonly delta: number }) {
  if (delta === 0) {
    return (
      <span className="tabular inline-flex items-center gap-0.5 rounded-pill bg-subtle px-1.5 py-0.5 font-mono text-[10px] text-text-tertiary">
        <Minus className="h-2.5 w-2.5" aria-hidden={true} />
        estable
      </span>
    )
  }
  const sube = delta > 0
  const Icon = sube ? ArrowUpRight : ArrowDownRight
  return (
    <span
      className="tabular inline-flex items-center gap-0.5 rounded-pill px-1.5 py-0.5 font-mono font-semibold text-[10px]"
      style={{
        background: sube
          ? "rgb(var(--color-success-rgb) / 0.12)"
          : "rgb(var(--color-danger-rgb) / 0.12)",
        color: sube ? "var(--color-success-on-soft)" : "var(--color-danger-on-soft)",
      }}
    >
      <Icon className="h-2.5 w-2.5" aria-hidden={true} />
      {sube ? "+" : ""}
      {delta}
    </span>
  )
}
