/**
 * Catalogo de codigos de error transversales (Slice 0).
 * Los codigos por dominio se anaden en cada feature module y se documentan
 * en `docs/NexoTTLearn/05_api/endpoints/`.
 *
 * Convencion: las CLAVES del objeto son camelCase (uso interno, idiomatico TS);
 * los VALORES son SCREAMING_SNAKE_CASE y representan el `code` que viaja al
 * cliente HTTP (convenciones API §9). Cambiar un VALOR rompe el contrato.
 */
export const apiErrorCodes = {
  prohibido: "PROHIBIDO",
  noAutenticado: "NO_AUTENTICADO",
  noEncontrado: "NO_ENCONTRADO",
  invalidBody: "INVALID_BODY",
  invalidQuery: "INVALID_QUERY",
  errorInterno: "ERROR_INTERNO",
  idempotencyKeyRequerida: "IDEMPOTENCY_KEY_REQUERIDA",
  motivoRequerido: "MOTIVO_REQUERIDO",
  rateLimit: "RATE_LIMIT",
  conflict: "CONFLICT",
  credencialesInvalidas: "CREDENCIALES_INVALIDAS",
  usuarioBloqueado: "USUARIO_BLOQUEADO",
  usuarioExEmpleado: "USUARIO_EX_EMPLEADO",
  passwordInicialCaducada: "PASSWORD_INICIAL_CADUCADA",
  passwordActualInvalido: "PASSWORD_ACTUAL_INVALIDO",
  passwordDebil: "VALIDACION_PASSWORD_DEBIL",
  passwordRepetido: "VALIDACION_PASSWORD_REPETIDO",
  conflictEmailDuplicado: "CONFLICT_EMAIL_DUPLICADO",
  mfaPendienteFaseP1B: "MFA_PENDIENTE_FASE_P1B",
  codigoMfaInvalido: "CODIGO_MFA_INVALIDO",
  mfaChallengeExpirado: "MFA_CHALLENGE_EXPIRADO",
  setupMfaRequerido: "SETUP_MFA_REQUERIDO",
  modoAutomaticoNoDisponible: "MODO_AUTOMATICO_NO_DISPONIBLE",
} as const

export type ApiErrorCode = (typeof apiErrorCodes)[keyof typeof apiErrorCodes]
