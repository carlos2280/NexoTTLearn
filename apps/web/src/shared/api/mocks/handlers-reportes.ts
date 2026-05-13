import type { CentroRevisionResponse } from "@nexott-learn/shared-types"
import { type MockHandler, defineRoute } from "./router"

const RTE_CENTRO_REVISION = /^\/reportes\/centro-revision(\?.*)?$/

const RESPUESTA_VACIA: CentroRevisionResponse = {
  transversales: [],
  entrevistasIa: [],
  totales: { transversales: 0, entrevistasIa: 0 },
  meta: { frescura: new Date().toISOString() },
}

const obtenerCentroRevisionHandler: MockHandler = () => RESPUESTA_VACIA

export const handlersReportes = [
  defineRoute("GET", RTE_CENTRO_REVISION, obtenerCentroRevisionHandler),
]
