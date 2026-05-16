import type { IntentoBloqueResponse } from "@nexott-learn/shared-types"
import { ApiError } from "../api-error"
import { type MockRequest, defineRoute } from "./router"

const RTE_CREAR_INTENTO = /^\/intentos-bloque$/
const RTE_MEJOR_INTENTO = /^\/colaboradores\/([^/]+)\/bloques\/([^/]+)\/mejor-intento$/

const SKILL_PLACEHOLDER = "00000000-0000-4000-a000-000000000000"

interface BodyCrearIntento {
  readonly bloqueId: string
  readonly cursoId: string
  readonly respuestas?: {
    readonly tipo?: string
    readonly resultadosTests?: readonly { readonly paso: boolean }[]
    readonly preguntas?: readonly unknown[]
  }
}

function isBodyCrearIntento(value: unknown): value is BodyCrearIntento {
  return typeof value === "object" && value !== null && "bloqueId" in value && "cursoId" in value
}

function calcularNota(body: BodyCrearIntento): number {
  const r = body.respuestas
  if (!r) {
    return 0
  }
  if (r.tipo === "CODIGO_PREGUNTAS" && r.resultadosTests && r.resultadosTests.length > 0) {
    const pasados = r.resultadosTests.filter((t) => t.paso).length
    return Math.round((pasados / r.resultadosTests.length) * 100)
  }
  // QUIZ y otros tipos: el backend real recalcularia segun las respuestas;
  // para el mock devolvemos una nota neutra para que el flujo siga.
  return 50
}

function intentoIdAleatorio(): string {
  const hex = Math.floor(Math.random() * 0xff_ff_ff_ff)
    .toString(16)
    .padStart(8, "0")
  return `00000000-0000-4000-a000-0000${hex}`
}

function handlerCrearIntento(req: MockRequest): IntentoBloqueResponse {
  if (!isBodyCrearIntento(req.body)) {
    throw new ApiError(400, "BODY_INVALIDO", "El body del intento es invalido.")
  }
  const nota = calcularNota(req.body)
  return {
    intentoId: intentoIdAleatorio(),
    bloqueId: req.body.bloqueId,
    skillId: SKILL_PLACEHOLDER,
    cursoId: req.body.cursoId,
    nota,
    esMejorIntento: true,
    versionBloque: 1,
    estaInvalidado: false,
    fecha: new Date().toISOString(),
  }
}

function handlerMejorIntento(_req: MockRequest): IntentoBloqueResponse | null {
  // En mock no persistimos historial: siempre devolvemos null para que la UI
  // entienda "nunca lo intentaste". Tras un POST exitoso, el frontend usa la
  // respuesta del propio POST como ultimoIntento.
  return null
}

export const handlersIntentosBloque = [
  defineRoute("POST", RTE_CREAR_INTENTO, handlerCrearIntento),
  defineRoute("GET", RTE_MEJOR_INTENTO, handlerMejorIntento),
]
