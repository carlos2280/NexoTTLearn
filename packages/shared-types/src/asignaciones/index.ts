export {
  rolAsignacionSchema,
  origenVoluntarioSchema,
  estadoAsignadoSchema,
  estadoVoluntarioSchema,
  resultadoEntrevistaClienteSchema,
  motivoRechazoAsignacionSchema,
} from "./asignacion.types"
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
} from "./asignacion.types"

export { crearAsignacionesBatchRequestSchema } from "./crear.schema"
export type { CrearAsignacionesBatchRequest } from "./crear.schema"

export { autoInscripcionRequestSchema } from "./auto-inscripcion.schema"
export type { AutoInscripcionRequest } from "./auto-inscripcion.schema"

export { listarAsignacionesQuerySchema } from "./listar.schema"
export type { ListarAsignacionesQuery } from "./listar.schema"

export {
  cerrarCasoAsignadoSchema,
  cerrarCasoVoluntarioSchema,
  reabrirRetirarBodySchema,
} from "./transiciones.schema"
export type {
  CerrarCasoAsignadoRequest,
  CerrarCasoVoluntarioRequest,
  ReabrirRetirarBody,
  CondicionesListoFaltante,
} from "./transiciones.schema"

export { patchResultadoEntrevistaRequestSchema } from "./resultado-entrevista.schema"
export type { PatchResultadoEntrevistaRequest } from "./resultado-entrevista.schema"

export { listarColaboradoresDisponiblesQuerySchema } from "./colaboradores-disponibles.schema"
export type {
  ListarColaboradoresDisponiblesQuery,
  ColaboradorDisponible,
} from "./colaboradores-disponibles.schema"
