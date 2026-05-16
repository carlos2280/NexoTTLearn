import { randomBytes } from "node:crypto"
import { NextFunction, Request, Response } from "express"

const NOMBRE_COOKIE_CSRF = "XSRF-TOKEN"
const LONGITUD_TOKEN_CSRF_BYTES = 32

interface OpcionesCsrf {
  readonly cookieSecure: boolean
  readonly cookieSameSite: "lax" | "none" | "strict"
}

/**
 * Emite el token doble CSRF: lo guarda en `req.session.csrfToken` y lo escribe
 * en la cookie `XSRF-TOKEN` (no httpOnly, legible por JS) — el cliente debera
 * reenviarlo en el header `X-XSRF-TOKEN` en cada mutacion (convenciones §2).
 *
 * Se llama desde dos lugares:
 *   1. `AuthController.login` tras `req.session.regenerate` para que la cookie
 *      viaje en la respuesta del login (evita el round-trip extra).
 *   2. El middleware Express de fallback, para sesiones existentes que aun no
 *      tienen token (compatibilidad con sesiones creadas antes del helper).
 */
export function emitirCsrfToken(req: Request, res: Response, opciones: OpcionesCsrf): string {
  const token = randomBytes(LONGITUD_TOKEN_CSRF_BYTES).toString("hex")
  if (req.session) {
    req.session.csrfToken = token
  }
  res.cookie(NOMBRE_COOKIE_CSRF, token, {
    httpOnly: false,
    secure: opciones.cookieSecure,
    sameSite: opciones.cookieSameSite,
    path: "/",
  })
  return token
}

/**
 * Limpia la cookie CSRF (logout). Debe llamarse junto con la destruccion de la
 * sesion server-side para no dejar cookies huerfanas en el navegador.
 */
export function limpiarCookieCsrf(res: Response): void {
  res.clearCookie(NOMBRE_COOKIE_CSRF, { path: "/" })
}

/**
 * Middleware Express de fallback: emite la cookie CSRF cuando ya hay sesion
 * activa y aun no hay cookie (caso: sesion existente que no paso por login en
 * la version actual). Es defensivo — el camino "feliz" es el helper directo.
 */
export function crearMiddlewareCsrfFallback(opciones: OpcionesCsrf) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.session?.usuarioId) {
      next()
      return
    }
    const cookieActual = req.cookies?.[NOMBRE_COOKIE_CSRF]
    if (typeof cookieActual === "string" && cookieActual.length > 0) {
      next()
      return
    }
    emitirCsrfToken(req, res, opciones)
    next()
  }
}
