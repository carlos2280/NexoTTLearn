import { cn } from "@/shared/lib/cn"
import { sanitizarHtml } from "@/shared/lib/sanitize-html"
import { type VarianteTip, contenidoTipSchema } from "@nexott-learn/shared-types"
import { CheckCircle2, Info, type LucideIcon, TriangleAlert } from "lucide-react"

interface BloqueTipProps {
  readonly contenido: Record<string, unknown> | null
}

/**
 * Render del bloque TIP — anotación pedagógica en el flujo del "archivo".
 *
 * El TIP es **contenido pedagógico** del curso, no feedback funcional del
 * sistema. Por eso NO usa `<Banner>` (saturación semántica fuerte tipo
 * "credenciales inválidas").
 *
 * Metáfora IDE "un archivo": el tip se lee como un **comentario anotado** del
 * código. En vez de una card rellena que rompe el flujo, es una regla lateral
 * de color + una etiqueta mono `// titulo` + la prosa debajo. El color semántico
 * (info/warning/success) vive SOLO en el icono y la regla lateral —el "papel"
 * sigue neutro—, cumpliendo el §3 de las tres capas del manifiesto.
 */
interface EstiloVariante {
  readonly icono: LucideIcon
  readonly iconoText: string
  readonly bordeL: string
  readonly titulo: string
}

const ESTILO_POR_VARIANTE: Record<VarianteTip, EstiloVariante> = {
  info: {
    icono: Info,
    iconoText: "text-info-on-soft",
    bordeL: "border-l-info",
    titulo: "nota",
  },
  warning: {
    icono: TriangleAlert,
    iconoText: "text-warning-on-soft",
    bordeL: "border-l-warning",
    titulo: "atención",
  },
  exito: {
    icono: CheckCircle2,
    iconoText: "text-success-on-soft",
    bordeL: "border-l-success",
    titulo: "buena práctica",
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
    <aside className={cn("border-l-2 pl-4", estilo.bordeL)}>
      <div className="mb-1.5 flex items-center gap-2 font-code text-body-sm">
        <Icono
          aria-hidden={true}
          className={cn("h-3.5 w-3.5", estilo.iconoText)}
          strokeWidth={1.75}
        />
        <span className="text-[color:var(--color-syntax-comment)]">{`// ${estilo.titulo}`}</span>
      </div>
      <div
        className="tiptap max-w-prose text-text-primary"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: HTML del editor Tiptap, sanitizado.
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </aside>
  )
}
