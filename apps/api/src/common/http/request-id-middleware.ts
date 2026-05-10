import { randomUUID } from "node:crypto"
import { NextFunction, Request, Response } from "express"

const HEADER_REQUEST_ID = "x-request-id"

/**
 * Middleware Express de correlacion (convenciones API §16).
 *
 * Se ejecuta antes de session/cors para que CUALQUIER respuesta — incluida la
 * que generan los guards globales antes del controller — incluya `X-Request-Id`.
 * El interceptor equivalente seguia ejecutandose despues de los guards: si un
 * guard lanzaba, la respuesta de error no llevaba el header. Migrar a middleware
 * cubre ese caso (riesgo identificado en P0.1).
 */
export function crearMiddlewareRequestId() {
  return (req: Request, res: Response, next: NextFunction): void => {
    const incoming = req.headers[HEADER_REQUEST_ID]
    const requestId = typeof incoming === "string" && incoming.length > 0 ? incoming : randomUUID()
    req.headers[HEADER_REQUEST_ID] = requestId
    res.setHeader("X-Request-Id", requestId)
    next()
  }
}
