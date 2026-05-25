import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger } from "@nestjs/common"
import { Prisma } from "@prisma/client"
import { Request, Response } from "express"
import { apiErrorCodes } from "../errors/api-error.codes"

interface MapeoError {
  readonly status: number
  readonly code: string
  readonly message: string
}

/**
 * Filtro global para errores conocidos de Prisma (convenciones API §9).
 * Mapea codigos de error de Prisma a respuestas HTTP estables y publicables:
 *   P2002 (unique violation)         -> 409 CONFLICT
 *   P2025 (record not found)         -> 404 NO_ENCONTRADO
 *   P2003 (FK constraint violation)  -> 400 INVALID_BODY
 *   resto                            -> 500 ERROR_INTERNO (sin filtrar detalle)
 *
 * Errores no instancia de Prisma se delegan a la cadena de filtros estandar.
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name)

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    const request = ctx.getRequest<Request>()
    const response = ctx.getResponse<Response>()
    const mapeo = this.mapPrismaError(exception)

    const requestIdHeader = request?.headers?.["x-request-id"]
    const requestId = typeof requestIdHeader === "string" ? requestIdHeader : "-"
    const target = JSON.stringify(exception.meta?.target ?? null)
    const linea = `Prisma ${exception.code} target=${target} -> HTTP ${mapeo.status} (${mapeo.code}) reqId=${requestId}`

    if (mapeo.status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(linea)
    } else {
      this.logger.warn(linea)
    }

    response.status(mapeo.status).json({
      code: mapeo.code,
      message: mapeo.message,
    })
  }

  private mapPrismaError(error: Prisma.PrismaClientKnownRequestError): MapeoError {
    switch (error.code) {
      case "P2002":
        return {
          status: HttpStatus.CONFLICT,
          code: apiErrorCodes.conflict,
          message: "El recurso ya existe.",
        }
      case "P2025":
        return {
          status: HttpStatus.NOT_FOUND,
          code: apiErrorCodes.noEncontrado,
          message: "Recurso no encontrado.",
        }
      case "P2003":
        return {
          status: HttpStatus.BAD_REQUEST,
          code: apiErrorCodes.invalidBody,
          message: "Referencia invalida: el recurso relacionado no existe.",
        }
      default:
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          code: apiErrorCodes.errorInterno,
          message: "Error interno de base de datos.",
        }
    }
  }
}
