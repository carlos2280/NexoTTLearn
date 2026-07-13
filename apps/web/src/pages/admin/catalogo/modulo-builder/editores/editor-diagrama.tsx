import { type BloqueDetalleResponse, contenidoDiagramaSchema } from "@nexott-learn/shared-types"
import { type ChangeEvent, Suspense, lazy, useState } from "react"
import { type BorradorDiagrama, useBorradorDiagrama } from "./diagrama/use-borrador-diagrama"
import { EditorBloqueShell } from "./shared/editor-bloque-shell"
import { useAutoGuardarBloque } from "./shared/use-auto-guardar-bloque"

const ExcalidrawCanvas = lazy(() => import("@/shared/components/excalidraw-canvas"))

interface EditorDiagramaProps {
  readonly bloque: BloqueDetalleResponse
}

function leerInicial(contenido: Record<string, unknown> | null): BorradorDiagrama {
  const result = contenidoDiagramaSchema.safeParse(contenido)
  if (result.success) {
    return {
      elements: result.data.elements,
      files: result.data.files,
      appState: result.data.appState,
      altText: result.data.altText,
      caption: result.data.caption ?? "",
    }
  }
  return { elements: [], altText: "Diagrama sin descripción", caption: "" }
}

export function EditorDiagrama({ bloque }: EditorDiagramaProps) {
  const inicial = leerInicial(bloque.contenido)
  const [altText, setAltText] = useState(inicial.altText)
  const [caption, setCaption] = useState(inicial.caption)
  const borrador = useBorradorDiagrama(inicial)

  const auto = useAutoGuardarBloque({
    bloqueId: bloque.id,
    construirContenido: borrador.construirContenido,
  })

  function cambiarAltText(event: ChangeEvent<HTMLInputElement>) {
    setAltText(event.target.value)
    borrador.fijarTexto("altText", event.target.value)
    auto.marcarSucio()
  }

  function cambiarCaption(event: ChangeEvent<HTMLInputElement>) {
    setCaption(event.target.value)
    borrador.fijarTexto("caption", event.target.value)
    auto.marcarSucio()
  }

  function cuandoCambiaDiagrama(elements: readonly unknown[], appState: unknown, files: unknown) {
    if (borrador.registrarEscena(elements, appState, files)) {
      auto.marcarSucio()
    }
  }

  return (
    <EditorBloqueShell
      bloque={bloque}
      titulo="Diagrama"
      descripcion="Esquema dibujado a mano. Útil para flujos, anatomías y comparaciones donde una imagen vale más que un párrafo."
      estadoGuardado={auto.estado}
    >
      <div className="flex flex-col gap-2">
        <label htmlFor={`alt-${bloque.id}`} className="text-body-sm text-text-secondary">
          Texto alternativo <span className="text-text-tertiary">(obligatorio)</span>
        </label>
        <input
          id={`alt-${bloque.id}`}
          type="text"
          maxLength={280}
          value={altText}
          onChange={cambiarAltText}
          placeholder="Describe lo que se ve para lectores de pantalla."
          className="rounded-lg border border-border bg-surface px-3 py-2 text-body text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor={`cap-${bloque.id}`} className="text-body-sm text-text-secondary">
          Leyenda <span className="text-text-tertiary">(opcional, aparece debajo)</span>
        </label>
        <input
          id={`cap-${bloque.id}`}
          type="text"
          maxLength={280}
          value={caption}
          onChange={cambiarCaption}
          placeholder="Texto breve que acompaña al diagrama."
          className="rounded-lg border border-border bg-surface px-3 py-2 text-body text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>

      <div className="h-[520px] w-full overflow-hidden rounded-lg border border-border bg-canvas">
        <Suspense fallback={<EsqueletoCanvas />}>
          <ExcalidrawCanvas
            initialData={{
              elements: inicial.elements,
              files: inicial.files,
              appState: inicial.appState,
            }}
            onChange={cuandoCambiaDiagrama}
          />
        </Suspense>
      </div>
    </EditorBloqueShell>
  )
}

function EsqueletoCanvas() {
  return (
    <div className="flex h-full w-full items-center justify-center text-caption text-text-tertiary">
      Cargando lienzo…
    </div>
  )
}
