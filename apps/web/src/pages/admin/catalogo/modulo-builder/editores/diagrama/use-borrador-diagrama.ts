import { sanitizarAppStateExcalidraw } from "@/shared/components/excalidraw-app-state"
import { useRef } from "react"
import { esCambioRealEscena, firmaEscenaDiagrama } from "./firma-escena"

export interface BorradorDiagrama {
  readonly elements: readonly Record<string, unknown>[]
  readonly files?: Record<string, unknown>
  readonly appState?: Record<string, unknown>
  readonly altText: string
  readonly caption: string
}

export interface UseBorradorDiagramaResult {
  readonly construirContenido: () => Record<string, unknown>
  readonly fijarTexto: (campo: "altText" | "caption", valor: string) => void
  readonly registrarEscena: (
    elements: readonly unknown[],
    appState: unknown,
    files: unknown,
  ) => boolean
}

/**
 * Estado mutable del editor de diagrama fuera del render. Encapsula:
 *  - `construirContenido`: arma el contenido a persistir (appState saneado).
 *  - `fijarTexto`: actualiza altText/caption (ediciones reales del usuario).
 *  - `registrarEscena`: procesa cada `onChange` de Excalidraw y devuelve `true`
 *    solo si la escena cambió de verdad, para no ensuciar con el ruido de onChange
 *    (montaje, hover, selección).
 *
 * La línea base de la firma se fija en el PRIMER `onChange` (no al cargar) a
 * propósito: Excalidraw normaliza los elementos al montar (puede recalcular
 * `versionNonce`/bindings), así que sembrarla desde `inicial` marcaría sucio al
 * abrir. Tomar el eco del montaje como base es robusto a esa normalización.
 */
export function useBorradorDiagrama(inicial: BorradorDiagrama): UseBorradorDiagramaResult {
  const borradorRef = useRef<BorradorDiagrama>(inicial)
  // Firma de la última escena vista; null hasta el primer onChange (eco del montaje).
  const firmaEscenaRef = useRef<string | null>(null)

  function construirContenido(): Record<string, unknown> {
    const b = borradorRef.current
    return {
      elements: b.elements,
      files: b.files,
      appState: sanitizarAppStateExcalidraw(b.appState),
      altText: b.altText,
      caption: b.caption || undefined,
    }
  }

  function fijarTexto(campo: "altText" | "caption", valor: string): void {
    borradorRef.current = { ...borradorRef.current, [campo]: valor }
  }

  function registrarEscena(
    elements: readonly unknown[],
    appState: unknown,
    files: unknown,
  ): boolean {
    const appStateSaneado = sanitizarAppStateExcalidraw(appState as Record<string, unknown>)
    borradorRef.current = {
      ...borradorRef.current,
      elements: elements as readonly Record<string, unknown>[],
      appState: appStateSaneado,
      files: files as Record<string, unknown>,
    }
    const firma = firmaEscenaDiagrama(elements, appStateSaneado)
    const sucio = esCambioRealEscena(firmaEscenaRef.current, firma)
    firmaEscenaRef.current = firma
    return sucio
  }

  return { construirContenido, fijarTexto, registrarEscena }
}
