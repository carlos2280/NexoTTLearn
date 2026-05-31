import "@excalidraw/excalidraw/index.css"

import { Excalidraw } from "@excalidraw/excalidraw"

import { useExcalidrawTheme } from "@/pages/admin/catalogo/modulo-builder/editores/shared/use-excalidraw-theme"

interface ExcalidrawCanvasProps {
  /** Datos iniciales serializados de Excalidraw. */
  readonly initialData?: {
    readonly elements?: readonly Record<string, unknown>[]
    readonly files?: Record<string, unknown>
    readonly appState?: Record<string, unknown>
  }
  /** `true` para modo lectura (sin toolbar editable). */
  readonly viewMode?: boolean
  /** Callback de cambios; solo se invoca en modo edicion. */
  readonly onChange?: (elements: readonly unknown[], appState: unknown, files: unknown) => void
}

/**
 * Wrapper minimo de Excalidraw que aplica el tema NexoTT (light/dark) y
 * deja la API base intacta. Pensado para ser cargado via `React.lazy()`
 * desde quien lo use — el bundle pesa ~2MB.
 *
 * Los tipos de Excalidraw para elements / appState / files son complejos
 * y dependientes de version. Aqui los aceptamos como Record<string,
 * unknown> y se los pasamos tal cual: la libreria los valida internamente
 * al deserializar.
 */
export default function ExcalidrawCanvas({
  initialData,
  viewMode = false,
  onChange,
}: ExcalidrawCanvasProps) {
  const theme = useExcalidrawTheme()
  return (
    <Excalidraw
      theme={theme}
      viewModeEnabled={viewMode}
      initialData={initialData as Parameters<typeof Excalidraw>[0]["initialData"]}
      onChange={onChange as Parameters<typeof Excalidraw>[0]["onChange"]}
      UIOptions={{
        canvasActions: {
          loadScene: false,
          saveToActiveFile: false,
          export: false,
          toggleTheme: false,
        },
      }}
    />
  )
}
