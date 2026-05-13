import type {
  BloqueDetalleResponse,
  BloqueResponse,
  CrearBloqueInput,
  Paginated,
  PatchBloqueInput,
  PreviewImpactoEliminarBloque,
  ReordenarBloquesInput,
} from "@nexott-learn/shared-types"
import { ApiError } from "../api-error"
import { cargarSnapshot, guardarSnapshot } from "./mocks-storage"
import { type MockHandler, defineRoute } from "./router"
import { SEED_BLOQUES } from "./seed-bloques"

const STORAGE_KEY_BLOQUES = "bloques"

const RE_BLOQUE_ID = /^\/catalogo\/bloques\/([^/]+)$/
const RE_SEC_BLOQUES = /^\/catalogo\/secciones\/([^/]+)\/bloques$/
const RE_SEC_BLOQUES_ORDEN = /^\/catalogo\/secciones\/([^/]+)\/bloques\/orden$/
const RTE_LISTAR_BLOQUES = /^\/catalogo\/bloques(\?.*)?$/
const RTE_BLOQUE = /^\/catalogo\/bloques\/[^/?]+$/
const RTE_SEC_CREAR_BLOQUE = /^\/catalogo\/secciones\/[^/]+\/bloques$/
const RTE_SEC_REORDENAR_BLOQUES = /^\/catalogo\/secciones\/[^/]+\/bloques\/orden$/

const dbBloques: BloqueDetalleResponse[] = cargarSnapshot(STORAGE_KEY_BLOQUES, SEED_BLOQUES)

function persistir(): void {
  guardarSnapshot(STORAGE_KEY_BLOQUES, dbBloques)
}

function parseQuery(path: string): URLSearchParams {
  const indice = path.indexOf("?")
  if (indice < 0) {
    return new URLSearchParams()
  }
  return new URLSearchParams(path.slice(indice + 1))
}

function paginar<T>(items: readonly T[], page: number, pageSize: number): Paginated<T> {
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const inicio = (page - 1) * pageSize
  return {
    data: items.slice(inicio, inicio + pageSize),
    meta: { page, pageSize, total, totalPages },
  }
}

function nuevoUuid(prefijo: string): string {
  const hex = Math.random().toString(16).slice(2, 14).padStart(12, "0")
  return `00000000-0000-4000-a000-${prefijo}${hex.slice(prefijo.length)}`
}

function isoAhora(): string {
  return new Date().toISOString()
}

function extractMatch(path: string, regex: RegExp): RegExpMatchArray {
  const match = path.split("?")[0]?.match(regex)
  if (!match) {
    throw new ApiError(400, "RUTA_INVALIDA", "No se pudo parsear la ruta del mock.")
  }
  return match
}

function bloquesPorSeccion(seccionId: string): BloqueDetalleResponse[] {
  return dbBloques
    .filter((b) => b.seccionId === seccionId && b.estado === "ACTIVO")
    .sort((a, b) => a.orden - b.orden)
}

function aResumen(bloque: BloqueDetalleResponse): BloqueResponse {
  // Listado excluye contenido (JSONB voluminoso) — paridad con back D-CAT-9.
  const { contenido: _contenido, ...resto } = bloque
  return resto
}

// -------------------- LISTAR --------------------

const handleListar: MockHandler = (req) => {
  const params = parseQuery(req.path)
  const seccionId = params.get("seccionId") ?? undefined
  const tipo = params.get("tipo") ?? undefined
  const estado = params.get("estado") ?? undefined
  const page = Math.max(1, Number(params.get("page") ?? "1"))
  const pageSize = Math.min(100, Math.max(1, Number(params.get("pageSize") ?? "20")))
  const filtrados = dbBloques.filter((b) => {
    if (seccionId && b.seccionId !== seccionId) {
      return false
    }
    if (tipo && b.tipo !== tipo) {
      return false
    }
    if (estado && b.estado !== estado) {
      return false
    }
    // Por defecto ocultar ELIMINADO si no se pide explicito
    if (!estado && b.estado === "ELIMINADO") {
      return false
    }
    return true
  })
  const ordenados = [...filtrados].sort((a, b) => {
    if (a.seccionId === b.seccionId) {
      return a.orden - b.orden
    }
    return a.seccionId.localeCompare(b.seccionId)
  })
  return paginar(ordenados.map(aResumen), page, pageSize)
}

// -------------------- OBTENER (con contenido) --------------------

const handleObtener: MockHandler = (req) => {
  const [, id] = extractMatch(req.path, RE_BLOQUE_ID)
  const bloque = dbBloques.find((b) => b.id === id)
  if (!bloque) {
    throw new ApiError(404, "NO_ENCONTRADO", "Bloque no encontrado.")
  }
  return bloque
}

// -------------------- CREAR --------------------

const handleCrear: MockHandler = (req) => {
  const [, seccionId] = extractMatch(req.path, RE_SEC_BLOQUES)
  if (!seccionId) {
    throw new ApiError(400, "SECCION_REQUERIDA", "seccionId requerido.")
  }
  const input = (req.body ?? {}) as CrearBloqueInput
  if (input.esEvaluable && !input.skillQueMideId) {
    throw new ApiError(
      400,
      "INVARIANTE_EVALUABLE",
      "Si esEvaluable=true, skillQueMideId es obligatorio.",
    )
  }
  const hermanos = bloquesPorSeccion(seccionId)
  const orden = input.orden ?? hermanos.length + 1
  const ahora = isoAhora()
  const nuevo: BloqueDetalleResponse = {
    id: nuevoUuid("bloq"),
    seccionId,
    orden,
    tipo: input.tipo,
    esEvaluable: input.esEvaluable,
    skillQueMideId: input.skillQueMideId ?? null,
    estado: "ACTIVO",
    version: 1,
    contenido: input.contenido,
    createdAt: ahora,
    updatedAt: ahora,
  }
  dbBloques.push(nuevo)
  persistir()
  return nuevo
}

// -------------------- PATCH discriminado --------------------

const handlePatch: MockHandler = (req) => {
  const [, id] = extractMatch(req.path, RE_BLOQUE_ID)
  const indice = dbBloques.findIndex((b) => b.id === id)
  if (indice < 0) {
    throw new ApiError(404, "NO_ENCONTRADO", "Bloque no encontrado.")
  }
  const actual = dbBloques[indice]
  if (!actual) {
    throw new ApiError(404, "NO_ENCONTRADO", "Bloque no encontrado.")
  }
  const input = (req.body ?? {}) as PatchBloqueInput

  if (input.tipoEdicion === "COSMETICO") {
    const actualizado: BloqueDetalleResponse = {
      ...actual,
      contenido: input.contenido,
      updatedAt: isoAhora(),
      // version NO cambia en COSMETICO
    }
    dbBloques[indice] = actualizado
    persistir()
    return actualizado
  }

  // CAMBIA_EVALUACION
  if (!(req.headers["x-motivo"] || req.headers["X-Motivo"])) {
    throw new ApiError(
      400,
      "MOTIVO_REQUERIDO",
      "CAMBIA_EVALUACION requiere header X-Motivo no vacio.",
    )
  }
  const esEvaluableNueva = input.esEvaluable ?? actual.esEvaluable
  const skillQueMideIdNueva =
    input.skillQueMideId === undefined ? actual.skillQueMideId : input.skillQueMideId
  if (esEvaluableNueva && !skillQueMideIdNueva) {
    throw new ApiError(
      400,
      "INVARIANTE_EVALUABLE",
      "Si esEvaluable=true, skillQueMideId es obligatorio.",
    )
  }
  if (!esEvaluableNueva && skillQueMideIdNueva) {
    throw new ApiError(
      400,
      "INVARIANTE_EVALUABLE",
      "Si esEvaluable=false, skillQueMideId debe ser null.",
    )
  }
  const actualizado: BloqueDetalleResponse = {
    ...actual,
    contenido: input.contenido,
    esEvaluable: esEvaluableNueva,
    skillQueMideId: skillQueMideIdNueva,
    version: actual.version + 1,
    updatedAt: isoAhora(),
  }
  dbBloques[indice] = actualizado
  persistir()
  return actualizado
}

// -------------------- REORDENAR --------------------

const handleReordenar: MockHandler = (req) => {
  const [, seccionId] = extractMatch(req.path, RE_SEC_BLOQUES_ORDEN)
  if (!seccionId) {
    throw new ApiError(400, "SECCION_REQUERIDA", "seccionId requerido.")
  }
  const input = (req.body ?? {}) as ReordenarBloquesInput
  const hermanos = bloquesPorSeccion(seccionId)
  const idsEnDb = new Set(hermanos.map((b) => b.id))
  const idsEnInput = new Set(input.orden.map((o) => o.bloqueId))
  if (idsEnDb.size !== idsEnInput.size || !hermanos.every((b) => idsEnInput.has(b.id))) {
    throw new ApiError(
      400,
      "PERMUTACION_INVALIDA",
      "La permutacion no incluye exactamente los bloques activos de la seccion.",
    )
  }
  const ahora = isoAhora()
  for (const o of input.orden) {
    const idx = dbBloques.findIndex((b) => b.id === o.bloqueId)
    const actual = dbBloques[idx]
    if (idx >= 0 && actual) {
      dbBloques[idx] = { ...actual, orden: o.orden, updatedAt: ahora }
    }
  }
  persistir()
  return null
}

// -------------------- ELIMINAR (soft) con preview --------------------

const handleEliminar: MockHandler = (req) => {
  const [, id] = extractMatch(req.path, RE_BLOQUE_ID)
  const indice = dbBloques.findIndex((b) => b.id === id)
  if (indice < 0) {
    throw new ApiError(404, "NO_ENCONTRADO", "Bloque no encontrado.")
  }
  const actual = dbBloques[indice]
  if (!actual) {
    throw new ApiError(404, "NO_ENCONTRADO", "Bloque no encontrado.")
  }
  // Soft-delete: marca estado ELIMINADO
  dbBloques[indice] = {
    ...actual,
    estado: "ELIMINADO",
    updatedAt: isoAhora(),
  }
  persistir()
  const respuesta: PreviewImpactoEliminarBloque = {
    colaboradoresAfectados: [],
  }
  return respuesta
}

export const handlersBloques = [
  defineRoute("GET", RTE_LISTAR_BLOQUES, handleListar),
  defineRoute("GET", RTE_BLOQUE, handleObtener),
  defineRoute("POST", RTE_SEC_REORDENAR_BLOQUES, handleReordenar),
  defineRoute("POST", RTE_SEC_CREAR_BLOQUE, handleCrear),
  defineRoute("PATCH", RTE_BLOQUE, handlePatch),
  defineRoute("DELETE", RTE_BLOQUE, handleEliminar),
]
