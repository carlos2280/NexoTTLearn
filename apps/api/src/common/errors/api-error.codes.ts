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
  // Catalogo P2 — un codigo por recurso para distinguir 404 de cualquier nivel
  // del arbol catalogo (Area > Skill > Modulo > Seccion > Bloque + Cliente).
  areaNoEncontrada: "AREA_NO_ENCONTRADA",
  skillNoEncontrada: "SKILL_NO_ENCONTRADA",
  moduloNoEncontrado: "MODULO_NO_ENCONTRADO",
  seccionNoEncontrada: "SECCION_NO_ENCONTRADA",
  bloqueNoEncontrado: "BLOQUE_NO_ENCONTRADO",
  clienteNoEncontrado: "CLIENTE_NO_ENCONTRADO",
  // Catalogo-admin P3a — mutaciones de areas y skills.
  conflictAreaNombreDuplicado: "CONFLICT_AREA_NOMBRE_DUPLICADO",
  conflictAreaConSkills: "CONFLICT_AREA_CON_SKILLS",
  conflictSkillNombreDuplicado: "CONFLICT_SKILL_NOMBRE_DUPLICADO",
  conflictSkillDuplicada: "CONFLICT_SKILL_DUPLICADA",
  conflictSkillYaArchivada: "CONFLICT_SKILL_YA_ARCHIVADA",
  conflictSkillYaActiva: "CONFLICT_SKILL_YA_ACTIVA",
  conflictSkillConReferencias: "CONFLICT_SKILL_CON_REFERENCIAS",
  // Catalogo-admin P3b — cambio de area y fusion de skills.
  skillYaEnAreaDestino: "SKILL_YA_EN_AREA_DESTINO",
  skillNoActiva: "SKILL_NO_ACTIVA",
  // Catalogo-admin P3c — mutaciones de modulos/secciones/bloques/clientes.
  moduloYaArchivado: "MODULO_YA_ARCHIVADO",
  moduloYaActivo: "MODULO_YA_ACTIVO",
  conflictModuloArchivado: "CONFLICT_MODULO_ARCHIVADO",
  conflictModuloConReferenciasActivas: "MODULO_CON_REFERENCIAS_ACTIVAS",
  conflictModuloConSecciones: "MODULO_CON_SECCIONES",
  seccionOrdenDuplicado: "SECCION_ORDEN_DUPLICADO",
  seccionOrdenInvalido: "SECCION_ORDEN_INVALIDO",
  conflictSeccionConBloquesActivos: "SECCION_CON_BLOQUES_ACTIVOS",
  bloqueOrdenDuplicado: "BLOQUE_ORDEN_DUPLICADO",
  bloqueOrdenInvalido: "BLOQUE_ORDEN_INVALIDO",
  bloqueTipoEdicionInvalido: "BLOQUE_TIPO_EDICION_INVALIDO",
  bloqueSkillObligatoriaEvaluable: "BLOQUE_SKILL_OBLIGATORIA_EVALUABLE",
  bloqueYaEliminado: "BLOQUE_YA_ELIMINADO",
  conflictClienteNombreDuplicado: "CONFLICT_CLIENTE_NOMBRE_DUPLICADO",
  conflictClienteConCursos: "CONFLICT_CLIENTE_CON_CURSOS",
  // Cursos P4a — CRUD, lifecycle BORRADOR/ARCHIVADO/CERRADO, duplicar, log-cambios.
  cursoNoEncontrado: "CURSO_NO_ENCONTRADO",
  conflictCursoEstado: "CONFLICT_CURSO_ESTADO",
  conflictCursoNoBorrador: "CONFLICT_CURSO_NO_BORRADOR",
  conflictCursoNoCerrado: "CONFLICT_CURSO_NO_CERRADO",
  conflictCursoNoArchivado: "CONFLICT_CURSO_NO_ARCHIVADO",
  conflictModuloArchivadoNoDuplicable: "CONFLICT_MODULO_ARCHIVADO_NO_DUPLICABLE",
  validacionCursoFechas: "VALIDACION_CURSO_FECHAS",
} as const

export type ApiErrorCode = (typeof apiErrorCodes)[keyof typeof apiErrorCodes]
