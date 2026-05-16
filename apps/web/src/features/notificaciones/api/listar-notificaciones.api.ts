import { httpClient } from "@/shared/api/http-client"
import type {
  ListarNotificacionesQuery,
  NotificacionResumen,
  Paginated,
} from "@nexott-learn/shared-types"

export function listarNotificaciones(
  filtros?: Partial<ListarNotificacionesQuery>,
): Promise<Paginated<NotificacionResumen>> {
  const params = new URLSearchParams()
  if (filtros?.page !== undefined) {
    params.set("page", String(filtros.page))
  }
  if (filtros?.pageSize !== undefined) {
    params.set("pageSize", String(filtros.pageSize))
  }
  if (filtros?.leida !== undefined) {
    params.set("leida", String(filtros.leida))
  }
  if (filtros?.archivada !== undefined) {
    params.set("archivada", String(filtros.archivada))
  }
  if (filtros?.sort !== undefined) {
    params.set("sort", filtros.sort)
  }
  const qs = params.toString()
  return httpClient.get<Paginated<NotificacionResumen>>(`/notificaciones${qs ? `?${qs}` : ""}`)
}
