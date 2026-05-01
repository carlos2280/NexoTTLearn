import { type ExecutionContext, createParamDecorator } from "@nestjs/common"
import type { Request } from "express"
import type { UsuarioSesion } from "../../auth/tipos"

export const UsuarioActual = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UsuarioSesion | undefined => {
    const request = ctx.switchToHttp().getRequest<Request>()
    return request.user as UsuarioSesion | undefined
  },
)
