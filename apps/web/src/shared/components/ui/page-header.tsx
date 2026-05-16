import { cn } from "@/shared/lib/cn"
import type { ReactNode } from "react"

/**
 * PageHeader — cabecera canónica de página interna (dashboard, ficha, listado).
 *
 * Identidad NexoTT:
 * - Eyebrow uppercase + tracking 0.22em (clase `.nx-eyebrow`).
 * - Título h1 con **punto aurora-violet** como firma del producto.
 * - Subtítulo `text-body text-text-secondary`, ancho contenido (`max-w-2xl`).
 * - Slot `stat` para una línea editorial de contexto (típicamente
 *   `PageHeaderStat` con número mono tabular + etiqueta).
 *
 * Variante `momento`:
 * - `"trabajo"` (default): eyebrow gris (`text-text-tertiary`). Atmósfera
 *   editorial del dashboard.
 * - `"marca"`: eyebrow aurora-violet. Pantallas de marca (login, bienvenida).
 */
interface PageHeaderProps {
  readonly eyebrow: string
  readonly titulo: string
  readonly descripcion?: string
  readonly momento?: "trabajo" | "marca"
  readonly stat?: ReactNode
  readonly className?: string
}

export function PageHeader({
  eyebrow,
  titulo,
  descripcion,
  momento = "trabajo",
  stat,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn("flex flex-col gap-2", className)}>
      <span
        className={cn(
          "nx-eyebrow",
          momento === "marca" ? "text-aurora-violet" : "text-text-tertiary",
        )}
      >
        {eyebrow}
      </span>
      <h1 className="text-h1 text-text-primary">
        {titulo}
        <span className="text-aurora-violet">.</span>
      </h1>
      {descripcion ? (
        <p className="max-w-2xl text-body text-text-secondary">{descripcion}</p>
      ) : null}
      {stat ? <div className="mt-1">{stat}</div> : null}
    </header>
  )
}

/**
 * PageHeaderStat — microestadística editorial mono tabular para el slot
 * `stat` de `PageHeader`. Número en `text-text-primary`, etiqueta en
 * `text-text-tertiary`. Stripe-style: número grande implícito, sin chip
 * de icono ni gradientes.
 */
interface PageHeaderStatProps {
  readonly valor: string | number
  readonly etiqueta: string
}

export function PageHeaderStat({ valor, etiqueta }: PageHeaderStatProps) {
  const valorFormateado = typeof valor === "number" ? valor.toLocaleString("es-ES") : valor
  return (
    <p className="tabular font-mono text-caption text-text-tertiary">
      <span className="text-text-primary">{valorFormateado}</span> {etiqueta}
    </p>
  )
}
