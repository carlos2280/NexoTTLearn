import type { EntrevistaIaResponse } from "@nexott-learn/shared-types"
import { type MockRequest, defineRoute } from "./router"

const RTE_ENTREVISTA_CURSO = /^\/cursos\/([^/]+)\/entrevista-ia$/
const RGX_CURSO_ID = /^\/cursos\/([^/]+)\/entrevista-ia/

const ENTREVISTA_POR_CURSO: ReadonlyMap<string, EntrevistaIaResponse> = new Map([
  [
    "curso-java-senior",
    {
      entrevistaIaId: "00000000-0000-4000-b000-000000000a01",
      cursoId: "00000000-0000-4000-b000-000000000c01",
      umbralAprobacion: 70,
      filosofia: "PREPARACION" as const,
      profundidad: "SENIOR" as const,
      duracionMinutos: 15,
      tono: "CONVERSACIONAL" as const,
      areas: [],
    },
  ],
  [
    "curso-fullstack-devops",
    {
      entrevistaIaId: "00000000-0000-4000-b000-000000000a02",
      cursoId: "00000000-0000-4000-b000-000000000c02",
      umbralAprobacion: 70,
      filosofia: "PREPARACION" as const,
      profundidad: "JUNIOR" as const,
      duracionMinutos: 10,
      tono: "CONVERSACIONAL" as const,
      areas: [],
    },
  ],
])

function fallbackEntrevista(cursoId: string): EntrevistaIaResponse {
  return {
    entrevistaIaId: "00000000-0000-4000-b000-0000000000ff",
    cursoId: pad36(cursoId),
    umbralAprobacion: 70,
    filosofia: "PREPARACION",
    profundidad: "SEMI_SENIOR",
    duracionMinutos: 12,
    tono: "CONVERSACIONAL",
    areas: [],
  }
}

function pad36(input: string): string {
  const hex = Array.from(input)
    .reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) >>> 0, 0)
    .toString(16)
    .padStart(8, "0")
  return `00000000-0000-4000-b000-0000${hex.slice(0, 8)}`
}

function handlerEntrevistaCurso(req: MockRequest): EntrevistaIaResponse {
  const match = req.path.match(RGX_CURSO_ID)
  const cursoId = match?.[1] ?? "curso-demo"
  return ENTREVISTA_POR_CURSO.get(cursoId) ?? fallbackEntrevista(cursoId)
}

export const handlersEntrevistaIa = [
  defineRoute("GET", RTE_ENTREVISTA_CURSO, handlerEntrevistaCurso),
]
