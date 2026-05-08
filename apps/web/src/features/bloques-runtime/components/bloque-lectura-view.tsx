import { cn } from "@/shared/lib/cn"
import type { BloqueRuntimeParrafo } from "@nexott-learn/shared-types"
import { BloqueHeader } from "./bloque-header"
import { BloqueShell } from "./bloque-shell"
import { proseInmersivo } from "./prose-inmersivo"

interface BloqueLecturaViewProps {
  readonly bloque: BloqueRuntimeParrafo
  readonly esActual: boolean
}

// Renderer Capa 1 · PARRAFO (lectura). El payload trae HTML pre-serializado
// de Tiptap (el admin lo guarda asi). Lo montamos con clases prose tokenizadas.
// Si en el futuro el contrato cambia a JSON Tiptap, este es el unico archivo
// a migrar a `<EditorContent editor={readOnly} />`.

export function BloqueLecturaView({ bloque, esActual }: BloqueLecturaViewProps) {
  return (
    <BloqueShell presetKey="PARRAFO" bloqueId={bloque.id} esActual={esActual}>
      <BloqueHeader
        presetKey="PARRAFO"
        titulo={bloque.titulo}
        estado={bloque.estado}
        duracionEstimadaMin={bloque.duracionEstimadaMin}
      />
      <div
        className={cn("text-text-primary", proseInmersivo)}
        // biome-ignore lint/security/noDangerouslySetInnerHtml: HTML proviene del admin y es saneado en el back (Tiptap render seguro).
        dangerouslySetInnerHTML={{ __html: bloque.payload.contenido.cuerpo }}
      />
    </BloqueShell>
  )
}
