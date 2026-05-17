import type {
  CrearIntentoTransversalResponse,
  IntentoTransversalParticipanteResponse,
  TransversalResponse,
} from "@nexott-learn/shared-types"
import { ApiError } from "../api-error"
import { cargarSnapshot, guardarSnapshot } from "./mocks-storage"
import { type MockRequest, defineRoute } from "./router"

const RTE_TRANSVERSAL_CURSO = /^\/cursos\/([^/]+)\/transversal$/
const RTE_INTENTOS_LIST = /^\/asignaciones\/([^/]+)\/intentos-transversal$/
const RTE_INTENTOS_CREATE = /^\/asignaciones\/([^/]+)\/intentos-transversal$/

const RGX_CURSO_ID = /^\/cursos\/([^/]+)\/transversal/
const RGX_ASIG_ID = /^\/asignaciones\/([^/]+)\/intentos-transversal/

const STORAGE_KEY_INTENTOS = "transversal-intentos"
const RESULT_OVERRIDE_KEY = "nexott-mock:transversal-resultado"
const EVALUACION_MS = 10_000
const RGX_URL_GIT_VALIDA = /^https:\/\/(github|gitlab)\.com\//

const TRANSVERSAL_POR_CURSO: ReadonlyMap<string, TransversalResponse> = new Map([
  [
    "curso-java-senior",
    {
      transversalId: "00000000-0000-4000-a000-000000000a01",
      cursoId: "00000000-0000-4000-a000-000000000c01",
      descripcion:
        "Demuestra que puedes integrar todo lo del curso: arma un servicio REST con Spring Boot, persistencia con JPA y tests unitarios. Subes el repositorio y nuestro evaluador revisa funcionalidad y calidad del codigo.",
      umbralAprobacion: 70,
      pesosCapas: { tests: 60, cualitativa: 40, comprension: 0 },
      capasActivas: { tests: true, cualitativa: true, comprension: false },
      skillsQueMide: [],
    },
  ],
  [
    "curso-fullstack-devops",
    {
      transversalId: "00000000-0000-4000-a000-000000000a02",
      cursoId: "00000000-0000-4000-a000-000000000c02",
      descripcion:
        "Integra todo lo del bootcamp en una aplicacion full-stack desplegable: frontend React, backend Express con base de datos, dockerizada y desplegada en un registry publico. Subes el repositorio y revisamos el conjunto.",
      umbralAprobacion: 70,
      pesosCapas: { tests: 60, cualitativa: 40, comprension: 0 },
      capasActivas: { tests: true, cualitativa: true, comprension: false },
      skillsQueMide: [],
    },
  ],
  [
    "curso-react-frontend-mid",
    {
      transversalId: "00000000-0000-4000-a000-000000000a03",
      cursoId: "00000000-0000-4000-a000-000000000c03",
      descripcion:
        "Construye un SPA con React + Tanstack Query consumiendo una API publica. Foco en arquitectura de componentes, hooks reutilizables y tests con Testing Library.",
      umbralAprobacion: 70,
      pesosCapas: { tests: 50, cualitativa: 50, comprension: 0 },
      capasActivas: { tests: true, cualitativa: true, comprension: false },
      skillsQueMide: [],
    },
  ],
])

function fallbackTransversal(cursoId: string): TransversalResponse {
  return {
    transversalId: "00000000-0000-4000-a000-0000000000ff",
    cursoId: pad36(cursoId),
    descripcion:
      "Demuestra que sabes integrar todo lo del curso en un proyecto real. Sube el repositorio y nuestro evaluador revisa tu trabajo.",
    umbralAprobacion: 70,
    pesosCapas: { tests: 60, cualitativa: 40, comprension: 0 },
    capasActivas: { tests: true, cualitativa: true, comprension: false },
    skillsQueMide: [],
  }
}

function pad36(input: string): string {
  const hex = Array.from(input)
    .reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) >>> 0, 0)
    .toString(16)
    .padStart(8, "0")
  return `00000000-0000-4000-a000-0000${hex.slice(0, 8)}`
}

function nuevoUuid(): string {
  const hex = Math.floor(Math.random() * 0xff_ff_ff_ff)
    .toString(16)
    .padStart(8, "0")
  return `00000000-0000-4000-a000-0001${hex}`
}

interface MockIntentoConContexto extends IntentoTransversalParticipanteResponse {
  readonly asignacionId: string
  readonly resolvedAt: string
}

function cargarIntentos(): MockIntentoConContexto[] {
  return cargarSnapshot<MockIntentoConContexto>(STORAGE_KEY_INTENTOS, [])
}

function guardarIntentos(data: readonly MockIntentoConContexto[]): void {
  guardarSnapshot(STORAGE_KEY_INTENTOS, data)
}

function leerOverrideResultado(): "APROBADO" | "NO_APROBADO" | null {
  if (typeof window === "undefined") {
    return null
  }
  const raw = window.localStorage.getItem(RESULT_OVERRIDE_KEY)
  if (raw === "APROBADO" || raw === "NO_APROBADO") {
    return raw
  }
  return null
}

function resolverIntentosVencidos(): void {
  const ahora = Date.now()
  const lista = cargarIntentos()
  let huboCambios = false
  const actualizada = lista.map((intento) => {
    if (intento.estado !== "EN_EVALUACION") {
      return intento
    }
    const resolvedTs = Date.parse(intento.resolvedAt)
    if (Number.isNaN(resolvedTs) || resolvedTs > ahora) {
      return intento
    }
    huboCambios = true
    const override = leerOverrideResultado()
    const aprobado = override ? override === "APROBADO" : true
    return {
      ...intento,
      estado: "FINALIZADO" as const,
      aprobado,
      notaGlobal: aprobado ? 82 : 58,
    }
  })
  if (huboCambios) {
    guardarIntentos(actualizada)
  }
}

interface BodyCrearIntento {
  readonly repoOArtefacto?: { readonly tipo?: string; readonly url?: string }
  readonly comentarioColaborador?: string
}

function isBodyCrearIntento(value: unknown): value is BodyCrearIntento {
  return typeof value === "object" && value !== null && "repoOArtefacto" in value
}

function handlerTransversalCurso(req: MockRequest): TransversalResponse {
  const match = req.path.match(RGX_CURSO_ID)
  const cursoId = match?.[1] ?? "curso-demo"
  return TRANSVERSAL_POR_CURSO.get(cursoId) ?? fallbackTransversal(cursoId)
}

function handlerCrearIntento(req: MockRequest): CrearIntentoTransversalResponse {
  if (!isBodyCrearIntento(req.body)) {
    throw new ApiError(400, "BODY_INVALIDO", "El body del intento es invalido.")
  }
  const url = req.body.repoOArtefacto?.url
  if (!(url && RGX_URL_GIT_VALIDA.test(url))) {
    throw new ApiError(400, "URL_INVALIDA", "La URL debe apuntar a github.com o gitlab.com.")
  }
  const match = req.path.match(RGX_ASIG_ID)
  const asignacionId = match?.[1] ?? "asg-unknown"
  const intentoId = nuevoUuid()
  const fecha = new Date().toISOString()
  const resolvedAt = new Date(Date.now() + EVALUACION_MS).toISOString()

  const intento: MockIntentoConContexto = {
    intentoId,
    estado: "EN_EVALUACION",
    fecha,
    repoOArtefacto: { tipo: "URL_GIT", url },
    comentarioColaborador: req.body.comentarioColaborador?.trim() || null,
    notaGlobal: null,
    aprobado: null,
    asignacionId,
    resolvedAt,
  }

  const lista = cargarIntentos()
  guardarIntentos([intento, ...lista])

  return {
    intentoId,
    estado: "EN_EVALUACION",
    evaluacionAsincronaEsperada: resolvedAt,
  }
}

function handlerListarIntentos(
  req: MockRequest,
): readonly IntentoTransversalParticipanteResponse[] {
  resolverIntentosVencidos()
  const match = req.path.match(RGX_ASIG_ID)
  const asignacionId = match?.[1] ?? "asg-unknown"
  return cargarIntentos()
    .filter((intento) => intento.asignacionId === asignacionId)
    .map(({ asignacionId: _ignored, resolvedAt: _resolved, ...rest }) => rest)
}

export const handlersTransversal = [
  defineRoute("GET", RTE_TRANSVERSAL_CURSO, handlerTransversalCurso),
  defineRoute("GET", RTE_INTENTOS_LIST, handlerListarIntentos),
  defineRoute("POST", RTE_INTENTOS_CREATE, handlerCrearIntento),
]
