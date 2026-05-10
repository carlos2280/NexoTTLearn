import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from "@nestjs/common"
import { Reflector } from "@nestjs/core"
import { Request } from "express"
import { IS_PUBLIC_KEY } from "../decorators/public.decorator"
import { apiErrorCodes } from "../errors/api-error.codes"
import "../types/sesion.types"

/**
 * Guard global de autenticacion (convenciones API §2 / §3).
 *
 * Politica de denegacion por defecto: toda ruta es privada salvo las marcadas
 * explicitamente con @Public(). Lee la identidad desde `req.session.usuarioId`
 * (sesiones server-side con express-session + connect-pg-simple). NO usa JWT.
 *
 * En Slice 0 ningun endpoint privado existe aun: el guard se activa con
 * /api/health (publico) y queda listo para que Slice 1 (auth/login) lo pruebe.
 */
@Injectable()
export class SesionGuard implements CanActivate {
  private readonly logger = new Logger(SesionGuard.name)

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (isPublic === true) {
      return true
    }

    const request = context.switchToHttp().getRequest<Request>()
    const usuarioId = request.session?.usuarioId

    if (!usuarioId) {
      this.logger.debug(`Acceso sin sesion a ${request.method} ${request.path}`)
      throw new UnauthorizedException({
        code: apiErrorCodes.noAutenticado,
        message: "Debe iniciar sesion para acceder a este recurso.",
      })
    }

    return true
  }
}
