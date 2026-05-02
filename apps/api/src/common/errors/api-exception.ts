import { HttpException, HttpStatus } from "@nestjs/common"
import type { ApiErrorBody, ApiErrorCode } from "@nexott-learn/shared-types"

interface ApiExceptionOptions {
  readonly code: ApiErrorCode
  readonly message: string
  readonly status: HttpStatus | number
  readonly retryAfter?: number
  readonly fieldErrors?: Record<string, string[]>
}

export class ApiException extends HttpException {
  constructor(options: ApiExceptionOptions) {
    const body: ApiErrorBody = {
      code: options.code,
      message: options.message,
      ...(options.retryAfter !== undefined && { retryAfter: options.retryAfter }),
      ...(options.fieldErrors && { fieldErrors: options.fieldErrors }),
    }
    super(body, options.status)
  }

  static invalidCredentials(): ApiException {
    return new ApiException({
      code: "INVALID_CREDENTIALS",
      message: "Credenciales invalidas",
      status: HttpStatus.UNAUTHORIZED,
    })
  }

  static accountLocked(retryAfter: number): ApiException {
    return new ApiException({
      code: "ACCOUNT_LOCKED",
      message: "Cuenta bloqueada por intentos fallidos",
      status: 423,
      retryAfter,
    })
  }

  static accountInactive(): ApiException {
    return new ApiException({
      code: "ACCOUNT_INACTIVE",
      message: "Cuenta inactiva",
      status: HttpStatus.UNAUTHORIZED,
    })
  }
}
