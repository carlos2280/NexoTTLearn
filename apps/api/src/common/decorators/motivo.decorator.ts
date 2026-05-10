import { ExecutionContext, createParamDecorator } from "@nestjs/common"
import { Request } from "express"

/**
 * Extrae el header `X-Motivo` (convenciones API §14).
 * Devuelve `undefined` si el header esta ausente o solo contiene whitespace.
 * La validacion de presencia (422 MOTIVO_REQUERIDO) corresponde al guard/pipe
 * que aplica el endpoint sensible.
 */
export const Motivo = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest<Request>()
    const raw = request.headers["x-motivo"]
    if (typeof raw !== "string") {
      return undefined
    }
    const trimmed = raw.trim()
    return trimmed.length > 0 ? trimmed : undefined
  },
)
