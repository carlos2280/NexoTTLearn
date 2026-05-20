export { rolUsuarioSchema, perfilSesionSchema, AVISO_VIGENTE_VERSION } from "./auth/perfil.schema"
export type { RolUsuario, PerfilSesion } from "./auth/perfil.schema"
export {
  loginSchema,
  loginResponseSchema,
  mfaVerifyResponseSchema,
} from "./auth/login.schema"
export type { LoginInput, LoginResponse, MfaVerifyResponse } from "./auth/login.schema"
export { cambiarPasswordSchema } from "./auth/cambiar-password.schema"
export type { CambiarPasswordInput } from "./auth/cambiar-password.schema"
export { aceptarAvisoPrivacidadSchema } from "./auth/aceptar-aviso.schema"
export type { AceptarAvisoPrivacidadInput } from "./auth/aceptar-aviso.schema"
export { crearColaboradorSchema } from "./auth/crear-colaborador.schema"
export type { CrearColaboradorInput } from "./auth/crear-colaborador.schema"
export { regenerarPasswordInicialSchema } from "./auth/regenerar-password.schema"
export type { RegenerarPasswordInicialInput } from "./auth/regenerar-password.schema"
export { desbloquearSchema } from "./auth/desbloquear.schema"
export type { DesbloquearInput } from "./auth/desbloquear.schema"
export { mfaEnableSchema } from "./auth/mfa-enable.schema"
export type { MfaEnableInput } from "./auth/mfa-enable.schema"
export type { MfaSetupResponse } from "./auth/mfa-setup.types"
export { mfaVerifySchema } from "./auth/mfa-verify.schema"
export type { MfaVerifyInput } from "./auth/mfa-verify.schema"
export { mfaDisableSchema } from "./auth/mfa-disable.schema"
export type { MfaDisableInput } from "./auth/mfa-disable.schema"

// Catalogo P2 — schemas y tipos de respuesta para los 6 recursos del catalogo formativo.
export { paginacionQuerySchema, booleanQuerySchema } from "./catalogo/paginacion"
export type { PaginacionQuery, Paginated } from "./catalogo/paginacion"
export { listarAreasQuerySchema } from "./catalogo/areas/listar-areas.schema"
export type { ListarAreasQuery } from "./catalogo/areas/listar-areas.schema"
export type { AreaResponse } from "./catalogo/areas/area-response"
export { AREA_CODIGOS, areaCodigoSchema } from "./catalogo/areas/area-codigo"
export type { AreaCodigo } from "./catalogo/areas/area-codigo"
export { crearAreaSchema, actualizarAreaSchema } from "./catalogo/areas/area.schema"
export type { CrearAreaInput, ActualizarAreaInput } from "./catalogo/areas/area.schema"
export { listarSkillsQuerySchema, estadoSkillSchema } from "./catalogo/skills/listar-skills.schema"
export type { ListarSkillsQuery, EstadoSkill } from "./catalogo/skills/listar-skills.schema"
export type { SkillResponse, FusionSkillsResponse } from "./catalogo/skills/skill-response"
export {
  crearSkillSchema,
  renombrarSkillSchema,
  skillDuplicadaCandidataSchema,
  cambiarAreaSkillSchema,
  fusionarSkillsSchema,
} from "./catalogo/skills/skill.schema"
export type {
  CrearSkillInput,
  RenombrarSkillInput,
  SkillDuplicadaCandidata,
  CambiarAreaSkillInput,
  FusionarSkillsInput,
  ImpactoCambioAreaSkill,
  PreviewCambioAreaResponse,
  ReferenciasMigradasFusion,
} from "./catalogo/skills/skill.schema"
export {
  listarModulosQuerySchema,
  estadoModuloSchema,
} from "./catalogo/modulos/listar-modulos.schema"
export type { ListarModulosQuery, EstadoModulo } from "./catalogo/modulos/listar-modulos.schema"
export type { ModuloResponse } from "./catalogo/modulos/modulo-response"
export { crearModuloSchema, actualizarModuloSchema } from "./catalogo/modulos/modulo.schema"
export type {
  CrearModuloInput,
  ActualizarModuloInput,
  CursoActivoAfectado,
  SkillHuerfana,
  PreviewImpactoArchivoModulo,
} from "./catalogo/modulos/modulo.schema"
export { listarSeccionesQuerySchema } from "./catalogo/secciones/listar-secciones.schema"
export type { ListarSeccionesQuery } from "./catalogo/secciones/listar-secciones.schema"
export type { SeccionResponse } from "./catalogo/secciones/seccion-response"
export {
  crearSeccionSchema,
  actualizarSeccionSchema,
  reordenarSeccionesSchema,
} from "./catalogo/secciones/seccion.schema"
export type {
  CrearSeccionInput,
  ActualizarSeccionInput,
  ReordenarSeccionesInput,
} from "./catalogo/secciones/seccion.schema"
export {
  listarBloquesQuerySchema,
  tipoBloqueSchema,
  estadoBloqueSchema,
} from "./catalogo/bloques/listar-bloques.schema"
export type {
  ListarBloquesQuery,
  TipoBloque,
  EstadoBloque,
} from "./catalogo/bloques/listar-bloques.schema"
export type { BloqueResponse, BloqueDetalleResponse } from "./catalogo/bloques/bloque-response"
export {
  crearBloqueSchema,
  patchBloqueSchema,
  reordenarBloquesSchema,
  tipoEdicionBloqueSchema,
} from "./catalogo/bloques/bloque.schema"
export type {
  CrearBloqueInput,
  PatchBloqueInput,
  ReordenarBloquesInput,
  TipoEdicionBloque,
  ColaboradorAfectadoBloque,
  PreviewImpactoEliminarBloque,
} from "./catalogo/bloques/bloque.schema"
// Contenido por tipo de bloque — schemas Zod de `Bloque.contenido` (jsonb).
// Fuente unica de verdad usada por editor, backend (validacion al crear/editar)
// y motor de autocorreccion. Los evaluables se re-exportan desde aqui para que
// el llamante tenga un solo punto de entrada.
export {
  contenidoParrafoSchema,
  contenidoTipSchema,
  varianteTipSchema,
  contenidoCodigoIlustrativoSchema,
  contenidoVideoSchema,
  proveedorVideoSchema,
  contenidoRecursoSchema,
  subtipoRecursoSchema,
  contenidoBloquePorTipo,
  schemaContenidoBloquePorTipo,
  validarContenidoBloque,
} from "./catalogo/bloques/contenido"
export type {
  ContenidoParrafo,
  ContenidoTip,
  VarianteTip,
  ContenidoCodigoIlustrativo,
  ContenidoVideo,
  ProveedorVideo,
  ContenidoRecurso,
  SubtipoRecurso,
} from "./catalogo/bloques/contenido"
export { listarClientesQuerySchema } from "./catalogo/clientes/listar-clientes.schema"
export type { ListarClientesQuery } from "./catalogo/clientes/listar-clientes.schema"
export type {
  ClienteResponse,
  ClienteDetalleResponse,
} from "./catalogo/clientes/cliente-response"
export { crearClienteSchema, actualizarClienteSchema } from "./catalogo/clientes/cliente.schema"
export type { CrearClienteInput, ActualizarClienteInput } from "./catalogo/clientes/cliente.schema"

// Cursos P4a — CRUD, lifecycle BORRADOR/ARCHIVADO/CERRADO, duplicar, log-cambios.
export {
  estadoCursoSchema,
  desbloqueoCursoSchema,
  accionLogCursoSchema,
} from "./cursos/curso.types"
export type {
  EstadoCurso,
  DesbloqueoCurso,
  AccionLogCurso,
  CursoResumen,
  CursoDetalle,
  CursoAreaExigida,
  CursoSkillExigida,
  CursoModuloHabilitado,
  LogCambioCurso,
  DuplicarCursoResponse,
  CursoConfiguracionResponse,
} from "./cursos/curso.types"
export type { EvaluacionesDisponibles } from "./cursos/evaluaciones-disponibles.types"
export type {
  BloqueEvaluableAdminItem,
  BloqueEvaluableStats,
  BloqueEvaluableColaboradorItem,
  BloqueEvaluableDetalleResponse,
} from "./cursos/bloques-evaluables-admin.types"
export { crearCursoSchema } from "./cursos/crear-curso.schema"
export type { CrearCursoInput } from "./cursos/crear-curso.schema"
export { actualizarCursoSchema } from "./cursos/actualizar-curso.schema"
export type { ActualizarCursoInput } from "./cursos/actualizar-curso.schema"
export { listarCursosQuerySchema } from "./cursos/listar-cursos.query.schema"
export type { ListarCursosQuery } from "./cursos/listar-cursos.query.schema"
export { duplicarCursoSchema } from "./cursos/duplicar-curso.schema"
export type { DuplicarCursoInput } from "./cursos/duplicar-curso.schema"
export {
  accionCierreAsignacionSchema,
  cerrarCursoSchema,
} from "./cursos/cerrar-curso.schema"
export type {
  AccionCierreAsignacion,
  CerrarCursoInput,
} from "./cursos/cerrar-curso.schema"
export { listarLogCambiosQuerySchema } from "./cursos/log-cambios.query.schema"
export type { ListarLogCambiosQuery } from "./cursos/log-cambios.query.schema"

// Cursos P4b — configuracion (areas, skills exigidas, modulos habilitados,
// pesos, umbrales de logro, transversal, entrevista IA).
export { actualizarAreasCursoSchema } from "./cursos/actualizar-areas-curso.schema"
export type { ActualizarAreasCursoInput } from "./cursos/actualizar-areas-curso.schema"
export { actualizarSkillsExigidasCursoSchema } from "./cursos/actualizar-skills-exigidas-curso.schema"
export type { ActualizarSkillsExigidasCursoInput } from "./cursos/actualizar-skills-exigidas-curso.schema"
export { actualizarModulosHabilitadosCursoSchema } from "./cursos/actualizar-modulos-habilitados-curso.schema"
export type {
  ActualizarModulosHabilitadosCursoInput,
  SkillSinCobertura,
} from "./cursos/actualizar-modulos-habilitados-curso.schema"
export { actualizarPesosCursoSchema } from "./cursos/actualizar-pesos-curso.schema"
export type { ActualizarPesosCursoInput } from "./cursos/actualizar-pesos-curso.schema"
export { actualizarUmbralesLogroCursoSchema } from "./cursos/actualizar-umbrales-logro-curso.schema"
export type {
  ActualizarUmbralesLogroCursoInput,
  UmbralesLogroValores,
} from "./cursos/actualizar-umbrales-logro-curso.schema"
export { actualizarTransversalCursoSchema } from "./cursos/actualizar-transversal-curso.schema"
export type { ActualizarTransversalCursoInput } from "./cursos/actualizar-transversal-curso.schema"
export {
  actualizarEntrevistaIaCursoSchema,
  filosofiaEntrevistaSchema,
  profundidadEntrevistaSchema,
  tonoEntrevistaSchema,
} from "./cursos/actualizar-entrevista-ia-curso.schema"
export type {
  ActualizarEntrevistaIaCursoInput,
  FilosofiaEntrevista,
  ProfundidadEntrevista,
  TonoEntrevista,
} from "./cursos/actualizar-entrevista-ia-curso.schema"

// Evaluacion inicial — Slice 5 P5a: tipos de la ficha de skills y su historico.
export { origenNotaSkillSchema } from "./evaluacion-inicial/ficha.schema"
export type {
  OrigenNotaSkill,
  NivelCualitativoArea,
  FichaSkillItem,
  FichaSkillCatalogoItem,
  FichaPorAreaItem,
  FichaResponse,
  EntradaHistoricoNotaSkill,
  EventoHistorialFicha,
} from "./evaluacion-inicial/ficha.schema"
// Evaluacion inicial — Slice 5 P5b: respuesta del preview (D-EVI-2/6/8).
export type {
  FuenteCambioPreview,
  PreviewResumen,
  PreviewCambioItem,
  PreviewErrorCelda,
  PreviewRechazoItem,
  PreviewResponse,
} from "./evaluacion-inicial/preview.schema"
// Schemas Zod para validar resumen/cambios/rechazos antes de persistir Json
// (FIX-P5b-alineacion §5.60).
export {
  fuenteCambioPreviewSchema,
  previewResumenSchema,
  previewCambioItemSchema,
  previewErrorCeldaSchema,
  previewRechazoItemSchema,
  previewCambiosArraySchema,
  previewRechazosArraySchema,
} from "./evaluacion-inicial/preview.schema"

// Evaluacion inicial — Slice 5 P5c: aplicar idempotente + edicion manual + historial.
export { aplicarRequestSchema, aplicarResponseSchema } from "./evaluacion-inicial/aplicar.schema"
export type { AplicarRequest, AplicarResponse } from "./evaluacion-inicial/aplicar.schema"
export {
  patchSkillRequestSchema,
  patchSkillResponseSchema,
} from "./evaluacion-inicial/edicion-manual.schema"
export type {
  PatchSkillRequest,
  PatchSkillResponse,
} from "./evaluacion-inicial/edicion-manual.schema"
export type { CargaEvaluacionInicialResumen } from "./evaluacion-inicial/historial.schema"

// Asignaciones — Slice 6 P6a: foundation + altas (listados, alta admin batch,
// conversion voluntario→asignado, auto-inscripcion, bandeja voluntario).
export {
  rolAsignacionSchema,
  origenVoluntarioSchema,
  estadoAsignadoSchema,
  estadoVoluntarioSchema,
  resultadoEntrevistaClienteSchema,
  motivoRechazoAsignacionSchema,
  crearAsignacionesBatchRequestSchema,
  autoInscripcionRequestSchema,
  listarAsignacionesQuerySchema,
  cerrarCasoAsignadoSchema,
  cerrarCasoVoluntarioSchema,
  reabrirRetirarBodySchema,
  patchResultadoEntrevistaRequestSchema,
} from "./asignaciones"

// Plan personal — Slice 7 P7a (D-S7-B3, D-S7-D2).
export {
  estadoBrechaSnapshotSchema,
  origenSnapshotSchema,
  skillSnapshotItemSchema,
  fichaSnapshotV1Schema,
} from "./plan-personal"
export type {
  EstadoBrechaSnapshot,
  OrigenSnapshot,
  SkillSnapshotItem,
  FichaSnapshotV1,
  CaracterItemPlan,
  RazonItemPlan,
  PlanAvanceBloques,
  PlanAvance,
  SeccionPlanItemAdmin,
  SeccionPlanItemParticipante,
  ModuloPlanAdmin,
  ModuloPlanParticipante,
  PlanResponseAdmin,
  PlanResponseParticipante,
  PlanResponse,
} from "./plan-personal"
// Plan personal — Slice 7 P7c: ajustes manuales + diff + apertura seccion.
export {
  ajustarPlanSchema,
  accionAjustarPlanSchema,
  caracterAjustePlanSchema,
} from "./plan-personal"
export type {
  AjustarPlanInput,
  AccionAjustarPlan,
  CaracterAjustePlan,
  ImpactoDiffSkill,
  ImpactoSeccionDiff,
  DiffSeccionAfectada,
  DiffSkillItem,
  PlanDiffResponse,
  AperturaSeccionResponse,
} from "./plan-personal"
export type {
  RolAsignacion,
  OrigenVoluntario,
  EstadoAsignado,
  EstadoVoluntario,
  ResultadoEntrevistaCliente,
  Asignacion,
  AsignacionDetallada,
  AsignacionColaboradorEmbed,
  AsignacionHistoricoEntrada,
  AsignacionRechazada,
  MotivoRechazoAsignacion,
  CrearAsignacionesBatchResponse,
  CursoDisponibleVoluntario,
  AreaTagEmbed,
  SkillDestacadaEmbed,
  CrearAsignacionesBatchRequest,
  AutoInscripcionRequest,
  ListarAsignacionesQuery,
  CerrarCasoAsignadoRequest,
  CerrarCasoVoluntarioRequest,
  ReabrirRetirarBody,
  CondicionesListoFaltante,
  PatchResultadoEntrevistaRequest,
} from "./asignaciones"

// Intentos de bloque — Slice 7 P7b (D-S7-C1..C6) + codigo (CODIGO_PREGUNTAS).
export {
  contenidoQuizSchema,
  preguntaQuizSchema,
  tipoPreguntaQuizSchema,
  contenidoCodigoPreguntasSchema,
  contenidoCodigoTestsSchema,
  testStdinStdoutSchema,
  lenguajeEjecutableSchema,
  crearIntentoBloqueSchema,
  respuestaPreguntaSchema,
  respuestasIntentoSchema,
  resultadoTestReportadoSchema,
  intentoBloqueResponseSchema,
  listarIntentosBloqueQuerySchema,
  listarIntentosCursoBloqueQuerySchema,
} from "./intentos-bloque"
export type {
  ContenidoQuiz,
  PreguntaQuiz,
  PreguntaOpcionUnica,
  PreguntaOpcionMultiple,
  PreguntaVerdaderoFalso,
  PreguntaRespuestaCorta,
  OpcionQuiz,
  TipoPreguntaQuiz,
  SolucionVisible,
  NormalizacionRespuestaCorta,
  ContenidoCodigoPreguntas,
  ContenidoCodigoTests,
  TestStdinStdout,
  LenguajeEjecutable,
  CrearIntentoBloqueInput,
  RespuestaPregunta,
  RespuestasIntento,
  ResultadoTestReportado,
  IntentoBloqueResponse,
  ListarIntentosBloqueQuery,
  ListarIntentosCursoBloqueQuery,
} from "./intentos-bloque"

// Transversal — Slice 8 P8a + P8b (D-S8-A1..F2, D-S8-B7, D-S8-C4..C7).
export {
  estadoIntentoTransversalSchema,
  razonDisponibilidadTransversalSchema,
  transversalResponseSchema,
  disponibilidadTransversalResponseSchema,
  crearIntentoTransversalResponseSchema,
  repoOArtefactoSchema,
  intentoTransversalBaseSchema,
  intentoTransversalParticipanteResponseSchema,
  intentoTransversalAdminResponseSchema,
  listarIntentosTransversalQuerySchema,
  crearIntentoTransversalSchema,
  editarSkillsTransversalSchema,
  editarSkillsTransversalResponseSchema,
  cargarCapaTestsSchema,
  cargarCapaCualitativaSchema,
  cargarCapaComprensionSchema,
  finalizarTransversalBodySchema,
  anularTransversalBodySchema,
  finalizarTransversalResponseSchema,
  anularTransversalResponseSchema,
  listarIntentosTransversalCursoQuerySchema,
  intentoTransversalListadoItemSchema,
} from "./transversal"
export type {
  EstadoIntentoTransversal,
  RazonDisponibilidadTransversal,
  TransversalResponse,
  DisponibilidadTransversalResponse,
  CrearIntentoTransversalResponse,
  RepoOArtefacto,
  IntentoTransversalBase,
  IntentoTransversalParticipanteResponse,
  IntentoTransversalAdminResponse,
  ListarIntentosTransversalQuery,
  CrearIntentoTransversalInput,
  EditarSkillsTransversalInput,
  EditarSkillsTransversalResponse,
  CargarCapaTestsInput,
  CargarCapaCualitativaInput,
  CargarCapaComprensionInput,
  FinalizarTransversalBodyInput,
  AnularTransversalBodyInput,
  FinalizarTransversalResponse,
  AnularTransversalResponse,
  ListarIntentosTransversalCursoQuery,
  IntentoTransversalListadoItem,
} from "./transversal"

// Notificaciones P10b — inbox + preferencias (D-S10-C3..C7).
export {
  TIPOS_EVENTO_NOTIF,
  TIPOS_CRITICOS_NOTIF,
  CANALES_NOTIF,
  listarNotificacionesQuerySchema,
  patchPreferenciasNotificacionSchema,
} from "./notificaciones"
export type {
  TipoEventoNotif,
  CanalNotif,
  NotificacionResumen,
  NotificacionResponse,
  NotificacionBadgeResponse,
  PreferenciasNotificacionResponse,
  ListarNotificacionesQuery,
  PatchPreferenciasNotificacionInput,
} from "./notificaciones"

// Reportes P11b — operativos tiempo real (D-S11-B1..B11).
// Reportes P11c — estrategicos cache + autoservicio + export (D-S11-C1..C11).
export {
  TIPOS_ALERTA,
  esTipoAlerta,
  filtrosEstandarSchema,
  avanceCursoQuerySchema,
  detalleColaboradorQuerySchema,
  brechasDetectadasQuerySchema,
  centroRevisionQuerySchema,
  eficaciaPlataformaQuerySchema,
  historicoClienteQuerySchema,
  inventarioSkillsQuerySchema,
  reutilizacionCatalogoQuerySchema,
  coberturaCursoQuerySchema,
  coberturaAreasQuerySchema,
} from "./reportes"
export type {
  TipoAlerta,
  VistaReporte,
  FiltrosEstandar,
  AvanceCursoQuery,
  DetalleColaboradorQuery,
  BrechasDetectadasQuery,
  CentroRevisionQuery,
  EficaciaPlataformaQuery,
  HistoricoClienteQuery,
  InventarioSkillsQuery,
  ReutilizacionCatalogoQuery,
  ColaboradorEmbed,
  FilaAvanceCurso,
  EventoHistorico,
  ItemPlanReporte,
  FichaRelevanteItem,
  IntentoBloqueResumen,
  IntentoTransversalResumen,
  IntentoEntrevistaIaResumen,
  DetalleColaboradorAsignacion,
  UltimosIntentos,
  HayMasIntentos,
  DetalleColaboradorResponse,
  UmbralesBrechas,
  SkillBrechaItem,
  BrechasDetectadasResponse,
  MotivoRevisionTransversal,
  MotivoRevisionEntrevistaIa,
  FilaCentroRevisionTransversal,
  FilaCentroRevisionEntrevistaIa,
  CentroRevisionResponse,
  MetaEstrategico,
  EficaciaPlataformaAptos,
  EficaciaPlataformaNoAptos,
  ObservacionFrecuente,
  EficaciaPlataformaResponse,
  HistoricoClienteCursoItem,
  HistoricoClienteResponse,
  InventarioSkillsConteoCualitativo,
  InventarioSkillItem,
  InventarioSkillsResponse,
  ReutilizacionCatalogoModuloItem,
  ReutilizacionCatalogoSkillItem,
  ReutilizacionCatalogoResponse,
  EtiquetaCualitativa,
  ClaseColorSkill,
  MeAvancePorSkill,
  MeAvanceSiguienteSeccion,
  MeAvanceCursoResponse,
  NivelCaminoHaciaAptoArea,
  CaminoHaciaAptoPorArea,
  CaminoHaciaApto,
  ResultadoCierreCurso,
  SkillCosechadaCierre,
  AreaPorTrabajarCierre,
  ResumenCierreCurso,
  CoberturaCursoQuery,
  CoberturaSkillExigida,
  CoberturaNotaColaboradorSkill,
  CoberturaColaboradorItem,
  CoberturaResumenAgregado,
  CoberturaCursoResponse,
  CoberturaAreasQuery,
  CoberturaAreaConteoNiveles,
  CoberturaAreaItem,
  CoberturaAreaKpis,
  CoberturaTopColaborador,
  CoberturaListosParaPresentar,
  CoberturaAreasResponse,
} from "./reportes"

// Entrevista IA P8c — schemas y tipos del flujo de entrevista IA final (D89).
export {
  enviarTurnoSchema,
  enviarTurnoResponseSchema,
  ajustarEntrevistaBodySchema,
  anularEntrevistaBodySchema,
  finalizarEntrevistaBodySchema,
  snapshotSeccionesBaseV1Schema,
  rubricaSnapshotV1Schema,
  tipoBloqueSnapshotSchema,
  estadoIntentoEntrevistaIaSchema,
  razonDisponibilidadEntrevistaIaSchema,
  entrevistaIaResponseSchema,
  disponibilidadEntrevistaIaResponseSchema,
  crearIntentoEntrevistaIaResponseSchema,
  intentoEntrevistaIaBaseSchema,
  intentoEntrevistaIaParticipanteResponseSchema,
  intentoEntrevistaIaAdminResponseSchema,
  reporteEvaluadorEntrevistaIaSchema,
  listarIntentosEntrevistaIaQuerySchema,
  finalizarEntrevistaResponseSchema,
  ajustarEntrevistaResponseSchema,
  anularEntrevistaResponseSchema,
  listarIntentosEntrevistaIaCursoQuerySchema,
  intentoEntrevistaIaListadoItemSchema,
} from "./entrevista-ia"
export type {
  EnviarTurnoInput,
  EnviarTurnoResponse,
  AjustarEntrevistaBodyInput,
  AnularEntrevistaBodyInput,
  FinalizarEntrevistaBodyInput,
  SnapshotSeccionesBaseV1,
  RubricaSnapshotV1,
  TipoBloqueSnapshot,
  EstadoIntentoEntrevistaIa,
  RazonDisponibilidadEntrevistaIa,
  EntrevistaIaResponse,
  DisponibilidadEntrevistaIaResponse,
  CrearIntentoEntrevistaIaResponse,
  IntentoEntrevistaIaBase,
  IntentoEntrevistaIaParticipanteResponse,
  IntentoEntrevistaIaAdminResponse,
  ReporteEvaluadorEntrevistaIa,
  ListarIntentosEntrevistaIaQuery,
  FinalizarEntrevistaResponse,
  AjustarEntrevistaResponse,
  AnularEntrevistaResponse,
  TurnoEntrevistaIa,
  ListarIntentosEntrevistaIaCursoQuery,
  IntentoEntrevistaIaListadoItem,
} from "./entrevista-ia"

// Colaboradores — endpoints autoservicio /me/* (FIX-pre-S12).
export {
  meCursosQuerySchema,
  exportarFichaQuerySchema,
  formatoExportFichaSchema,
  historialFichaQuerySchema,
} from "./colaboradores"
export type {
  MeCursoResumen,
  MeCursosQuery,
  ExportarFichaQuery,
  FormatoExportFicha,
  HistorialFichaQuery,
} from "./colaboradores"

// Colaboradores — arbol unificado de curso (modo asignado/voluntario/preview).
export type {
  ModoCursoParticipante,
  CursoArbolCabecera,
  CursoArbolSeccion,
  CursoArbolModulo,
  CursoArbolResponse,
} from "./colaboradores"

// Colaboradores — bandeja del participante (D-BANDEJA-1).
export {
  BANDEJA_TOP_NOVEDADES,
  BANDEJA_TOP_PENDIENTES,
  UMBRAL_ASIGNACION_NUEVA_HORAS,
  UMBRAL_DEADLINE_CERCANO_DIAS,
  UMBRAL_DEADLINE_CRITICO_AVANCE,
  UMBRAL_VENTANA_AVISOS_DIAS,
} from "./colaboradores"
export type {
  BandejaCursoPendiente,
  MeBandejaContadores,
  MeBandejaResponse,
  ResultadoCierreVisible,
  SiguienteAccion,
  SiguienteAccionAsignacionNueva,
  SiguienteAccionCasoReabierto,
  SiguienteAccionContinuarCurso,
  SiguienteAccionDeadlineCritico,
  SiguienteAccionEntrevistaIaDisponible,
  SiguienteAccionEsperandoRevision,
  SiguienteAccionExplorarVoluntariado,
  SiguienteAccionResultadoCierre,
  SiguienteAccionTransversalDisponible,
  TipoSiguienteAccion,
  TonoDeadline,
} from "./colaboradores"

// Colaboradores — admin: listar paginado + exportar para /admin/personas.
export {
  estadoEmpleadoSchema,
  listarColaboradoresQuerySchema,
  exportarColaboradoresQuerySchema,
  formatoExportColaboradoresSchema,
} from "./colaboradores"
export type {
  EstadoEmpleado,
  ListarColaboradoresQuery,
  ColaboradorAdminUsuarioInfo,
  ColaboradorAdminResumen,
  ExportarColaboradoresQuery,
  FormatoExportColaboradores,
} from "./colaboradores"

// Resumen cualitativo de ficha (widget "Tu camino" en bandeja participante).
export type {
  FichaResumenResponse,
  FichaResumenTopArea,
  NivelCualitativoAreaResumen,
} from "./colaboradores"

// Admin — Slice 12 P12: visor de auditoria (activity_logs).
export {
  ACCIONES_AUDITORIA,
  listarAuditoriaQuerySchema,
  exportarAuditoriaQuerySchema,
} from "./admin"
export type {
  AccionAuditoriaLiteral,
  AuditoriaResumen,
  ListarAuditoriaQuery,
  ExportarAuditoriaQuery,
} from "./admin"

// Admin — Slice futuro B foundation: 2 visores de logs especificos
// (log_cambios_curso + historico_estados_asignacion).
export {
  ACCIONES_LOG_CURSO,
  listarLogsCursosQuerySchema,
  listarLogsAsignacionesQuerySchema,
} from "./admin"
export type {
  AccionLogCursoLiteral,
  LogCambioCursoResumen,
  ListarLogsCursosQuery,
  HistoricoEstadoAsignacionResumen,
  ListarLogsAsignacionesQuery,
} from "./admin"

// Admin — Slice futuro B P-B-b: 4 visores adicionales
// (historico skills + historico modulos + ajustes plan + meta-auditoria).
export {
  TIPOS_EVENTO_LOG_SKILL,
  listarLogsSkillsQuerySchema,
  ESTADOS_LOG_MODULO,
  listarLogsModulosQuerySchema,
  ACCIONES_AJUSTE_PLAN,
  listarLogsAjustesPlanQuerySchema,
  listarLogsConsultasQuerySchema,
} from "./admin"
export type {
  TipoEventoLogSkill,
  LogSkillEventoResumen,
  ListarLogsSkillsQuery,
  EstadoLogModulo,
  LogModuloEstadoResumen,
  ListarLogsModulosQuery,
  AccionAjustePlanLiteral,
  LogAjustePlanResumen,
  ListarLogsAjustesPlanQuery,
  LogConsultaResumen,
  ListarLogsConsultasQuery,
} from "./admin"

// Admin — Slice futuro B P-B-c: 6 exportadores CSV/XLSX de los visores
// `/admin/logs/<dominio>`.
export {
  exportarLogsCursosQuerySchema,
  exportarLogsAsignacionesQuerySchema,
  exportarLogsSkillsQuerySchema,
  exportarLogsModulosQuerySchema,
  exportarLogsAjustesPlanQuerySchema,
  exportarLogsConsultasQuerySchema,
} from "./admin"
export type {
  ExportarLogsCursosQuery,
  ExportarLogsAsignacionesQuery,
  ExportarLogsSkillsQuery,
  ExportarLogsModulosQuery,
  ExportarLogsAjustesPlanQuery,
  ExportarLogsConsultasQuery,
} from "./admin"
