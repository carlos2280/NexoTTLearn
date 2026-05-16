import type {
  ActualizarSeccionInput,
  CrearSeccionInput,
  Paginated,
  ReordenarSeccionesInput,
  SeccionResponse,
} from "@nexott-learn/shared-types"
import { ApiError } from "../api-error"
import { cargarSnapshot, guardarSnapshot } from "./mocks-storage"
import { type MockHandler, defineRoute } from "./router"
import { SEED_SECCIONES } from "./seed-bloques"

const STORAGE_KEY_SECCIONES = "secciones"

const RE_SECCION_ID = /^\/catalogo\/secciones\/([^/]+)$/
const RE_MOD_SECCIONES = /^\/catalogo\/modulos\/([^/]+)\/secciones$/
const RE_MOD_SECCION_ID = /^\/catalogo\/modulos\/([^/]+)\/secciones\/([^/]+)$/
const RE_MOD_SECCIONES_ORDEN = /^\/catalogo\/modulos\/([^/]+)\/secciones\/orden$/

const RTE_LISTAR = /^\/catalogo\/secciones(\?.*)?$/
const RTE_OBTENER = /^\/catalogo\/secciones\/[^/?]+$/
const RTE_REORDENAR = /^\/catalogo\/modulos\/[^/]+\/secciones\/orden$/
const RTE_CREAR = /^\/catalogo\/modulos\/[^/]+\/secciones$/
const RTE_MOD_SECCION = /^\/catalogo\/modulos\/[^/]+\/secciones\/[^/?]+$/

const dbSecciones: SeccionResponse[] = cargarSnapshot(STORAGE_KEY_SECCIONES, SEED_SECCIONES)

function persistir(): void {
  guardarSnapshot(STORAGE_KEY_SECCIONES, dbSecciones)
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

function seccionesPorModulo(moduloId: string): SeccionResponse[] {
  return dbSecciones.filter((s) => s.moduloId === moduloId).sort((a, b) => a.orden - b.orden)
}

// -------------------- LISTAR --------------------

const handleListar: MockHandler = (req) => {
  const params = parseQuery(req.path)
  const moduloId = params.get("moduloId") ?? undefined
  const page = Math.max(1, Number(params.get("page") ?? "1"))
  const pageSize = Math.min(100, Math.max(1, Number(params.get("pageSize") ?? "20")))
  const filtradas = moduloId
    ? seccionesPorModulo(moduloId)
    : [...dbSecciones].sort((a, b) => a.orden - b.orden)
  return paginar(filtradas, page, pageSize)
}

// -------------------- OBTENER --------------------

const handleObtener: MockHandler = (req) => {
  const [, id] = extractMatch(req.path, RE_SECCION_ID)
  const seccion = dbSecciones.find((s) => s.id === id)
  if (!seccion) {
    throw new ApiError(404, "NO_ENCONTRADO", "Seccion no encontrada.")
  }
  return seccion
}

// -------------------- CREAR --------------------

const handleCrear: MockHandler = (req) => {
  const [, moduloId] = extractMatch(req.path, RE_MOD_SECCIONES)
  if (!moduloId) {
    throw new ApiError(400, "MODULO_REQUERIDO", "moduloId requerido.")
  }
  const input = (req.body ?? {}) as CrearSeccionInput
  const titulo = input.titulo.trim()
  const hermanas = seccionesPorModulo(moduloId)
  const colision = hermanas.find((s) => s.titulo.trim().toLowerCase() === titulo.toLowerCase())
  if (colision) {
    throw new ApiError(
      409,
      "SECCION_DUPLICADA",
      "Ya existe una seccion con ese titulo en el modulo.",
    )
  }
  const orden = input.orden ?? hermanas.length + 1
  const ahora = isoAhora()
  const nueva: SeccionResponse = {
    id: nuevoUuid("secc"),
    moduloId,
    titulo,
    orden,
    createdAt: ahora,
    updatedAt: ahora,
  }
  dbSecciones.push(nueva)
  persistir()
  return nueva
}

// -------------------- ACTUALIZAR --------------------

const handleActualizar: MockHandler = (req) => {
  const [, moduloId, seccionId] = extractMatch(req.path, RE_MOD_SECCION_ID)
  const indice = dbSecciones.findIndex((s) => s.id === seccionId && s.moduloId === moduloId)
  if (indice < 0) {
    throw new ApiError(404, "NO_ENCONTRADO", "Seccion no encontrada.")
  }
  const actual = dbSecciones[indice]
  if (!actual) {
    throw new ApiError(404, "NO_ENCONTRADO", "Seccion no encontrada.")
  }
  const input = (req.body ?? {}) as ActualizarSeccionInput
  if (input.titulo !== undefined) {
    const titulo = input.titulo.trim()
    const colision = dbSecciones.find(
      (s, i) =>
        i !== indice &&
        s.moduloId === actual.moduloId &&
        s.titulo.trim().toLowerCase() === titulo.toLowerCase(),
    )
    if (colision) {
      throw new ApiError(
        409,
        "SECCION_DUPLICADA",
        "Ya existe una seccion con ese titulo en el modulo.",
      )
    }
  }
  const actualizada: SeccionResponse = {
    ...actual,
    titulo: input.titulo?.trim() ?? actual.titulo,
    updatedAt: isoAhora(),
  }
  dbSecciones[indice] = actualizada
  persistir()
  return actualizada
}

// -------------------- REORDENAR --------------------

const handleReordenar: MockHandler = (req) => {
  const [, moduloId] = extractMatch(req.path, RE_MOD_SECCIONES_ORDEN)
  if (!moduloId) {
    throw new ApiError(400, "MODULO_REQUERIDO", "moduloId requerido.")
  }
  const input = (req.body ?? {}) as ReordenarSeccionesInput
  const hermanas = seccionesPorModulo(moduloId)
  const idsEnDb = new Set(hermanas.map((s) => s.id))
  const idsEnInput = new Set(input.orden.map((o) => o.seccionId))
  if (idsEnDb.size !== idsEnInput.size || !hermanas.every((s) => idsEnInput.has(s.id))) {
    throw new ApiError(
      400,
      "PERMUTACION_INVALIDA",
      "La permutacion no incluye exactamente las secciones del modulo.",
    )
  }
  const ahora = isoAhora()
  for (const o of input.orden) {
    const idx = dbSecciones.findIndex((s) => s.id === o.seccionId)
    const actual = dbSecciones[idx]
    if (idx >= 0 && actual) {
      dbSecciones[idx] = { ...actual, orden: o.orden, updatedAt: ahora }
    }
  }
  persistir()
  return null
}

// -------------------- ELIMINAR --------------------

const handleEliminar: MockHandler = (req) => {
  const [, , seccionId] = extractMatch(req.path, RE_MOD_SECCION_ID)
  const indice = dbSecciones.findIndex((s) => s.id === seccionId)
  if (indice < 0) {
    throw new ApiError(404, "NO_ENCONTRADO", "Seccion no encontrada.")
  }
  dbSecciones.splice(indice, 1)
  persistir()
  return null
}

export const handlersSecciones = [
  defineRoute("GET", RTE_LISTAR, handleListar),
  defineRoute("GET", RTE_OBTENER, handleObtener),
  defineRoute("POST", RTE_REORDENAR, handleReordenar),
  defineRoute("POST", RTE_CREAR, handleCrear),
  defineRoute("PATCH", RTE_MOD_SECCION, handleActualizar),
  defineRoute("DELETE", RTE_MOD_SECCION, handleEliminar),
]
