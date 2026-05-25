import { z } from "zod"

/**
 * Contenido de un bloque DIAGRAMA (Excalidraw embebido).
 *
 * Shape canonico que escribe `editor-diagrama.tsx` y consume
 * `bloque-diagrama.tsx` en modo readonly. Persistimos el estado
 * serializable de Excalidraw (`elements` + `files` + `appState`) y
 * acompañamos con metadatos cortos para accesibilidad y leyenda.
 *
 * La estructura interna de elements / files / appState la valida
 * Excalidraw al deserializar; aqui guardamos como `Record<string, unknown>`
 * para no acoplarnos a versiones internas del paquete.
 *
 * - `elements`: geometria del diagrama (formas, flechas, textos).
 * - `files`: imagenes embebidas (data URLs) referenciadas por elements.
 * - `appState`: configuracion visual (zoom, fondo, paleta seleccionada).
 *   No se renderiza en readonly pero se conserva para edicion futura.
 * - `altText`: descripcion obligatoria para screen readers (a11y).
 *   Excalidraw renderiza canvas/SVG no legible por lectores de pantalla.
 * - `caption`: leyenda opcional debajo del diagrama (serif italic en UI).
 */
export const contenidoDiagramaSchema = z
  .object({
    elements: z.array(z.record(z.unknown())),
    files: z.record(z.unknown()).optional(),
    appState: z.record(z.unknown()).optional(),
    altText: z.string().min(1).max(280),
    caption: z.string().max(280).optional(),
  })
  .strict()

export type ContenidoDiagrama = z.infer<typeof contenidoDiagramaSchema>
