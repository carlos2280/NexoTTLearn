import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common"
import type { Request } from "express"

@Injectable()
export class SesionGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>()
    if (!request.isAuthenticated?.()) {
      throw new UnauthorizedException("Sesion no valida")
    }
    return true
  }
}
