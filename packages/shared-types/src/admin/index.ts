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
  exportarLogsCursosQuerySchema,
  listarLogsAsignacionesQuerySchema,
  exportarLogsAsignacionesQuerySchema,
  // P-B-b — 4 visores adicionales.
  TIPOS_EVENTO_LOG_SKILL,
  listarLogsSkillsQuerySchema,
  exportarLogsSkillsQuerySchema,
  ESTADOS_LOG_MODULO,
  listarLogsModulosQuerySchema,
  exportarLogsModulosQuerySchema,
  ACCIONES_AJUSTE_PLAN,
  listarLogsAjustesPlanQuerySchema,
  exportarLogsAjustesPlanQuerySchema,
  listarLogsConsultasQuerySchema,
  exportarLogsConsultasQuerySchema,
} from "./logs"
export type {
  AccionLogCursoLiteral,
  LogCambioCursoResumen,
  ListarLogsCursosQuery,
  ExportarLogsCursosQuery,
  HistoricoEstadoAsignacionResumen,
  ListarLogsAsignacionesQuery,
  ExportarLogsAsignacionesQuery,
  // P-B-b — 4 visores adicionales.
  TipoEventoLogSkill,
  LogSkillEventoResumen,
  ListarLogsSkillsQuery,
  ExportarLogsSkillsQuery,
  EstadoLogModulo,
  LogModuloEstadoResumen,
  ListarLogsModulosQuery,
  ExportarLogsModulosQuery,
  AccionAjustePlanLiteral,
  LogAjustePlanResumen,
  ListarLogsAjustesPlanQuery,
  ExportarLogsAjustesPlanQuery,
  LogConsultaResumen,
  ListarLogsConsultasQuery,
  ExportarLogsConsultasQuery,
} from "./logs"
