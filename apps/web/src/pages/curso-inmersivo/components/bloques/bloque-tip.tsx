import { cn } from "@/shared/lib/cn"
import { sanitizarHtml } from "@/shared/lib/sanitize-html"
import { type VarianteTip, contenidoTipSchema } from "@nexott-learn/shared-types"
import { CheckCircle2, Info, type LucideIcon, TriangleAlert } from "lucide-react"

interface BloqueTipProps {
  readonly contenido: Record<string, unknown> | null
}

/**
 * Render del bloque TIP — callout editorial NexoTT.
 *
 * El TIP es **contenido pedagógico** del curso, no feedback funcional
 * del sistema. Por eso NO usa `<Banner>` (que es para feedback con
 * saturación semántica fuerte tipo "credenciales inválidas").
 *
 * El contenedor es siempre el mismo (bg-surface + borde sutil + tipografía
 * editorial, estilo Notion/Apple). Lo que cambia entre variantes es solo
 * el color del icono (en círculo soft) y el título de la cabecera. Así
 * todos los TIPs respiran identidad NexoTT, mantengan o no la variante.
 *
 * Manifiesto §3 capas: usamos los colores semánticos (info/warning/success)
 * SOLO para el chip del icono — el "papel" sigue siendo neutro editorial.
 */
interface EstiloVariante {
  readonly icono: LucideIcon
  readonly chipBg: string
  readonly chipText: string
  readonly titulo: string
}

const ESTILO_POR_VARIANTE: Record<VarianteTip, EstiloVariante> = {
  info: {
    icono: Info,
    chipBg: "bg-info-soft",
    chipText: "text-info-on-soft",
    titulo: "Nota",
  },
  warning: {
    icono: TriangleAlert,
    chipBg: "bg-warning-soft",
    chipText: "text-warning-on-soft",
    titulo: "Atención",
  },
  exito: {
    icono: CheckCircle2,
    chipBg: "bg-success-soft",
    chipText: "text-success-on-soft",
    titulo: "Buena práctica",
  },
}

export function BloqueTip({ contenido }: BloqueTipProps) {
  const parsed = contenidoTipSchema.safeParse(contenido)
  if (!parsed.success) {
    return null
  }
  const html = sanitizarHtml(parsed.data.html)
  if (html.trim().length === 0) {
    return null
  }
  const estilo = ESTILO_POR_VARIANTE[parsed.data.variante]
  const Icono = estilo.icono

  return (
    <aside className="flex items-start gap-3 rounded-2xl border border-border bg-surface px-5 py-4">
      <div
        aria-hidden={true}
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
          estilo.chipBg,
          estilo.chipText,
        )}
      >
        <Icono className="h-4 w-4" strokeWidth={1.5} />
      </div>
      <div className="flex flex-col gap-1 pt-1">
        <p className="font-medium text-body text-text-primary">{estilo.titulo}</p>
        <div
          className="tiptap max-w-prose text-body-sm text-text-secondary"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: HTML del editor Tiptap, sanitizado.
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </aside>
  )
}
