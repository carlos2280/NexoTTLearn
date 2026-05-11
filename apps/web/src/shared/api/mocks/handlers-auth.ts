import type { LoginResponse, UsuarioSesion } from "@/features/auth/types"
import { ApiError } from "../api-error"
import {
  type MockUsuario,
  VERSION_AVISO_PRIVACIDAD,
  buscarUsuarioPorEmail,
  buscarUsuarioPorId,
  mockState,
} from "./db"
import { type MockHandler, defineRoute } from "./router"

const MAX_INTENTOS_FALLIDOS = 5
const MFA_CHALLENGE_TTL_MS = 5 * 60 * 1000
const PASSWORD_MIN_LENGTH = 10

const RE_CODIGO_MFA = /^\d{6}$/
const RE_PASSWORD_MAYUSCULA = /[A-Z]/
const RE_PASSWORD_MINUSCULA = /[a-z]/
const RE_PASSWORD_NUMERO = /\d/

function aSesion(u: MockUsuario): UsuarioSesion {
  return {
    usuarioId: u.id,
    colaboradorId: u.id,
    email: u.email,
    nombre: u.nombre,
    rol: u.rol,
    mfaHabilitado: u.mfaHabilitado,
    requiereCambioPassword: u.requiereCambioPassword,
    requiereAceptarAvisoPrivacidad: u.requiereAceptarAvisoPrivacidad,
  }
}

function generarChallengeId(): string {
  return `mfa_${Math.random().toString(36).slice(2, 12)}`
}

const handleLogin: MockHandler = (req) => {
  const body = (req.body ?? {}) as { email?: string; password?: string }
  const email = (body.email ?? "").trim().toLowerCase()
  const password = body.password ?? ""

  if (!(email && password)) {
    throw new ApiError(422, "VALIDACION_ENTRADA", "Email y contraseña son obligatorios.")
  }

  const usuario = buscarUsuarioPorEmail(email)

  if (!usuario || usuario.password !== password) {
    const fallidos = (mockState.intentosFallidos.get(email) ?? 0) + 1
    mockState.intentosFallidos.set(email, fallidos)
    if (fallidos >= MAX_INTENTOS_FALLIDOS) {
      throw new ApiError(
        403,
        "USUARIO_BLOQUEADO",
        "Tu cuenta ha sido bloqueada por intentos fallidos. Contacta al administrador.",
      )
    }
    throw new ApiError(401, "CREDENCIALES_INVALIDAS", "Credenciales inválidas.")
  }

  if (usuario.estado === "BLOQUEADO") {
    throw new ApiError(
      403,
      "USUARIO_BLOQUEADO",
      "Tu cuenta está bloqueada. Contacta al administrador.",
    )
  }

  if (usuario.estado === "EX_EMPLEADO") {
    throw new ApiError(403, "USUARIO_EX_EMPLEADO", "Tu cuenta no está activa.")
  }

  mockState.intentosFallidos.delete(email)

  if (usuario.mfaHabilitado) {
    const challengeId = generarChallengeId()
    const expiraEn = Date.now() + MFA_CHALLENGE_TTL_MS
    mockState.mfaChallenges.set(challengeId, {
      id: challengeId,
      usuarioId: usuario.id,
      expiraEn,
    })
    const response: LoginResponse = {
      mfaRequired: true,
      mfaChallengeId: challengeId,
    }
    return response
  }

  mockState.sesionActual = { usuarioId: usuario.id }
  const response: LoginResponse = { mfaRequired: false, perfil: aSesion(usuario) }
  return response
}

const handleMfaVerify: MockHandler = (req) => {
  const body = (req.body ?? {}) as { challengeId?: string; codigo?: string }
  const challengeId = body.challengeId ?? ""
  const codigo = (body.codigo ?? "").trim()

  const challenge = mockState.mfaChallenges.get(challengeId)
  if (!challenge) {
    throw new ApiError(
      401,
      "MFA_CHALLENGE_EXPIRADO",
      "La sesión de verificación expiró. Vuelve a iniciar sesión.",
    )
  }

  if (challenge.expiraEn < Date.now()) {
    mockState.mfaChallenges.delete(challengeId)
    throw new ApiError(
      401,
      "MFA_CHALLENGE_EXPIRADO",
      "El código MFA expiró. Vuelve a iniciar sesión.",
    )
  }

  if (!RE_CODIGO_MFA.test(codigo)) {
    throw new ApiError(401, "CODIGO_MFA_INVALIDO", "El código debe tener 6 dígitos.")
  }

  // Mock: cualquier código de 6 dígitos válido excepto "000000"
  if (codigo === "000000") {
    throw new ApiError(401, "CODIGO_MFA_INVALIDO", "Código incorrecto.")
  }

  mockState.mfaChallenges.delete(challengeId)
  mockState.sesionActual = { usuarioId: challenge.usuarioId }
  return null
}

const handleMe: MockHandler = () => {
  if (!mockState.sesionActual) {
    throw new ApiError(401, "SESION_INVALIDA", "Sesión inválida o expirada.")
  }
  const usuario = buscarUsuarioPorId(mockState.sesionActual.usuarioId)
  if (!usuario) {
    throw new ApiError(401, "SESION_INVALIDA", "Sesión inválida o expirada.")
  }
  return aSesion(usuario)
}

const handleLogout: MockHandler = () => {
  mockState.sesionActual = null
  return null
}

const handleCambiarPassword: MockHandler = (req) => {
  if (!mockState.sesionActual) {
    throw new ApiError(401, "SESION_INVALIDA", "Sesión inválida o expirada.")
  }
  const usuario = buscarUsuarioPorId(mockState.sesionActual.usuarioId)
  if (!usuario) {
    throw new ApiError(401, "SESION_INVALIDA", "Sesión inválida o expirada.")
  }

  const body = (req.body ?? {}) as {
    passwordActual?: string
    passwordNueva?: string
  }
  const passwordActual = body.passwordActual ?? ""
  const passwordNueva = body.passwordNueva ?? ""

  if (passwordActual !== usuario.password) {
    throw new ApiError(401, "PASSWORD_ACTUAL_INVALIDO", "La contraseña actual no es correcta.")
  }

  if (passwordNueva.length < PASSWORD_MIN_LENGTH) {
    throw new ApiError(
      422,
      "VALIDACION_PASSWORD_DEBIL",
      `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`,
    )
  }
  const passwordValida =
    RE_PASSWORD_MAYUSCULA.test(passwordNueva) &&
    RE_PASSWORD_MINUSCULA.test(passwordNueva) &&
    RE_PASSWORD_NUMERO.test(passwordNueva)
  if (!passwordValida) {
    throw new ApiError(
      422,
      "VALIDACION_PASSWORD_DEBIL",
      "La contraseña debe combinar mayúsculas, minúsculas y números.",
    )
  }

  if (usuario.passwordHistorial.includes(passwordNueva)) {
    throw new ApiError(
      422,
      "VALIDACION_PASSWORD_REPETIDO",
      "La nueva contraseña no puede repetir una anterior.",
    )
  }

  usuario.password = passwordNueva
  usuario.passwordHistorial = [passwordNueva, ...usuario.passwordHistorial].slice(0, 5)
  usuario.requiereCambioPassword = false
  if (usuario.estado === "PENDIENTE_PRIMER_INGRESO") {
    usuario.estado = "ACTIVO"
  }
  return null
}

const handleAceptarAvisoPrivacidad: MockHandler = (req) => {
  if (!mockState.sesionActual) {
    throw new ApiError(401, "SESION_INVALIDA", "Sesión inválida o expirada.")
  }
  const usuario = buscarUsuarioPorId(mockState.sesionActual.usuarioId)
  if (!usuario) {
    throw new ApiError(401, "SESION_INVALIDA", "Sesión inválida o expirada.")
  }

  const body = (req.body ?? {}) as { versionAviso?: string }
  if (body.versionAviso !== VERSION_AVISO_PRIVACIDAD) {
    throw new ApiError(422, "VERSION_AVISO_INVALIDA", "Versión del aviso no reconocida.")
  }
  usuario.requiereAceptarAvisoPrivacidad = false
  return null
}

export const handlersAuth = [
  defineRoute("POST", /^\/auth\/login$/, handleLogin),
  defineRoute("POST", /^\/auth\/mfa\/verify$/, handleMfaVerify),
  defineRoute("GET", /^\/auth\/me$/, handleMe),
  defineRoute("DELETE", /^\/auth\/session$/, handleLogout),
  defineRoute("POST", /^\/auth\/cambiar-password$/, handleCambiarPassword),
  defineRoute("POST", /^\/auth\/aceptar-aviso-privacidad$/, handleAceptarAvisoPrivacidad),
]
