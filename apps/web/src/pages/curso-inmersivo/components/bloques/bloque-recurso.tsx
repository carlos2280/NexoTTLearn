import { sanitizarHtml } from "@/shared/lib/sanitize-html"
import { contenidoRecursoSchema } from "@nexott-learn/shared-types"
import { ExternalLink, FileDown, Paperclip } from "lucide-react"

interface BloqueRecursoProps {
  readonly contenido: Record<string, unknown> | null
}

/**
 * Render del bloque RECURSO. Material de apoyo (enlace externo o adjunto)
 * presentado como card con icono + título + descripción. `abrirNuevaPestana`
 * controla `target="_blank"` para enlaces. Los adjuntos siempre se abren en
 * nueva pestaña (el navegador decide si descarga o previsualiza).
 */
export function BloqueRecurso({ contenido }: BloqueRecursoProps) {
  const parsed = contenidoRecursoSchema.safeParse(contenido)
  if (!parsed.success || parsed.data.url.trim().length === 0) {
    return null
  }
  const { subtipo, url, titulo, descripcion, abrirNuevaPestana } = parsed.data
  const target = subtipo === "adjunto" || abrirNuevaPestana ? "_blank" : undefined
  const rel = target === "_blank" ? "noopener noreferrer" : undefined
  const Icono = subtipo === "adjunto" ? FileDown : ExternalLink
  const descripcionHtml = sanitizarHtml(descripcion)
  const tieneDescripcion = descripcionHtml.replace(/<[^>]*>/g, "").trim().length > 0

  return (
    <a
      href={url}
      target={target}
      rel={rel}
      className="group hover:-translate-y-0.5 flex items-start gap-4 rounded-2xl border border-border bg-surface p-5 transition-all duration-base ease-default hover:border-border-strong"
      style={{ boxShadow: "var(--shadow-card-resting)" }}
    >
      <span
        aria-hidden={true}
        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent-on-soft"
      >
        <Paperclip className="h-5 w-5" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-body text-text-primary">
            {titulo.trim().length > 0 ? titulo : "Recurso del curso"}
          </p>
          <Icono
            className="h-3.5 w-3.5 shrink-0 text-text-tertiary transition-colors duration-fast ease-default group-hover:text-accent"
            aria-hidden={true}
          />
        </div>
        {tieneDescripcion ? (
          <div
            className="tiptap max-w-prose text-body-sm text-text-secondary"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: HTML del editor Tiptap, sanitizado por sanitizarHtml.
            dangerouslySetInnerHTML={{ __html: descripcionHtml }}
          />
        ) : null}
        <p className="font-mono text-[10px] text-text-tertiary uppercase tracking-wider">
          {subtipo === "adjunto" ? "Adjunto" : "Enlace externo"}
        </p>
      </div>
    </a>
  )
}
