import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common"
import { Reflector } from "@nestjs/core"
import type { Rol } from "@nexott-learn/shared-types"
import type { Request } from "express"
import type { UsuarioSesion } from "../../auth/tipos"
import { ROLES_REQUERIDOS_KEY } from "../decorators/roles.decorator"

@Injectable()
export class RolGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requeridos = this.reflector.getAllAndOverride<Rol[] | undefined>(ROLES_REQUERIDOS_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (!requeridos || requeridos.length === 0) {
      return true
    }

    const request = context.switchToHttp().getRequest<Request>()
    if (!request.isAuthenticated?.()) {
      throw new UnauthorizedException("Sesion no valida")
    }

    const usuario = request.user as UsuarioSesion | undefined
    if (!(usuario && requeridos.includes(usuario.rol))) {
      throw new ForbiddenException("No tienes permisos para acceder a este recurso")
    }

    return true
  }
}
