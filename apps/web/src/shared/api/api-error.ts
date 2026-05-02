import type { ApiErrorCode } from "@nexott-learn/shared-types"

interface ApiErrorOptions {
  readonly status: number
  readonly code: ApiErrorCode
  readonly message: string
  readonly fieldErrors?: Record<string, string[]>
  readonly retryAfter?: number
}

export class ApiError extends Error {
  readonly status: number
  readonly code: ApiErrorCode
  readonly fieldErrors?: Record<string, string[]>
  readonly retryAfter?: number

  constructor(options: ApiErrorOptions) {
    super(options.message)
    this.name = "ApiError"
    this.status = options.status
    this.code = options.code
    this.fieldErrors = options.fieldErrors
    this.retryAfter = options.retryAfter
  }
}
