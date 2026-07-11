import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from "@nestjs/common"
import { Response } from "express"
import { MulterError } from "multer"
import { apiErrorCodes } from "../common/errors/api-error.codes"

/**
 * Traduce los errores de multer a respuestas HTTP con significado, en vez del
 * 500 opaco que produciría el handler por defecto de Nest. Superficie de subida
 * de imágenes: un archivo demasiado grande debe ser 413, no un error interno.
 */
@Catch(MulterError)
export class MulterExceptionFilter implements ExceptionFilter {
  catch(exception: MulterError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>()

    if (exception.code === "LIMIT_FILE_SIZE") {
      response.status(HttpStatus.PAYLOAD_TOO_LARGE).json({
        code: apiErrorCodes.imagenDemasiadoGrande,
        message: "La imagen supera el tamaño máximo permitido (5 MB).",
      })
      return
    }

    response.status(HttpStatus.BAD_REQUEST).json({
      code: apiErrorCodes.invalidBody,
      message: "Subida inválida.",
    })
  }
}
