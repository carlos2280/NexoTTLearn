import { ApiError } from "../api-error"
import { handlersAdmin } from "./handlers-admin"
import { handlersAuth } from "./handlers-auth"
import { handlersBloques } from "./handlers-bloques"
import { handlersCatalogo } from "./handlers-catalogo"
import { handlersParticipante } from "./handlers-participante"
import { handlersPersonas } from "./handlers-personas"
import { handlersReportes } from "./handlers-reportes"
import { handlersSecciones } from "./handlers-secciones"

export interface MockRequest {
  method: string
  path: string
  body?: unknown
  headers: Record<string, string>
}

export type MockHandler = (req: MockRequest) => Promise<unknown> | unknown

interface RouteEntry {
  method: string
  pattern: RegExp
  handler: MockHandler
}

const routes: RouteEntry[] = [
  ...handlersAuth,
  ...handlersCatalogo,
  ...handlersSecciones,
  ...handlersBloques,
  ...handlersReportes,
  ...handlersAdmin,
  ...handlersPersonas,
  ...handlersParticipante,
]

const MOCK_LATENCY_MS = 280

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function mockHandle<T>(req: MockRequest): Promise<T> {
  await delay(MOCK_LATENCY_MS)

  for (const route of routes) {
    if (route.method === req.method && route.pattern.test(req.path)) {
      const result = await route.handler(req)
      return result as T
    }
  }

  throw new ApiError(
    404,
    "MOCK_ROUTE_NOT_FOUND",
    `Mock no implementado para ${req.method} ${req.path}`,
  )
}

export function defineRoute(method: string, pattern: RegExp, handler: MockHandler): RouteEntry {
  return { method, pattern, handler }
}
