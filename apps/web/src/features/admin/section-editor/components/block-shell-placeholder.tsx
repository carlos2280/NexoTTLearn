import { NxtIcon, NxtText } from "@carlos2280/nexott-ui/react"
import { Stack } from "@carlos2280/nexott-ui/react-primitives"
import type { TipoContenido } from "@nexott-learn/shared-types"

interface BlockShellPlaceholderProps {
  readonly tipo: TipoContenido
}

// Mapeo tipo -> label legible (en espanol). Funcion en vez de Record para
// evitar el lint useNamingConvention sobre keys UPPER_CASE.
function labelDeTipo(tipo: TipoContenido): string {
  switch (tipo) {
    case "LECTURA":
      return "Lectura"
    case "VIDEO":
      return "Video"
    case "RECURSO":
      return "Recurso"
    case "EJEMPLO_CODIGO":
      return "Ejemplo de codigo"
    case "EJERCICIO":
      return "Ejercicio"
    case "TEST":
      return "Test"
    default:
      return "Bloque"
  }
}

// Cuerpo placeholder dentro de <NxlBlockShell>. F4.2 reemplaza este
// componente por el editor real de cada tipo (RichText, video form, etc.).
// Mantenemos un look consistente: icon + texto "Editor [TIPO] pendiente".
export function BlockShellPlaceholder({ tipo }: BlockShellPlaceholderProps) {
  const label = labelDeTipo(tipo)
  return (
    <Stack direction="row" align="center" gap="sm">
      <NxtIcon name="edit" size="sm" />
      <NxtText size="sm" tone="dim">
        Editor de {label.toLowerCase()} pendiente. Llega en el siguiente sprint.
      </NxtText>
    </Stack>
  )
}
