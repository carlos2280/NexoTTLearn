import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common"
import type { ApiErrorBody, ApiErrorCode } from "@nexott-learn/shared-types"
import type { Response } from "express"

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ApiExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()

    const { status, body } = this.normalize(exception)

    if (status >= 500) {
      this.logger.error(exception)
    }

    response.status(status).json(body)
  }

  private normalize(exception: unknown): { status: number; body: ApiErrorBody } {
    if (exception instanceof HttpException) {
      const status = exception.getStatus()
      const raw = exception.getResponse()

      if (typeof raw === "object" && raw !== null) {
        const obj = raw as Record<string, unknown>

        if (typeof obj.code === "string") {
          return { status, body: obj as unknown as ApiErrorBody }
        }

        const message = this.extractMessage(obj) ?? exception.message
        const fieldErrors = this.extractFieldErrors(obj)
        return {
          status,
          body: {
            code: this.statusToCode(status),
            message,
            ...(fieldErrors && { fieldErrors }),
          },
        }
      }

      return {
        status,
        body: { code: this.statusToCode(status), message: exception.message },
      }
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      body: { code: "INTERNAL", message: "Error interno del servidor" },
    }
  }

  private extractMessage(obj: Record<string, unknown>): string | undefined {
    if (typeof obj.message === "string") {
      return obj.message
    }
    if (Array.isArray(obj.message) && typeof obj.message[0] === "string") {
      return obj.message[0]
    }
    return undefined
  }

  private extractFieldErrors(obj: Record<string, unknown>): Record<string, string[]> | undefined {
    const candidate = obj.fieldErrors ?? obj.errors
    if (typeof candidate === "object" && candidate !== null) {
      return candidate as Record<string, string[]>
    }
    return undefined
  }

  private statusToCode(status: number): ApiErrorCode {
    if (status === HttpStatus.BAD_REQUEST) {
      return "VALIDATION_ERROR"
    }
    if (status === HttpStatus.UNAUTHORIZED) {
      return "UNAUTHORIZED"
    }
    if (status === HttpStatus.FORBIDDEN) {
      return "FORBIDDEN"
    }
    if (status === HttpStatus.NOT_FOUND) {
      return "NOT_FOUND"
    }
    if (status === 423) {
      return "ACCOUNT_LOCKED"
    }
    if (status === HttpStatus.CONFLICT) {
      return "CONFLICT"
    }
    return "INTERNAL"
  }
}
