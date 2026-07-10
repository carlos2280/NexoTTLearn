import { TiptapEditor } from "@/pages/admin/catalogo/modulo-builder/editores/shared/tiptap-editor"
import { extensionesCompletas } from "@/pages/admin/catalogo/modulo-builder/editores/shared/tiptap-extensiones"

const LIMITE_BRIEF = 20000

interface EditorBriefTransversalProps {
  readonly html: string
  readonly onCambio: (html: string) => void
}

/**
 * Editor rico del brief que verá el participante. Reutiliza el mismo Tiptap
 * del catálogo, así el HTML producido encaja con el sanitizer y los estilos
 * `.tiptap` de la vista del alumno (`vista-brief-transversal.tsx`).
 */
export function EditorBriefTransversal({ html, onCambio }: EditorBriefTransversalProps) {
  const excedido = html.length > LIMITE_BRIEF
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <span className="nx-eyebrow text-text-tertiary">Instrucciones del proyecto</span>
        {excedido ? (
          <span className="text-caption text-danger">
            El brief supera el límite ({html.length.toLocaleString()} /{" "}
            {LIMITE_BRIEF.toLocaleString()}).
          </span>
        ) : null}
      </div>
      <TiptapEditor
        htmlInicial={html}
        extensiones={extensionesCompletas(
          "Describe qué debe construir el participante, el stack obligatorio y cómo se evalúa…",
        )}
        variante="completa"
        altoMin="280px"
        onCambio={(nuevoHtml) => onCambio(nuevoHtml)}
      />
      <p className="text-caption text-text-tertiary">
        El participante verá este texto como el enunciado del proyecto transversal, con el mismo
        formato (títulos, listas, negritas, código).
      </p>
    </div>
  )
}
