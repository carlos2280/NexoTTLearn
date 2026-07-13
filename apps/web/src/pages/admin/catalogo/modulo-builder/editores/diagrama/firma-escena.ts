/**
 * Firma estable de la escena de Excalidraw para distinguir un cambio real (mover,
 * añadir o borrar algo) del ruido de `onChange`, que se dispara también al montar,
 * al pasar el mouse o al seleccionar. Se firma sobre los `elements` y el `appState`
 * ya saneado (lista blanca), no sobre el estado transitorio. `files` no entra: sus
 * cambios acompañan siempre a un cambio de elementos.
 */
export function firmaEscenaDiagrama(
  elements: readonly unknown[],
  appState: Record<string, unknown> | undefined,
): string {
  return JSON.stringify({ elements, appState: appState ?? null })
}

/**
 * Decide si un `onChange` representa un cambio real. El primer disparo (línea base
 * aún `null`) es el eco del montaje y NO ensucia; a partir de ahí, ensucia solo si
 * la firma cambió. El llamador actualiza la firma anterior con la nueva.
 */
export function esCambioRealEscena(firmaAnterior: string | null, firmaNueva: string): boolean {
  if (firmaAnterior === null) {
    return false
  }
  return firmaNueva !== firmaAnterior
}
