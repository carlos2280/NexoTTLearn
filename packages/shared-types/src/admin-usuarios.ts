import { z } from "zod"

// MAESTRO §2.1, §14.2 · CRUD admin de usuarios (Mantenedores → Usuarios).
// Soft-delete vía bloqueo (T01·§17.1): nunca se elimina, solo se bloquea.
// MFA opcional por usuario (§8.1.1). Reset de password genera temporal y
// marca debeCambiarPassword=true (§8.1).

// ─────────────────────────────────────────────────────────────────
// Enums
// ─────────────────────────────────────────────────────────────────

// MAESTRO §11: VIEWER y SUPER_ADMIN quedan fuera del MVP de Mantenedores.
export const rolMantenedorSchema = z.enum(["ADMIN", "PARTICIPANTE"])
export type RolMantenedor = z.infer<typeof rolMantenedorSchema>

// Estado computado para filtros del listado.
export const estadoUsuarioSchema = z.enum(["ACTIVO", "BLOQUEADO"])
export type EstadoUsuario = z.infer<typeof estadoUsuarioSchema>

// ─────────────────────────────────────────────────────────────────
// Building blocks
// ─────────────────────────────────────────────────────────────────

const nombreSchema = z
  .string()
  .trim()
  .min(2, "El nombre debe tener al menos 2 caracteres")
  .max(80, "El nombre no puede exceder 80 caracteres")

const apellidoSchema = z
  .string()
  .trim()
  .min(2, "El apellido debe tener al menos 2 caracteres")
  .max(80, "El apellido no puede exceder 80 caracteres")

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Email invalido")
  .max(255, "El email no puede exceder 255 caracteres")

const motivoSchema = z
  .string()
  .trim()
  .min(10, "El motivo debe tener al menos 10 caracteres")
  .max(500, "El motivo no puede exceder 500 caracteres")

// ─────────────────────────────────────────────────────────────────
// Lectura
// ─────────────────────────────────────────────────────────────────

export const usuarioAdminSchema = z.object({
  id: z.string(),
  email: z.string(),
  nombre: z.string(),
  apellido: z.string(),
  rol: rolMantenedorSchema,
  estado: estadoUsuarioSchema,
  mfaActivado: z.boolean(),
  mfaConfirmadoEn: z.string().nullable(),
  debeCambiarPassword: z.boolean(),
  bloqueadoAt: z.string().nullable(),
  ultimoLoginEn: z.string().nullable(),
  passwordCambiadoEn: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})
export type UsuarioAdmin = z.infer<typeof usuarioAdminSchema>

export const usuarioListResponseSchema = z.object({
  items: z.array(usuarioAdminSchema),
  total: z.number().int().min(0),
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
})
export type UsuarioListResponse = z.infer<typeof usuarioListResponseSchema>

// ─────────────────────────────────────────────────────────────────
// Query de listado
// ─────────────────────────────────────────────────────────────────

export const listarUsuariosQuerySchema = z.object({
  rol: rolMantenedorSchema.optional(),
  estado: estadoUsuarioSchema.optional(),
  mfa: z.coerce.boolean().optional(),
  q: z.string().trim().min(1).max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})
export type ListarUsuariosQuery = z.infer<typeof listarUsuariosQuerySchema>

// ─────────────────────────────────────────────────────────────────
// Crear / Actualizar
// ─────────────────────────────────────────────────────────────────

// MAESTRO §14.4 · sin email automático en MVP. La password temporal se
// genera en el back y se devuelve UNA SOLA VEZ en la respuesta del POST.
// Si el admin la pierde, debe disparar reset-password.
export const crearUsuarioSchema = z
  .object({
    nombre: nombreSchema,
    apellido: apellidoSchema,
    email: emailSchema,
    rol: rolMantenedorSchema,
    activarMfa: z.boolean().default(false),
  })
  .strict()
export type CrearUsuarioInput = z.infer<typeof crearUsuarioSchema>

// PATCH parcial. No permite cambiar email ni password (cada uno tiene su
// flujo dedicado). `.strict()` rechaza claves desconocidas.
export const actualizarUsuarioSchema = z
  .object({
    nombre: nombreSchema,
    apellido: apellidoSchema,
    rol: rolMantenedorSchema,
  })
  .partial()
  .strict()
export type ActualizarUsuarioInput = z.infer<typeof actualizarUsuarioSchema>

// ─────────────────────────────────────────────────────────────────
// Acciones administrativas (motivo opcional)
// ─────────────────────────────────────────────────────────────────

const accionConMotivoSchema = z
  .object({
    motivo: motivoSchema.optional(),
  })
  .strict()

export const bloquearUsuarioSchema = accionConMotivoSchema
export type BloquearUsuarioInput = z.infer<typeof bloquearUsuarioSchema>

export const desbloquearUsuarioSchema = accionConMotivoSchema
export type DesbloquearUsuarioInput = z.infer<typeof desbloquearUsuarioSchema>

export const resetPasswordUsuarioSchema = accionConMotivoSchema
export type ResetPasswordUsuarioInput = z.infer<typeof resetPasswordUsuarioSchema>

export const activarMfaUsuarioSchema = accionConMotivoSchema
export type ActivarMfaUsuarioInput = z.infer<typeof activarMfaUsuarioSchema>

export const resetMfaUsuarioSchema = accionConMotivoSchema
export type ResetMfaUsuarioInput = z.infer<typeof resetMfaUsuarioSchema>

// ─────────────────────────────────────────────────────────────────
// Respuestas
// ─────────────────────────────────────────────────────────────────

// La password temporal se devuelve UNA SOLA VEZ (post creación o reset).
// El front la muestra en modal con [Copiar].
export const usuarioConCredencialesSchema = z.object({
  usuario: usuarioAdminSchema,
  passwordTemporal: z.string(),
})
export type UsuarioConCredenciales = z.infer<typeof usuarioConCredencialesSchema>

export const resetPasswordResponseSchema = z.object({
  passwordTemporal: z.string(),
})
export type ResetPasswordResponse = z.infer<typeof resetPasswordResponseSchema>
