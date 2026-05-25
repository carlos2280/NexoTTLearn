import { type IntentoBloqueResponse, contenidoQuizSchema } from "@nexott-learn/shared-types"
import { ApiError } from "../api-error"
import { type MockRequest, defineRoute } from "./router"
import { SEED_BLOQUES } from "./seed-bloques"

const RTE_CREAR_INTENTO = /^\/intentos-bloque$/
const RTE_MEJOR_INTENTO = /^\/colaboradores\/([^/]+)\/bloques\/([^/]+)\/mejor-intento$/
const RGX_MEJOR_INTENTO_PATH = /^\/colaboradores\/[^/]+\/bloques\/([^/]+)\/mejor-intento$/

const SKILL_PLACEHOLDER = "00000000-0000-4000-a000-000000000000"

// Persistencia en memoria del MEJOR intento por bloque (un solo participante
// por navegador en mock). Permite que la UI vea aprobado, mostrar solucion
// y colapsar el bloque (04 R5/R6) sin necesidad de un backend real.
const mejoresPorBloque = new Map<string, IntentoBloqueResponse>()

interface RespuestaPreguntaPayload {
  readonly preguntaId: string
  readonly tipo: string
  readonly opcionElegidaId?: string
  readonly opcionesElegidasIds?: readonly string[]
  readonly valor?: boolean
  readonly texto?: string
}

interface BodyCrearIntento {
  readonly bloqueId: string
  readonly cursoId: string
  readonly respuestas?: {
    readonly tipo?: string
    readonly resultadosTests?: readonly { readonly paso: boolean }[]
    readonly preguntas?: readonly RespuestaPreguntaPayload[]
  }
}

function isBodyCrearIntento(value: unknown): value is BodyCrearIntento {
  return typeof value === "object" && value !== null && "bloqueId" in value && "cursoId" in value
}

const RGX_DIACRITICOS = /\p{M}/gu
const RGX_ESPACIOS_DOBLES = /\s+/g

function normalizarTexto(valor: string): string {
  return valor
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(RGX_DIACRITICOS, "")
    .replace(RGX_ESPACIOS_DOBLES, " ")
}

interface CorreccionQuiz {
  readonly nota: number
  readonly preguntasFalladasIds: readonly string[]
}

function corregirQuiz(
  bloqueId: string,
  respuestas: readonly RespuestaPreguntaPayload[],
): CorreccionQuiz {
  const bloque = SEED_BLOQUES.find((b) => b.id === bloqueId)
  if (!bloque) {
    return { nota: 0, preguntasFalladasIds: [] }
  }
  const parsed = contenidoQuizSchema.safeParse(bloque.contenido)
  if (!parsed.success) {
    return { nota: 0, preguntasFalladasIds: [] }
  }
  const preguntas = parsed.data.preguntas
  if (preguntas.length === 0) {
    return { nota: 0, preguntasFalladasIds: [] }
  }

  const respuestasPorId = new Map(respuestas.map((r) => [r.preguntaId, r]))
  const pesoTotal = preguntas.reduce((acc, p) => acc + (p.pesoPunto ?? 1), 0)
  let pesoAcertado = 0
  const preguntasFalladasIds: string[] = []

  for (const pregunta of preguntas) {
    const respuesta = respuestasPorId.get(pregunta.id)
    if (respuesta && esRespuestaCorrecta(pregunta, respuesta)) {
      pesoAcertado += pregunta.pesoPunto ?? 1
    } else {
      preguntasFalladasIds.push(pregunta.id)
    }
  }

  return {
    nota: Math.round((pesoAcertado / pesoTotal) * 100),
    preguntasFalladasIds,
  }
}

type PreguntaParseada = ReturnType<typeof contenidoQuizSchema.parse>["preguntas"][number]

function setsIguales(a: ReadonlySet<string>, b: ReadonlySet<string>): boolean {
  if (a.size !== b.size) {
    return false
  }
  for (const id of a) {
    if (!b.has(id)) {
      return false
    }
  }
  return true
}

function esRespuestaCorrecta(
  pregunta: PreguntaParseada,
  respuesta: RespuestaPreguntaPayload,
): boolean {
  if (pregunta.tipo !== respuesta.tipo) {
    return false
  }
  switch (pregunta.tipo) {
    case "OPCION_UNICA": {
      const correcta = pregunta.opciones.find((o) => o.esCorrecta)
      return Boolean(correcta && correcta.id === respuesta.opcionElegidaId)
    }
    case "OPCION_MULTIPLE": {
      const correctas = new Set(pregunta.opciones.filter((o) => o.esCorrecta).map((o) => o.id))
      const elegidas = new Set(respuesta.opcionesElegidasIds ?? [])
      return setsIguales(correctas, elegidas)
    }
    case "VERDADERO_FALSO":
      return respuesta.valor === pregunta.correcta
    case "RESPUESTA_CORTA": {
      const texto = normalizarTexto(respuesta.texto ?? "")
      return pregunta.respuestasAceptadas.some((r) => normalizarTexto(r) === texto)
    }
    default:
      return false
  }
}

interface NotaCalculada {
  readonly nota: number
  readonly preguntasFalladas: readonly string[]
}

function calcularNota(body: BodyCrearIntento): NotaCalculada {
  const r = body.respuestas
  if (!r) {
    return { nota: 0, preguntasFalladas: [] }
  }
  if (r.tipo === "CODIGO_PREGUNTAS" && r.resultadosTests && r.resultadosTests.length > 0) {
    const pasados = r.resultadosTests.filter((t) => t.paso).length
    return {
      nota: Math.round((pasados / r.resultadosTests.length) * 100),
      preguntasFalladas: [],
    }
  }
  if (r.tipo === "QUIZ" && r.preguntas) {
    const c = corregirQuiz(body.bloqueId, r.preguntas)
    return { nota: c.nota, preguntasFalladas: c.preguntasFalladasIds }
  }
  return { nota: 0, preguntasFalladas: [] }
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
  const { nota, preguntasFalladas } = calcularNota(req.body)
  const previo = mejoresPorBloque.get(req.body.bloqueId)
  const esMejorIntento = !previo || nota > previo.nota
  const intento: IntentoBloqueResponse = {
    intentoId: intentoIdAleatorio(),
    bloqueId: req.body.bloqueId,
    skillId: SKILL_PLACEHOLDER,
    cursoId: req.body.cursoId,
    nota,
    esMejorIntento,
    versionBloque: 1,
    estaInvalidado: false,
    fecha: new Date().toISOString(),
    preguntasFalladas,
  }
  if (esMejorIntento) {
    mejoresPorBloque.set(req.body.bloqueId, intento)
  }
  return intento
}

function handlerMejorIntento(req: MockRequest): IntentoBloqueResponse | null {
  const match = req.path.match(RGX_MEJOR_INTENTO_PATH)
  const bloqueId = match?.[1]
  if (!bloqueId) {
    return null
  }
  return mejoresPorBloque.get(bloqueId) ?? null
}

export const handlersIntentosBloque = [
  defineRoute("POST", RTE_CREAR_INTENTO, handlerCrearIntento),
  defineRoute("GET", RTE_MEJOR_INTENTO, handlerMejorIntento),
]
