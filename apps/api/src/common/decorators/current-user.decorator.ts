import { ExecutionContext, createParamDecorator } from "@nestjs/common"
import { Request } from "express"
import { SesionUsuario } from "../types/sesion.types"

/**
 * Extrae la identidad del usuario autenticado desde la sesion server-side.
 * En Slice 0 los campos de la sesion solo se leen; el llenado real ocurre en
 * Slice 1 (auth/login). Devuelve `undefined` si no hay sesion activa: los
 * endpoints privados deben combinar este decorator con el SesionGuard global.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): SesionUsuario | undefined => {
    const request = ctx.switchToHttp().getRequest<Request>()
    const usuarioId = request.session?.usuarioId
    const rol = request.session?.rol
    if (!(usuarioId && rol)) {
      return undefined
    }
    return { usuarioId, rol }
  },
)
