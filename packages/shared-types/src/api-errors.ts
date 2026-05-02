import { z } from "zod"

export const API_ERROR_CODES = [
  "VALIDATION_ERROR",
  "INVALID_CREDENTIALS",
  "ACCOUNT_LOCKED",
  "ACCOUNT_INACTIVE",
  "MFA_REQUIRED",
  "MFA_INVALID",
  "MFA_EXPIRED",
  "PASSWORD_CHANGE_REQUIRED",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NOT_FOUND",
  "CONFLICT",
  "INTERNAL",
] as const

export type ApiErrorCode = (typeof API_ERROR_CODES)[number]

export const apiErrorBodySchema = z.object({
  code: z.enum(API_ERROR_CODES),
  message: z.string(),
  fieldErrors: z.record(z.string(), z.array(z.string())).optional(),
  retryAfter: z.number().int().nonnegative().optional(),
})

export type ApiErrorBody = z.infer<typeof apiErrorBodySchema>
