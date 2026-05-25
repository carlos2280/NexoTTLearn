import { contenidoDiagramaSchema } from "@nexott-learn/shared-types"
import { Suspense, lazy } from "react"

const ExcalidrawCanvas = lazy(() => import("@/shared/components/excalidraw-canvas"))

interface BloqueDiagramaProps {
  readonly contenido: Record<string, unknown> | null
}

/**
 * Render del bloque DIAGRAMA en el inmersivo — Excalidraw en modo readonly.
 *
 * El estilo "dibujado a mano" es deliberado: forma parte del lenguaje
 * pedagógico del curso ("Una imagen dice más que mil párrafos"). El
 * contenedor sí lleva identidad NexoTT (rounded, bg-canvas, leyenda en
 * serif italic), pero el trazo del propio diagrama no se manipula.
 *
 * Excalidraw pesa ~2 MB minified — carga con `React.lazy` para no
 * inflar el chunk inicial del inmersivo.
 */
export function BloqueDiagrama({ contenido }: BloqueDiagramaProps) {
  const parsed = contenidoDiagramaSchema.safeParse(contenido)
  if (!parsed.success) {
    return null
  }
  const { elements, files, appState, altText, caption } = parsed.data
  if (elements.length === 0) {
    return null
  }

  return (
    <figure className="flex flex-col gap-3 rounded-xl border border-border bg-canvas p-4">
      <div aria-label={altText} role="img" className="h-[420px] w-full overflow-hidden rounded-lg">
        <Suspense fallback={<EsqueletoCanvas />}>
          <ExcalidrawCanvas viewMode={true} initialData={{ elements, files, appState }} />
        </Suspense>
      </div>
      {caption ? (
        <figcaption className="font-serif text-body-sm text-text-secondary italic">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  )
}

function EsqueletoCanvas() {
  return (
    <div className="flex h-full w-full items-center justify-center text-caption text-text-tertiary">
      Cargando diagrama…
    </div>
  )
}
