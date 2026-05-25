import type { AuditoriaResumen, Paginated } from "@nexott-learn/shared-types"
import { type MockHandler, defineRoute } from "./router"

const RTE_AUDITORIA = /^\/admin\/auditoria(\?.*)?$/

const RESPUESTA_VACIA: Paginated<AuditoriaResumen> = {
  data: [],
  meta: { page: 1, pageSize: 10, total: 0, totalPages: 0 },
}

const listarAuditoriaHandler: MockHandler = () => RESPUESTA_VACIA

export const handlersAdmin = [defineRoute("GET", RTE_AUDITORIA, listarAuditoriaHandler)]
