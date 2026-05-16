import { cn } from "@/shared/lib/cn"
import { sanitizarHtml } from "@/shared/lib/sanitize-html"
import { type VarianteTip, contenidoTipSchema } from "@nexott-learn/shared-types"
import { CheckCircle2, Info, TriangleAlert } from "lucide-react"

interface BloqueTipProps {
  readonly contenido: Record<string, unknown> | null
}

const ESTILOS: Record<
  VarianteTip,
  {
    readonly borde: string
    readonly bg: string
    readonly icono: typeof Info
    readonly iconoColor: string
    readonly eyebrow: string
    readonly eyebrowColor: string
  }
> = {
  info: {
    borde: "border-info/30",
    bg: "bg-info-soft",
    icono: Info,
    iconoColor: "text-info",
    eyebrow: "Info",
    eyebrowColor: "text-info-on-soft",
  },
  warning: {
    borde: "border-warning/30",
    bg: "bg-warning-soft",
    icono: TriangleAlert,
    iconoColor: "text-warning",
    eyebrow: "Atención",
    eyebrowColor: "text-warning-on-soft",
  },
  exito: {
    borde: "border-success/30",
    bg: "bg-success-soft",
    icono: CheckCircle2,
    iconoColor: "text-success",
    eyebrow: "Buena práctica",
    eyebrowColor: "text-success-on-soft",
  },
}

/**
 * Render del bloque TIP. Callout con borde semántico izquierdo (4px) + bg
 * soft + icono. Las 3 variantes (info, warning, éxito) son colores de la
 * capa "feedback" (manifiesto §3 capas).
 */
export function BloqueTip({ contenido }: BloqueTipProps) {
  const parsed = contenidoTipSchema.safeParse(contenido)
  if (!parsed.success) {
    return null
  }
  const html = sanitizarHtml(parsed.data.html)
  if (html.trim().length === 0) {
    return null
  }
  const estilo = ESTILOS[parsed.data.variante]
  const Icono = estilo.icono

  return (
    <aside
      className={cn(
        "relative flex flex-col gap-2 overflow-hidden rounded-2xl border p-5 pl-6",
        estilo.borde,
        estilo.bg,
      )}
    >
      <span
        aria-hidden={true}
        className={cn("absolute inset-y-0 left-0 w-1", estilo.iconoColor.replace("text-", "bg-"))}
      />
      <div className="flex items-center gap-2">
        <Icono className={cn("h-4 w-4", estilo.iconoColor)} aria-hidden={true} />
        <span className={cn("nx-eyebrow", estilo.eyebrowColor)}>{estilo.eyebrow}</span>
      </div>
      <div
        className="tiptap max-w-prose text-body-sm text-text-primary"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: HTML del editor Tiptap, sanitizado.
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </aside>
  )
}
