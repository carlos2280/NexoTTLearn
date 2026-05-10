import { ExecutionContext, createParamDecorator } from "@nestjs/common"
import { Request } from "express"

/**
 * Extrae el header `Idempotency-Key` (convenciones API §10).
 * Devuelve `undefined` si esta ausente. La validacion de presencia
 * (400 IDEMPOTENCY_KEY_REQUERIDA) corresponde al endpoint que la exige.
 */
export const IdempotencyKey = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest<Request>()
    const raw = request.headers["idempotency-key"]
    if (typeof raw !== "string") {
      return undefined
    }
    const trimmed = raw.trim()
    return trimmed.length > 0 ? trimmed : undefined
  },
)
