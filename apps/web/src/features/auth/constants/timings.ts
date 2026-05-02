/**
 * Timings de las pantallas de auth.
 *
 * Centralizado aqui para poder ajustar el ritmo del flujo sin tocar
 * componentes individuales. Los valores actuales nacen del ADN NexoTT:
 *  - successScreenDuration: tiempo suficiente para registrar el feedback
 *    emocional sin sentirse lento. 1200ms cae en el rango "ceremonial breve".
 *  - hydrationLoaderDelay: evita flash del loader cuando la query resuelve
 *    casi inmediato (cache hit). Bajo este umbral, mostrar el loader es
 *    peor que mostrar nada.
 */
export const AUTH_TIMINGS = {
  successScreenDuration: 1800,
  hydrationLoaderDelay: 150,
} as const
