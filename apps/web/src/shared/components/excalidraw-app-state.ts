/**
 * Excalidraw NO debe recibir su `appState` de runtime completo como `initialData`.
 * El estado vivo trae campos transitorios que no sobreviven a un round-trip por
 * JSON: `collaborators` es un `Map` (se serializa como `{}` y al recargar Excalidraw
 * hace `collaborators.forEach(...)` → `is not a function`), y otros (`contextMenu`,
 * `newElement`, `activeTool`, `cursorButton`, `snapLines`…) cambian en cada
 * interacción y ensucian el auto-guardado.
 *
 * Persistimos y rehidratamos solo una **lista blanca** de campos visuales estables
 * y serializables; el resto lo reconstruye Excalidraw con sus defaults (incluido un
 * `Map` de `collaborators` válido). El encuadre (zoom/scroll) se omite a propósito:
 * no es contenido y Excalidraw reencuadra al abrir.
 */
const CAMPOS_APP_STATE_PERSISTIBLES = [
  // biome-ignore lint/nursery/noSecrets: nombre de campo de Excalidraw, no es un secreto (falso positivo por entropía)
  "viewBackgroundColor",
  "gridModeEnabled",
  "gridSize",
  "gridStep",
] as const

export function sanitizarAppStateExcalidraw(
  appState?: Record<string, unknown>,
): Record<string, unknown> | undefined {
  if (!appState) {
    return undefined
  }
  const resultado: Record<string, unknown> = {}
  for (const clave of CAMPOS_APP_STATE_PERSISTIBLES) {
    if (clave in appState) {
      resultado[clave] = appState[clave]
    }
  }
  return Object.keys(resultado).length > 0 ? resultado : undefined
}
