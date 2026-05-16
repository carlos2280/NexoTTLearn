import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnprocessableEntityException,
} from "@nestjs/common"
import { Reflector } from "@nestjs/core"
import { Request } from "express"
import { REQUIERE_MOTIVO_KEY } from "../decorators/requiere-motivo.decorator"
import { apiErrorCodes } from "../errors/api-error.codes"

const NOMBRE_HEADER_MOTIVO = "x-motivo"

/**
 * Guard global de motivo (convenciones API §14).
 *
 * En endpoints marcados con `@RequiereMotivo()` exige `X-Motivo` no vacio
 * (rechaza ausente o solo whitespace con `422 MOTIVO_REQUERIDO`). Sin la
 * metadata, no hace nada — la auditoria del motivo solo aplica donde el
 * controller lo declara explicitamente.
 */
@Injectable()
export class MotivoGuard implements CanActivate {
  private readonly logger = new Logger(MotivoGuard.name)

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiere = this.reflector.getAllAndOverride<boolean | undefined>(REQUIERE_MOTIVO_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (requiere !== true) {
      return true
    }

    const request = context.switchToHttp().getRequest<Request>()
    const raw = request.headers[NOMBRE_HEADER_MOTIVO]
    const valor = typeof raw === "string" ? raw.trim() : ""

    if (valor.length === 0) {
      this.logger.warn(`Falta header X-Motivo en ${request.method} ${request.path}`)
      throw new UnprocessableEntityException({
        code: apiErrorCodes.motivoRequerido,
        message: "El header X-Motivo es obligatorio para esta operacion.",
      })
    }

    return true
  }
}
