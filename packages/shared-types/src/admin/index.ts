export { ACCIONES_AUDITORIA } from "./auditoria.types"
export type { AccionAuditoriaLiteral, AuditoriaResumen } from "./auditoria.types"
export {
  listarAuditoriaQuerySchema,
  exportarAuditoriaQuerySchema,
} from "./auditoria.schema"
export type { ListarAuditoriaQuery, ExportarAuditoriaQuery } from "./auditoria.schema"

export {
  ACCIONES_LOG_CURSO,
  listarLogsCursosQuerySchema,
  listarLogsAsignacionesQuerySchema,
  // P-B-b — 4 visores adicionales.
  TIPOS_EVENTO_LOG_SKILL,
  listarLogsSkillsQuerySchema,
  ESTADOS_LOG_MODULO,
  listarLogsModulosQuerySchema,
  ACCIONES_AJUSTE_PLAN,
  listarLogsAjustesPlanQuerySchema,
  listarLogsConsultasQuerySchema,
} from "./logs"
export type {
  AccionLogCursoLiteral,
  LogCambioCursoResumen,
  ListarLogsCursosQuery,
  HistoricoEstadoAsignacionResumen,
  ListarLogsAsignacionesQuery,
  // P-B-b — 4 visores adicionales.
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
} from "./logs"
