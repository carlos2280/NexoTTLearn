import type { ActualizarBloqueAdminInput, BloqueDetalleAdmin } from "@nexott-learn/shared-types"

export interface BloqueEditorProps {
  readonly bloque: BloqueDetalleAdmin
  readonly onSave: (input: ActualizarBloqueAdminInput) => void
  readonly saving: boolean
}

export function tipoLabel(tipo: BloqueDetalleAdmin["tipo"]): string {
  switch (tipo) {
    case "PARRAFO":
      return "Párrafo"
    case "TIP":
      return "Tip"
    case "VIDEO":
      return "Video"
    case "RECURSO":
      return "Recurso"
    case "CODIGO":
      return "Código"
    default:
      return "Quiz"
  }
}
