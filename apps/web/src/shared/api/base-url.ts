/** Raíz de la API. Única fuente de verdad para el httpClient y las llamadas
 * que no pasan por él (p. ej. subidas multipart con FormData). */
export const API_BASE_URL = (import.meta.env.VITE_API_URL ?? "/api/v1") as string
