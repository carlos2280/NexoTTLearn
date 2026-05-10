import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common"
import { Reflector } from "@nestjs/core"
import { Request } from "express"
import { ROLES_KEY } from "../decorators/roles.decorator"
import { apiErrorCodes } from "../errors/api-error.codes"
import { RolUsuario } from "../types/sesion.types"

/**
 * Guard global de autorizacion por rol (convenciones API §3).
 *
 * Lee la metadata declarada por `@Roles(...)` y compara contra `req.session.rol`.
 * Si no hay metadata, el guard pasa y solo aplica el control de sesion previo.
 *
 * Defensa en profundidad: si llega aqui un request sin sesion (lo que indicaria
 * un fallo del SesionGuard), responde 401 explicitamente en lugar de delegarlo.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name)

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requeridos = this.reflector.getAllAndOverride<readonly RolUsuario[] | undefined>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    )
    if (!requeridos || requeridos.length === 0) {
      return true
    }

    const request = context.switchToHttp().getRequest<Request>()
    const rolSesion = request.session?.rol

    if (!rolSesion) {
      this.logger.warn(`Acceso a ruta con rol requerido sin sesion en ${request.path}`)
      throw new UnauthorizedException({
        code: apiErrorCodes.noAutenticado,
        message: "Debe iniciar sesion para acceder a este recurso.",
      })
    }

    if (!requeridos.includes(rolSesion)) {
      this.logger.warn(`Rol ${rolSesion} insuficiente para ${request.method} ${request.path}`)
      throw new ForbiddenException({
        code: apiErrorCodes.prohibido,
        message: "No tiene permisos para acceder a este recurso.",
      })
    }

    return true
  }
}
