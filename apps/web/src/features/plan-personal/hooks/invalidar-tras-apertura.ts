import type { QueryClient } from "@tanstack/react-query"

/**
 * Invalida las queries derivadas tras marcar una seccion como abierta (D94).
 * Vive en su propio modulo (sin importar la api) para poder cubrir el contrato
 * de invalidacion con un test puro, sin arrastrar el cliente HTTP.
 */
export function invalidarQueriesTrasApertura(queryClient: QueryClient): void {
  queryClient.invalidateQueries({ queryKey: ["asignaciones"] })
  queryClient.invalidateQueries({ queryKey: ["me", "avance"] })
  queryClient.invalidateQueries({ queryKey: ["me", "bandeja"] })
  // Plan del participante: contiene el flag `completada` por seccion que lee
  // el sidebar del curso inmersivo. Sin esta invalidacion, abrir una seccion
  // de lectura pura no repinta el check verde hasta recargar (los bloques
  // evaluables si, porque use-crear-intento-bloque ya lo invalida).
  queryClient.invalidateQueries({ queryKey: ["plan-personal"] })
  // Una seccion de lectura pura se completa al abrirla (D94: sin bloques
  // evaluables basta la fila AperturaSeccion). Si es el ultimo item del plan,
  // cerrar el 100% desbloquea el transversal y la entrevista IA (D42,
  // ENCADENADO). Se invalidan igual que en use-crear-intento-bloque para que
  // esos cards no queden stale hasta recargar.
  queryClient.invalidateQueries({ queryKey: ["transversal"] })
  queryClient.invalidateQueries({ queryKey: ["entrevista-ia"] })
}
