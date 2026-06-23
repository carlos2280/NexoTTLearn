import { httpClient } from "@/shared/api/http-client"
import type {
  CambiarRolResponse,
  ColaboradorAdminResumen,
  CrearColaboradorInput,
  FichaResponse,
  ListarColaboradoresQuery,
  Paginated,
  PatchSkillRequest,
  PatchSkillResponse,
  RolUsuario,
} from "@nexott-learn/shared-types"

interface AltaColaboradorResponse {
  readonly colaborador: {
    readonly id: string
    readonly email: string
    readonly nombre: string
    readonly estadoEmpleado: "ACTIVO" | "EX_EMPLEADO"
  }
  readonly usuario: {
    readonly id: string
    readonly rol: "ADMIN" | "PARTICIPANTE"
    readonly requiereCambioPassword: true
    readonly requiereSetupMfa: boolean
    readonly passwordInicialCaducaEn: string
  }
  readonly modoEntrega: "MANUAL"
  readonly passwordTemporal: string
}

function buildQueryString(query: ListarColaboradoresQuery): string {
  const params = new URLSearchParams()
  params.set("page", String(query.page))
  params.set("pageSize", String(query.pageSize))
  if (query.q && query.q.trim().length > 0) {
    params.set("q", query.q.trim())
  }
  if (query.rol) {
    params.set("rol", query.rol)
  }
  if (query.estadoEmpleado) {
    params.set("estadoEmpleado", query.estadoEmpleado)
  }
  if (query.bloqueado !== undefined) {
    params.set("bloqueado", String(query.bloqueado))
  }
  return `?${params.toString()}`
}

export function listarColaboradores(
  query: ListarColaboradoresQuery,
): Promise<Paginated<ColaboradorAdminResumen>> {
  return httpClient.get<Paginated<ColaboradorAdminResumen>>(
    `/colaboradores${buildQueryString(query)}`,
  )
}

export function crearColaborador(input: CrearColaboradorInput): Promise<AltaColaboradorResponse> {
  return httpClient.post<AltaColaboradorResponse>("/colaboradores", input)
}

export function obtenerFichaColaborador(colaboradorId: string): Promise<FichaResponse> {
  return httpClient.get<FichaResponse>(`/colaboradores/${colaboradorId}/ficha`)
}

export function editarNotaSkill(args: {
  readonly colaboradorId: string
  readonly skillId: string
  readonly input: PatchSkillRequest
  readonly motivo: string
}): Promise<PatchSkillResponse> {
  return httpClient.patch<PatchSkillResponse>(
    `/colaboradores/${args.colaboradorId}/ficha/skills/${args.skillId}`,
    args.input,
    { motivo: args.motivo },
  )
}

export function cambiarRolColaborador(args: {
  readonly colaboradorId: string
  readonly rol: RolUsuario
  readonly motivo: string
}): Promise<CambiarRolResponse> {
  return httpClient.patch<CambiarRolResponse>(
    `/colaboradores/${args.colaboradorId}/rol`,
    { rol: args.rol },
    { motivo: args.motivo },
  )
}

export type { AltaColaboradorResponse, CambiarRolResponse }
