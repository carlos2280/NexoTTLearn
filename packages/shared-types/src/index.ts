export { rolUsuarioSchema, perfilSesionSchema, AVISO_VIGENTE_VERSION } from "./auth/perfil.schema"
export type { RolUsuario, PerfilSesion } from "./auth/perfil.schema"
export { loginSchema, loginResponseSchema } from "./auth/login.schema"
export type { LoginInput, LoginResponse } from "./auth/login.schema"
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
export { mfaVerifySchema } from "./auth/mfa-verify.schema"
export type { MfaVerifyInput } from "./auth/mfa-verify.schema"
export { mfaDisableSchema } from "./auth/mfa-disable.schema"
export type { MfaDisableInput } from "./auth/mfa-disable.schema"

// Catalogo P2 — schemas y tipos de respuesta para los 6 recursos del catalogo formativo.
export { paginacionQuerySchema } from "./catalogo/paginacion"
export type { PaginacionQuery, Paginated } from "./catalogo/paginacion"
export { listarAreasQuerySchema } from "./catalogo/areas/listar-areas.schema"
export type { ListarAreasQuery } from "./catalogo/areas/listar-areas.schema"
export type { AreaResponse } from "./catalogo/areas/area-response"
export { crearAreaSchema, actualizarAreaSchema } from "./catalogo/areas/area.schema"
export type { CrearAreaInput, ActualizarAreaInput } from "./catalogo/areas/area.schema"
export { listarSkillsQuerySchema, estadoSkillSchema } from "./catalogo/skills/listar-skills.schema"
export type { ListarSkillsQuery, EstadoSkill } from "./catalogo/skills/listar-skills.schema"
export type { SkillResponse } from "./catalogo/skills/skill-response"
export {
  crearSkillSchema,
  renombrarSkillSchema,
  skillDuplicadaCandidataSchema,
} from "./catalogo/skills/skill.schema"
export type {
  CrearSkillInput,
  RenombrarSkillInput,
  SkillDuplicadaCandidata,
} from "./catalogo/skills/skill.schema"
export {
  listarModulosQuerySchema,
  estadoModuloSchema,
} from "./catalogo/modulos/listar-modulos.schema"
export type { ListarModulosQuery, EstadoModulo } from "./catalogo/modulos/listar-modulos.schema"
export type { ModuloResponse } from "./catalogo/modulos/modulo-response"
export { listarSeccionesQuerySchema } from "./catalogo/secciones/listar-secciones.schema"
export type { ListarSeccionesQuery } from "./catalogo/secciones/listar-secciones.schema"
export type { SeccionResponse } from "./catalogo/secciones/seccion-response"
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
export { listarClientesQuerySchema } from "./catalogo/clientes/listar-clientes.schema"
export type { ListarClientesQuery } from "./catalogo/clientes/listar-clientes.schema"
export type {
  ClienteResponse,
  ClienteDetalleResponse,
} from "./catalogo/clientes/cliente-response"
