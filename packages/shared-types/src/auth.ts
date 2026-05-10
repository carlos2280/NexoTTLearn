import { z } from "zod"

export const ROLES = ["PARTICIPANTE", "ADMIN"] as const
export type Rol = (typeof ROLES)[number]

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email invalido").max(255),
  password: z.string().min(1, "Password requerido").max(200),
})
export type LoginInput = z.infer<typeof loginSchema>

export const usuarioPublicoSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  nombre: z.string(),
  apellido: z.string(),
  rol: z.enum(ROLES),
  debeCambiarPassword: z.boolean(),
  mfaEnabled: z.boolean(),
})
export type UsuarioPublico = z.infer<typeof usuarioPublicoSchema>

export const loginResponseSchema = z.object({
  usuario: usuarioPublicoSchema,
})
export type LoginResponse = z.infer<typeof loginResponseSchema>

// Modo de la respuesta cuando hay MFA pendiente:
// - "verify": el usuario ya configuro MFA, solo necesita ingresar el codigo
// - "setup": primer login con MFA habilitado, debe escanear QR
const mfaPendingVerifySchema = z.object({
  status: z.literal("mfa-verify"),
  challengeId: z.string().min(1),
  emailEnmascarado: z.string(),
})
export type MfaPendingVerify = z.infer<typeof mfaPendingVerifySchema>

const mfaPendingSetupSchema = z.object({
  status: z.literal("mfa-setup"),
  challengeId: z.string().min(1),
  emailEnmascarado: z.string(),
  secret: z.string().min(1),
  otpauthUri: z.string().min(1),
})
export type MfaPendingSetup = z.infer<typeof mfaPendingSetupSchema>

// Resultado del POST /auth/login. Discriminado por `status`.
export const loginResultSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("ok"), usuario: usuarioPublicoSchema }),
  mfaPendingVerifySchema,
  mfaPendingSetupSchema,
])
export type LoginResult = z.infer<typeof loginResultSchema>

// Verificacion MFA en login normal (POST /auth/verify-mfa)
export const verifyMfaSchema = z.object({
  challengeId: z.string().min(1, "Challenge requerido").max(200),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "El codigo debe tener 6 digitos"),
})
export type VerifyMfaInput = z.infer<typeof verifyMfaSchema>

export const verifyMfaResponseSchema = z.object({
  usuario: usuarioPublicoSchema,
})
export type VerifyMfaResponse = z.infer<typeof verifyMfaResponseSchema>

// Confirmacion de setup MFA (POST /auth/confirm-mfa-setup)
// Mismo shape que verifyMfa pero endpoint distinto: marca mfaConfirmadoEn=now.
export const confirmMfaSetupSchema = verifyMfaSchema
export type ConfirmMfaSetupInput = z.infer<typeof confirmMfaSetupSchema>
export const confirmMfaSetupResponseSchema = verifyMfaResponseSchema
export type ConfirmMfaSetupResponse = z.infer<typeof confirmMfaSetupResponseSchema>

// Mínimo 8 chars, al menos 1 mayúscula, 1 minúscula, 1 número (OWASP A07)
const passwordFuerteSchema = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres")
  .max(200)
  .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
  .regex(/[a-z]/, "Debe contener al menos una minúscula")
  .regex(/[0-9]/, "Debe contener al menos un número")

export const cambiarPasswordSchema = z
  .object({
    passwordActual: z.string().min(1, "Password actual requerido").max(200),
    passwordNuevo: passwordFuerteSchema,
    confirmacion: z.string().min(1, "Confirmación requerida").max(200),
  })
  .refine((data) => data.passwordNuevo === data.confirmacion, {
    message: "Las contraseñas no coinciden",
    path: ["confirmacion"],
  })
  .refine((data) => data.passwordActual !== data.passwordNuevo, {
    message: "La nueva contraseña debe ser diferente a la actual",
    path: ["passwordNuevo"],
  })

export type CambiarPasswordInput = z.infer<typeof cambiarPasswordSchema>
