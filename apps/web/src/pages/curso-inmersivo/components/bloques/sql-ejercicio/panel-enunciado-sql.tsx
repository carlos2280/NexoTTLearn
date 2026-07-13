import { CodeEditorNexott } from "@/shared/components/ui/code-editor-nexott"
import { sanitizarHtml } from "@/shared/lib/sanitize-html"
import type { ContenidoSqlEjercicio } from "@nexott-learn/shared-types"

interface PanelEnunciadoSqlProps {
  readonly contenido: ContenidoSqlEjercicio
}

/**
 * Enunciado del reto SQL + el esquema semilla (DDL + INSERTs) en modo lectura,
 * para que el participante explore las tablas mientras escribe su consulta.
 * Espejo de `PanelEnunciado` de CODIGO_PREGUNTAS.
 */
export function PanelEnunciadoSql({ contenido }: PanelEnunciadoSqlProps) {
  const tieneEsquema = contenido.esquemaSemilla.trim().length > 0
  return (
    <div className="flex flex-col gap-3">
      <article
        className="tiptap max-w-prose text-body-sm text-text-primary"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: enunciado del editor admin, sanitizado.
        dangerouslySetInnerHTML={{ __html: sanitizarHtml(contenido.enunciado) }}
      />
      {tieneEsquema ? (
        <figure className="flex flex-col gap-1.5">
          <figcaption className="font-mono text-[10px] text-text-tertiary uppercase tracking-wider">
            Esquema disponible
          </figcaption>
          <CodeEditorNexott
            value={contenido.esquemaSemilla}
            lenguaje="sql"
            readOnly={true}
            rows={Math.min(Math.max(contenido.esquemaSemilla.split("\n").length, 3), 14)}
          />
        </figure>
      ) : null}
      <p className="font-mono text-[10px] text-text-tertiary uppercase tracking-wider">
        Tiempo límite · {contenido.tiempoLimiteSeg}s por test
      </p>
    </div>
  )
}
