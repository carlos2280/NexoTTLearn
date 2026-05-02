import type { Request } from "express"

interface DatosCliente {
  readonly ip: string | null
  readonly userAgent: string | null
}

/**
 * Extrae IP real y user-agent del request, considerando proxies (X-Forwarded-For).
 * El "trust proxy" en main.ts hace que `req.ip` ya sea la IP real cuando viene
 * detras de Railway/heroku-style.
 */
export function extraerCliente(req: Request): DatosCliente {
  const ip = req.ip ?? null
  const ua = req.get("user-agent")
  return {
    ip: ip && ip.length <= 100 ? ip : null,
    userAgent: ua && ua.length <= 500 ? ua : null,
  }
}
