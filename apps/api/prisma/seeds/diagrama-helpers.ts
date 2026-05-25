// Helpers minimos para construir elementos Excalidraw en bloques DIAGRAMA del
// seed. Cada helper devuelve un `Record<string, unknown>` con los campos
// indispensables que Excalidraw espera al deserializar — los faltantes los
// rellena la libreria con defaults razonables.
//
// Paleta: usamos negro/grises de Excalidraw porque son los que mejor leen en
// el estilo "dibujado a mano" del producto. La identidad NexoTT vive en el
// contenedor del bloque, no en el trazo (decision deliberada — ver
// MANIFIESTO §3 capas).

type Elemento = Record<string, unknown>

const TRAZO = "#1e1e1e"

interface BaseProps {
  readonly id: string
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
  readonly seed?: number
}

function base(p: BaseProps, tipo: string): Elemento {
  return {
    id: p.id,
    type: tipo,
    x: p.x,
    y: p.y,
    width: p.width,
    height: p.height,
    angle: 0,
    strokeColor: TRAZO,
    backgroundColor: "transparent",
    fillStyle: "solid",
    strokeWidth: 2,
    strokeStyle: "solid",
    roughness: 1,
    opacity: 100,
    seed: p.seed ?? hashSeed(p.id),
    groupIds: [],
    frameId: null,
    roundness: tipo === "rectangle" ? { type: 3 } : null,
    boundElements: null,
    updated: 1,
    link: null,
    locked: false,
    isDeleted: false,
    version: 1,
    versionNonce: hashSeed(`${p.id}-nonce`),
    index: `a${seq()}`,
  }
}

/**
 * Caja rectangular con texto centrado. Devuelve dos elementos: la caja y el
 * texto vinculado a ella (Excalidraw los muestra como uno solo al editar).
 */
export function caja(args: {
  readonly id: string
  readonly x: number
  readonly y: number
  readonly w: number
  readonly h: number
  readonly texto: string
  readonly fontSize?: number
}): readonly Elemento[] {
  const idTexto = `${args.id}-text`
  const rect: Elemento = {
    ...base({ id: args.id, x: args.x, y: args.y, width: args.w, height: args.h }, "rectangle"),
    boundElements: [{ id: idTexto, type: "text" }],
  }
  const texto: Elemento = {
    ...base({ id: idTexto, x: args.x, y: args.y, width: args.w, height: args.h }, "text"),
    text: args.texto,
    originalText: args.texto,
    fontSize: args.fontSize ?? 18,
    fontFamily: 1,
    textAlign: "center",
    verticalAlign: "middle",
    baseline: 18,
    containerId: args.id,
    lineHeight: 1.25,
    strokeWidth: 1,
  }
  return [rect, texto]
}

/**
 * Flecha entre dos puntos. (x1,y1) → (x2,y2) son absolutos en el canvas.
 */
export function flecha(args: {
  readonly id: string
  readonly x1: number
  readonly y1: number
  readonly x2: number
  readonly y2: number
}): Elemento {
  const ancho = args.x2 - args.x1
  const alto = args.y2 - args.y1
  return {
    ...base(
      { id: args.id, x: args.x1, y: args.y1, width: Math.abs(ancho), height: Math.abs(alto) },
      "arrow",
    ),
    points: [
      [0, 0],
      [ancho, alto],
    ],
    lastCommittedPoint: null,
    startBinding: null,
    endBinding: null,
    startArrowhead: null,
    endArrowhead: "arrow",
    elbowed: false,
  }
}

/**
 * Texto suelto (label de una flecha, titulo del diagrama, etc).
 */
export function etiqueta(args: {
  readonly id: string
  readonly x: number
  readonly y: number
  readonly w: number
  readonly h: number
  readonly texto: string
  readonly fontSize?: number
}): Elemento {
  return {
    ...base({ id: args.id, x: args.x, y: args.y, width: args.w, height: args.h }, "text"),
    text: args.texto,
    originalText: args.texto,
    fontSize: args.fontSize ?? 16,
    fontFamily: 1,
    textAlign: "center",
    verticalAlign: "top",
    baseline: 14,
    containerId: null,
    lineHeight: 1.25,
    strokeWidth: 1,
  }
}

// ============================================================================
// Internals
// ============================================================================

let cursor = 0
function seq(): string {
  cursor += 1
  return cursor.toString(36).padStart(2, "0")
}

function hashSeed(s: string): number {
  let h = 5381
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 33) ^ s.charCodeAt(i)
  }
  return Math.abs(h) % 2_000_000
}
