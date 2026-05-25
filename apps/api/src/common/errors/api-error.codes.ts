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
  motivoInvalido: "MOTIVO_INVALIDO",
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
  // Cursos P4b — configuracion (areas, skills exigidas, modulos, pesos, transversal, entrevista IA).
  // D-CUR-11: codigo unificado para suma=100 con `details.contexto` que distingue dominio.
  validacionPesoNoSuma100: "VALIDACION_PESO_NO_SUMA_100",
  validacionSkillSinCobertura: "VALIDACION_SKILL_SIN_COBERTURA",
  validacionModulosReordenSetDistinto: "VALIDACION_MODULOS_REORDEN_SET_DISTINTO",
  validacionUmbralesLogroMonotonia: "VALIDACION_UMBRALES_LOGRO_MONOTONIA",
  validacionDuracionEntrevistaInvalida: "VALIDACION_DURACION_ENTREVISTA_INVALIDA",
  conflictModuloArchivadoNoHabilitable: "CONFLICT_MODULO_ARCHIVADO_NO_HABILITABLE",
  conflictTransversalConIntentos: "CONFLICT_TRANSVERSAL_CON_INTENTOS",
  conflictEntrevistaConIntentos: "CONFLICT_ENTREVISTA_CON_INTENTOS",
  // Cursos P4c — transicion BORRADOR -> ACTIVO (D63, D-CUR-9).
  conflictCursoNoPublicable: "CONFLICT_CURSO_NO_PUBLICABLE",
  // Codigos especificos de precondiciones D63 que no encajaban en los existentes:
  validacionAreaPuntajeObjetivoFueraDeRango: "VALIDACION_AREA_PUNTAJE_OBJETIVO_FUERA_DE_RANGO",
  validacionUmbralFueraDeRango: "VALIDACION_UMBRAL_FUERA_DE_RANGO",
  // Colaboradores P5a — ficha y endpoints relacionados.
  colaboradorNoEncontrado: "COLABORADOR_NO_ENCONTRADO",
  // Storage P5a (D-EVI-1).
  archivoNoEncontrado: "ARCHIVO_NO_ENCONTRADO",
  archivoPathInvalido: "ARCHIVO_PATH_INVALIDO",
  // Idempotency transversal P5a (D-EVI-3). Reservado para P5c.
  conflictIdempotencyKeyReusadaConBodyDistinto:
    "CONFLICT_IDEMPOTENCY_KEY_REUSADA_CON_BODY_DISTINTO",
  // Evaluacion inicial P5b — preview + parsing (D-EVI-2, D-EVI-6, D-EVI-8).
  previewNoEncontrado: "PREVIEW_NO_ENCONTRADO",
  conflictPreviewYaAplicado: "CONFLICT_PREVIEW_YA_APLICADO",
  validacionExcelEncabezados: "VALIDACION_EXCEL_ENCABEZADOS",
  validacionExcelFilas: "VALIDACION_EXCEL_FILAS",
  // Sub-codigos por celda (viajan dentro de `details.filas[].errores[].codigo`).
  validacionExcelEmailNoAsignado: "VALIDACION_EXCEL_EMAIL_NO_ASIGNADO",
  validacionExcelNotaFueraRango: "VALIDACION_EXCEL_NOTA_FUERA_RANGO",
  validacionExcelNotaNoNumerica: "VALIDACION_EXCEL_NOTA_NO_NUMERICA",
  validacionExcelEmailFormatoInvalido: "VALIDACION_EXCEL_EMAIL_FORMATO_INVALIDO",
  validacionExcelEmailDuplicadoEnArchivo: "VALIDACION_EXCEL_EMAIL_DUPLICADO_EN_ARCHIVO",
  // Evaluacion inicial P5c — aplicar (D-EVI-3 cierre, D-EVI-7 todo-o-nada).
  validacionPreviewConRechazos: "VALIDACION_PREVIEW_CON_RECHAZOS",
  // Asignaciones P6a — foundation + altas (D-AS-1..D-AS-14).
  asignacionNoEncontrada: "ASIGNACION_NO_ENCONTRADA",
  conflictAsignacionDuplicada: "CONFLICT_ASIGNACION_DUPLICADA",
  conflictAsignacionNoVoluntario: "CONFLICT_ASIGNACION_NO_VOLUNTARIO",
  conflictCursoNoActivo: "CONFLICT_CURSO_NO_ACTIVO",
  conflictAutoInscripcionDeshabilitada: "CONFLICT_AUTOINSCRIPCION_DESHABILITADA",
  // Asignaciones P6b — transiciones de estado (D-AS-5..D-AS-13).
  conflictAsignacionEstado: "CONFLICT_ASIGNACION_ESTADO",
  conflictAsignacionNoListoNiEnProgreso: "CONFLICT_ASIGNACION_NO_LISTO_NI_EN_PROGRESO",
  conflictAsignacionNoCerrada: "CONFLICT_ASIGNACION_NO_CERRADA",
  condicionesListoNoCumplidas: "CONDICIONES_LISTO_NO_CUMPLIDAS",
  // Asignaciones P6c — resultado entrevista cliente (D58).
  validacionResultadoSoloAsignado: "VALIDACION_RESULTADO_SOLO_ASIGNADO",
  validacionAsignacionNoCerrada: "VALIDACION_ASIGNACION_NO_CERRADA",
  // Plan personal P7a (D-S7-B1..B6, D-S7-D1..D2).
  planNoEncontrado: "PLAN_NO_ENCONTRADO",
  conflictPlanYaCalculado: "CONFLICT_PLAN_YA_CALCULADO",
  // Plan personal P7c — ajustes manuales admin + diff.
  seccionNoEnPlan: "SECCION_NO_EN_PLAN",
  conflictSeccionYaEnPlan: "CONFLICT_SECCION_YA_EN_PLAN",
  fichaSnapshotInvalida: "FICHA_SNAPSHOT_INVALIDA",
  // Intentos de bloque P7b (D-S7-C1..C6).
  intentoNoEncontrado: "INTENTO_NO_ENCONTRADO",
  bloqueNoEvaluable: "BLOQUE_NO_EVALUABLE",
  bloqueSinSkillMedida: "BLOQUE_SIN_SKILL_MEDIDA",
  conflictAsignacionCerrada: "CONFLICT_ASIGNACION_CERRADA",
  tipoBloqueNoSoportadoMvp: "TIPO_BLOQUE_NO_SOPORTADO_MVP",
  conflictIntentoYaInvalidado: "CONFLICT_INTENTO_YA_INVALIDADO",
  contenidoBloqueInvalido: "CONTENIDO_BLOQUE_INVALIDO",
  // Transversal P8a (D-S8-A1..F2).
  transversalNoEncontrado: "TRANSVERSAL_NO_ENCONTRADO",
  intentoTransversalNoEncontrado: "INTENTO_TRANSVERSAL_NO_ENCONTRADO",
  conflictTransversalNoDisponible: "CONFLICT_TRANSVERSAL_NO_DISPONIBLE",
  conflictCursoEstadoInvalido: "CONFLICT_CURSO_ESTADO_INVALIDO",
  conflictAsignacionEstadoInvalido: "CONFLICT_ASIGNACION_ESTADO_INVALIDO",
  conflictSkillsTransversalInvalidas: "CONFLICT_SKILLS_TRANSVERSAL_INVALIDAS",
  // Transversal P8b (D-S8-B7, D-S8-C4, D-S8-C7).
  conflictIntentoTransversalNoEditable: "CONFLICT_INTENTO_TRANSVERSAL_NO_EDITABLE",
  conflictIntentoTransversalNoEvaluado: "CONFLICT_INTENTO_TRANSVERSAL_NO_EVALUADO",
  conflictIntentoTransversalYaAnulado: "CONFLICT_INTENTO_TRANSVERSAL_YA_ANULADO",
  conflictCapaInactiva: "CONFLICT_CAPA_INACTIVA",
  puntajesFaltantes: "PUNTAJES_FALTANTES",
  // Integracion IA P8b (D-S8-B7, R-S8-2, R-S8-6, R-S8-10).
  iaTemporalmenteSaturada: "IA_TEMPORALMENTE_SATURADA",
  iaNoDisponible: "IA_NO_DISPONIBLE",
  iaCredencialesInvalidas: "IA_CREDENCIALES_INVALIDAS",
  iaRespuestaMalformada: "IA_RESPUESTA_MALFORMADA",
  repoNoAccesible: "REPO_NO_ACCESIBLE",
  // Entrevista IA P8c (D-S8-D1..D6, D89).
  entrevistaIaNoEncontrada: "ENTREVISTA_IA_NO_ENCONTRADA",
  intentoEntrevistaNoEncontrado: "INTENTO_ENTREVISTA_NO_ENCONTRADO",
  conflictIntentoEntrevistaEnCurso: "CONFLICT_INTENTO_ENTREVISTA_EN_CURSO",
  conflictIntentoEntrevistaCerrado: "CONFLICT_INTENTO_ENTREVISTA_CERRADO",
  conflictIntentoEntrevistaNoFinalizado: "CONFLICT_INTENTO_ENTREVISTA_NO_FINALIZADO",
  conflictIntentoEntrevistaYaAnulado: "CONFLICT_INTENTO_ENTREVISTA_YA_ANULADO",
  planIncompletoParaEntrevista: "PLAN_INCOMPLETO_PARA_ENTREVISTA",
  planVacioParaEntrevista: "PLAN_VACIO_PARA_ENTREVISTA",
  entrevistaIaTransversalNoAprobado: "ENTREVISTA_IA_TRANSVERSAL_NO_APROBADO",
  entrevistaIaFechaNoAlcanzada: "ENTREVISTA_IA_FECHA_NO_ALCANZADA",
  entrevistaIaNoConfigurada: "ENTREVISTA_IA_NO_CONFIGURADA",
  rubricaNoConfigurada: "RUBRICA_NO_CONFIGURADA",
  rateLimitEntrevistaIa: "RATE_LIMIT_ENTREVISTA_IA",
  // Notificaciones P10b — inbox + preferencias (D-S10-C7, §19.3 punto 1).
  notificacionNoEncontrada: "NOTIFICACION_NO_ENCONTRADA",
  validacionTipoCriticoNoSilenciable: "VALIDACION_TIPO_CRITICO_NO_SILENCIABLE",
  validacionTipoEnSilenciarYDesilenciar: "VALIDACION_TIPO_EN_SILENCIAR_Y_DESILENCIAR",
  // Cierre curso P11a (D-S11-A2..A5).
  validacionDecisionFaltante: "VALIDACION_DECISION_FALTANTE",
  conflictCursoFueraVentana7Dias: "CONFLICT_CURSO_FUERA_VENTANA_7_DIAS",
  // Resumen cierre para el participante (B-26). Codes especificos por rama del
  // 409 en `GET /me/cursos/:cursoId/resumen-cierre`, asi el frontend distingue
  // "redirigir a vista activa" (cursoNoCerrado) de "mostrar mensaje en sitio"
  // (snapshot ausente / legacy / sin veredicto).
  snapshotCierreNoDisponible: "SNAPSHOT_CIERRE_NO_DISPONIBLE",
  snapshotCierreFormatoNoSoportado: "SNAPSHOT_CIERRE_FORMATO_NO_SOPORTADO",
  veredictoCierreNoDisponible: "VEREDICTO_CIERRE_NO_DISPONIBLE",
  // Reportes P11b operativos (D-S11-B7, P11b §2 alcance).
  fotografiaNoEncontrada: "FOTOGRAFIA_NO_ENCONTRADA",
  vistaNoSoportada: "VISTA_NO_SOPORTADA",
  formatoNoSoportadoEnP11b: "FORMATO_NO_SOPORTADO_EN_P11B",
  asignacionColaboradorNoCoincide: "ASIGNACION_COLABORADOR_NO_COINCIDE",
  // Reportes P11c estrategicos + autoservicio (D-S11-C1..C11).
  formatoExportNoSoportado: "FORMATO_EXPORT_NO_SOPORTADO",
  // Auditoria P12 — visor admin (D-S12-A5).
  filtroDemasiadoAmplio: "FILTRO_DEMASIADO_AMPLIO",
} as const

export type ApiErrorCode = (typeof apiErrorCodes)[keyof typeof apiErrorCodes]
