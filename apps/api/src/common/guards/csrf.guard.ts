import { timingSafeEqual } from "node:crypto"
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from "@nestjs/common"
import { Reflector } from "@nestjs/core"
import { Request } from "express"
import { IS_PUBLIC_KEY } from "../decorators/public.decorator"
import { apiErrorCodes } from "../errors/api-error.codes"
import "../types/sesion.types"

const METODOS_SEGUROS = new Set(["GET", "HEAD", "OPTIONS"])
const NOMBRE_HEADER_CSRF = "x-xsrf-token"

/**
 * Guard global anti-CSRF (convenciones API §2, decision API #1).
 *
 * Patron de doble token: tras el login el servidor emite la cookie
 * `XSRF-TOKEN` (no httpOnly) y guarda el mismo valor en `req.session.csrfToken`.
 * En cada mutacion el cliente reenvia el valor en el header `X-XSRF-TOKEN`.
 * El servidor compara el header contra la sesion (fuente de verdad), no
 * contra la cookie — eso evita que un atacante con control de cookies pueda
 * fabricar un par cookie/header coherente.
 *
 * Endpoints @Public (login, refresh, etc.) y metodos seguros (GET/HEAD/OPTIONS)
 * estan exentos.
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  private readonly logger = new Logger(CsrfGuard.name)

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>()

    if (METODOS_SEGUROS.has(request.method)) {
      return true
    }

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (isPublic === true) {
      return true
    }

    const tokenSesion = request.session?.csrfToken
    const tokenHeader = request.headers[NOMBRE_HEADER_CSRF]

    const sesionValido = typeof tokenSesion === "string" && tokenSesion.length > 0
    const headerValido = typeof tokenHeader === "string" && tokenHeader.length > 0

    const tokensPresentes = sesionValido && headerValido
    const coinciden = tokensPresentes && this.equalsTimingSafe(tokenSesion, tokenHeader)
    if (!coinciden) {
      this.logger.warn(`CSRF token invalido en ${request.method} ${request.path}`)
      throw new ForbiddenException({
        code: apiErrorCodes.prohibido,
        message: "Token anti-CSRF invalido o ausente.",
      })
    }

    return true
  }

  private equalsTimingSafe(stored: string, received: string): boolean {
    if (stored.length !== received.length) {
      return false
    }
    try {
      const bufStored = Buffer.from(stored, "hex")
      const bufReceived = Buffer.from(received, "hex")
      if (bufStored.length === 0 || bufStored.length !== bufReceived.length) {
        return false
      }
      return timingSafeEqual(bufStored, bufReceived)
    } catch (error) {
      if (error instanceof RangeError) {
        return false
      }
      throw error
    }
  }
}
