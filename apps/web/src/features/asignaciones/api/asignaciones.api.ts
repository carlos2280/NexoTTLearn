import { httpClient } from "@/shared/api/http-client"
import type {
  Asignacion,
  AsignacionDetallada,
  AsignacionHistoricoEntrada,
  AutoInscripcionRequest,
  CerrarCasoAsignadoRequest,
  CerrarCasoVoluntarioRequest,
  ColaboradorDisponible,
  CrearAsignacionesBatchRequest,
  CrearAsignacionesBatchResponse,
  CursoDisponibleVoluntario,
  ListarAsignacionesQuery,
  ListarColaboradoresDisponiblesQuery,
  PaginacionQuery,
  Paginated,
  PatchResultadoEntrevistaRequest,
} from "@nexott-learn/shared-types"

function pushIfDefined(params: URLSearchParams, key: string, value: string | undefined): void {
  if (value !== undefined && value !== "") {
    params.set(key, value)
  }
}

function buildListarQuery(query: ListarAsignacionesQuery): string {
  const params = new URLSearchParams()
  params.set("page", String(query.page))
  params.set("pageSize", String(query.pageSize))
  pushIfDefined(params, "rol", query.rol)
  pushIfDefined(params, "estado", query.estado)
  pushIfDefined(params, "q", query.q?.trim())
  return `?${params.toString()}`
}

function buildPaginacionQuery(query: PaginacionQuery): string {
  const params = new URLSearchParams()
  params.set("page", String(query.page))
  params.set("pageSize", String(query.pageSize))
  return `?${params.toString()}`
}

export function listarAsignacionesPorCurso(
  cursoId: string,
  query: ListarAsignacionesQuery,
): Promise<Paginated<Asignacion>> {
  return httpClient.get<Paginated<Asignacion>>(
    `/cursos/${cursoId}/asignaciones${buildListarQuery(query)}`,
  )
}

export function obtenerAsignacion(asignacionId: string): Promise<AsignacionDetallada> {
  return httpClient.get<AsignacionDetallada>(`/asignaciones/${asignacionId}`)
}

export function crearAsignacionesBatch(
  cursoId: string,
  input: CrearAsignacionesBatchRequest,
): Promise<CrearAsignacionesBatchResponse> {
  return httpClient.post<CrearAsignacionesBatchResponse>(`/cursos/${cursoId}/asignaciones`, input)
}

export function convertirAAsignado(asignacionId: string, motivo: string): Promise<Asignacion> {
  return httpClient.post<Asignacion>(
    `/asignaciones/${asignacionId}/convertir-a-asignado`,
    undefined,
    { motivo },
  )
}

export function iniciarProgresoAsignacion(asignacionId: string): Promise<Asignacion> {
  return httpClient.post<Asignacion>(`/asignaciones/${asignacionId}/iniciar-progreso`, {})
}

export function marcarListoAsignacion(asignacionId: string): Promise<Asignacion> {
  return httpClient.post<Asignacion>(`/asignaciones/${asignacionId}/marcar-listo`, {})
}

interface CerrarCasoArgs {
  readonly asignacionId: string
  readonly body: CerrarCasoAsignadoRequest | CerrarCasoVoluntarioRequest
  readonly idempotencyKey: string
  readonly motivo?: string
}

export function cerrarCasoAsignacion(args: CerrarCasoArgs): Promise<Asignacion> {
  return httpClient.post<Asignacion>(`/asignaciones/${args.asignacionId}/cerrar-caso`, args.body, {
    idempotencyKey: args.idempotencyKey,
    motivo: args.motivo,
  })
}

interface ReabrirCasoArgs {
  readonly asignacionId: string
  readonly motivo: string
  readonly idempotencyKey: string
}

export function reabrirCasoAsignacion(args: ReabrirCasoArgs): Promise<Asignacion> {
  return httpClient.post<Asignacion>(
    `/asignaciones/${args.asignacionId}/reabrir-caso`,
    {},
    {
      idempotencyKey: args.idempotencyKey,
      motivo: args.motivo,
    },
  )
}

export function retirarAsignacion(asignacionId: string, motivo: string): Promise<Asignacion> {
  return httpClient.post<Asignacion>(`/asignaciones/${asignacionId}/retirar`, {}, { motivo })
}

export function registrarResultadoEntrevistaCliente(
  asignacionId: string,
  input: PatchResultadoEntrevistaRequest,
): Promise<Asignacion> {
  return httpClient.patch<Asignacion>(
    `/asignaciones/${asignacionId}/resultado-entrevista-cliente`,
    input,
  )
}

export function listarHistoricoEstadosAsignacion(
  asignacionId: string,
  query: PaginacionQuery,
): Promise<Paginated<AsignacionHistoricoEntrada>> {
  return httpClient.get<Paginated<AsignacionHistoricoEntrada>>(
    `/asignaciones/${asignacionId}/historico-estados${buildPaginacionQuery(query)}`,
  )
}

export function listarCursosDisponiblesVoluntario(
  query: PaginacionQuery,
): Promise<Paginated<CursoDisponibleVoluntario>> {
  return httpClient.get<Paginated<CursoDisponibleVoluntario>>(
    `/cursos/disponibles-voluntario${buildPaginacionQuery(query)}`,
  )
}

export function autoInscribirseEnCurso(
  cursoId: string,
  input: AutoInscripcionRequest,
): Promise<Asignacion> {
  return httpClient.post<Asignacion>(`/cursos/${cursoId}/auto-inscripcion`, input)
}

function buildColaboradoresDisponiblesQuery(query: ListarColaboradoresDisponiblesQuery): string {
  const params = new URLSearchParams()
  params.set("page", String(query.page))
  params.set("pageSize", String(query.pageSize))
  pushIfDefined(params, "q", query.q?.trim())
  return `?${params.toString()}`
}

export function listarColaboradoresDisponibles(
  cursoId: string,
  query: ListarColaboradoresDisponiblesQuery,
): Promise<Paginated<ColaboradorDisponible>> {
  return httpClient.get<Paginated<ColaboradorDisponible>>(
    `/cursos/${cursoId}/colaboradores-disponibles${buildColaboradoresDisponiblesQuery(query)}`,
  )
}
