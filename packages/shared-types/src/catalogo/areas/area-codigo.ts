import { z } from "zod"

/**
 * Whitelist de codigos de area. Cada codigo mapea a un token CSS
 * `--color-area-<codigo>` en `apps/web/src/styles/globals.css` y a su
 * `--shadow-glow-area-<codigo>`. Si se necesita un area nueva (p.ej. "security"),
 * el flujo es: 1) anadir el set de tokens en globals.css; 2) anadir el valor
 * aqui; 3) regenerar shared-types. La integridad visual del producto depende
 * de mantener este conjunto cerrado.
 */
export const AREA_CODIGOS = [
  "frontend",
  "backend",
  "cloud",
  "data",
  "mobile",
  "devops",
  "qa",
  "soft",
] as const

export const areaCodigoSchema = z.enum(AREA_CODIGOS)
export type AreaCodigo = z.infer<typeof areaCodigoSchema>
