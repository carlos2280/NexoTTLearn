import { CodigoEditor } from "./codigo-editor"
import { ParrafoEditor } from "./parrafo-editor"
import { RecursoEditor } from "./recurso-editor"
import { TipEditor } from "./tip-editor"
import type { BloqueEditorProps } from "./types"
import { tipoLabel } from "./types"
import { VideoEditor } from "./video-editor"

export function BloqueEditor(props: BloqueEditorProps) {
  switch (props.bloque.tipo) {
    case "PARRAFO":
      return <ParrafoEditor {...props} />
    case "TIP":
      return <TipEditor {...props} />
    case "VIDEO":
      return <VideoEditor {...props} />
    case "RECURSO":
      return <RecursoEditor {...props} />
    case "CODIGO":
      return <CodigoEditor {...props} />
    default:
      return (
        <p className="text-text-muted text-xs">
          Editor para {tipoLabel(props.bloque.tipo)} pendiente. Usa el canvas para ver el contenido.
        </p>
      )
  }
}
