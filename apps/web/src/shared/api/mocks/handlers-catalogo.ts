import type {
  ActualizarAreaInput,
  ActualizarClienteInput,
  ActualizarModuloInput,
  AreaResponse,
  CambiarAreaSkillInput,
  ClienteDetalleResponse,
  ClienteResponse,
  CrearAreaInput,
  CrearClienteInput,
  CrearModuloInput,
  CrearSkillInput,
  FusionSkillsResponse,
  FusionarSkillsInput,
  ModuloResponse,
  Paginated,
  PreviewCambioAreaResponse,
  RenombrarSkillInput,
  SkillResponse,
} from "@nexott-learn/shared-types"
import { ApiError } from "../api-error"
import { type MockHandler, type MockRequest, defineRoute } from "./router"
import { SEED_AREAS, SEED_CLIENTES, SEED_MODULOS, SEED_SKILLS } from "./seed-catalogo"

const dbAreas: AreaResponse[] = [...SEED_AREAS]
const dbSkills: SkillResponse[] = [...SEED_SKILLS]
const dbModulos: ModuloResponse[] = [...SEED_MODULOS]
const dbClientes: ClienteResponse[] = [...SEED_CLIENTES]

interface PageQuery {
  readonly page: number
  readonly pageSize: number
  readonly q?: string
}

function parseQuery(path: string): URLSearchParams {
  const indice = path.indexOf("?")
  if (indice < 0) {
    return new URLSearchParams()
  }
  return new URLSearchParams(path.slice(indice + 1))
}

function leerPageQuery(path: string): PageQuery {
  const params = parseQuery(path)
  const page = Math.max(1, Number(params.get("page") ?? "1"))
  const pageSize = Math.min(100, Math.max(1, Number(params.get("pageSize") ?? "20")))
  const q = params.get("q") ?? undefined
  return { page, pageSize, q }
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

function extractIdDeRuta(path: string, prefijo: string): string {
  const sinQuery = path.split("?")[0] ?? ""
  return sinQuery.slice(prefijo.length).split("/")[0] ?? ""
}

// -------------------- ÁREAS --------------------

const handleListarAreas: MockHandler = (req) => {
  const { page, pageSize, q } = leerPageQuery(req.path)
  const termino = q?.toLowerCase().trim()
  const filtradas = termino
    ? dbAreas.filter(
        (a) =>
          a.nombre.toLowerCase().includes(termino) ||
          (a.descripcion?.toLowerCase().includes(termino) ?? false),
      )
    : dbAreas
  return paginar(filtradas, page, pageSize)
}

const handleObtenerArea: MockHandler = (req) => {
  const id = extractIdDeRuta(req.path, "/catalogo/areas/")
  const area = dbAreas.find((a) => a.id === id)
  if (!area) {
    throw new ApiError(404, "NO_ENCONTRADO", "Área no encontrada.")
  }
  return area
}

const handleCrearArea: MockHandler = (req) => {
  const input = (req.body ?? {}) as CrearAreaInput
  const colision = dbAreas.find(
    (a) => a.nombre.trim().toLowerCase() === input.nombre.trim().toLowerCase(),
  )
  if (colision) {
    throw new ApiError(409, "AREA_NOMBRE_DUPLICADO", "Ya existe un área con ese nombre.")
  }
  const ahora = isoAhora()
  const nueva: AreaResponse = {
    id: nuevoUuid("nuev"),
    nombre: input.nombre.trim(),
    descripcion: input.descripcion?.trim() ?? null,
    createdAt: ahora,
    updatedAt: ahora,
  }
  dbAreas.unshift(nueva)
  return nueva
}

const handleActualizarArea: MockHandler = (req) => {
  const id = extractIdDeRuta(req.path, "/catalogo/areas/")
  const indice = dbAreas.findIndex((a) => a.id === id)
  if (indice < 0) {
    throw new ApiError(404, "NO_ENCONTRADO", "Área no encontrada.")
  }
  const input = (req.body ?? {}) as ActualizarAreaInput
  if (input.nombre !== undefined) {
    const colision = dbAreas.find(
      (a, i) =>
        i !== indice && a.nombre.trim().toLowerCase() === input.nombre?.trim().toLowerCase(),
    )
    if (colision) {
      throw new ApiError(409, "AREA_NOMBRE_DUPLICADO", "Ya existe un área con ese nombre.")
    }
  }
  const actual = dbAreas[indice]
  if (!actual) {
    throw new ApiError(404, "NO_ENCONTRADO", "Área no encontrada.")
  }
  const actualizada: AreaResponse = {
    ...actual,
    nombre: input.nombre?.trim() ?? actual.nombre,
    descripcion:
      input.descripcion === undefined ? actual.descripcion : (input.descripcion?.trim() ?? null),
    updatedAt: isoAhora(),
  }
  dbAreas[indice] = actualizada
  return actualizada
}

const handleEliminarArea: MockHandler = (req) => {
  const id = extractIdDeRuta(req.path, "/catalogo/areas/")
  const indice = dbAreas.findIndex((a) => a.id === id)
  if (indice < 0) {
    throw new ApiError(404, "NO_ENCONTRADO", "Área no encontrada.")
  }
  dbAreas.splice(indice, 1)
  return null
}

// -------------------- SKILLS --------------------

const handleListarSkills: MockHandler = (req) => {
  const params = parseQuery(req.path)
  const { page, pageSize, q } = leerPageQuery(req.path)
  const areaId = params.get("areaId") ?? undefined
  const estado = params.get("estado") ?? undefined
  const termino = q?.toLowerCase().trim()
  const filtradas = dbSkills.filter((s) => {
    if (areaId && s.areaId !== areaId) {
      return false
    }
    if (estado && s.estado !== estado) {
      return false
    }
    if (termino && !s.etiquetaVisible.toLowerCase().includes(termino)) {
      return false
    }
    return true
  })
  return paginar(filtradas, page, pageSize)
}

function buscarSkillIndice(id: string): number {
  return dbSkills.findIndex((s) => s.id === id)
}

const handleCrearSkill: MockHandler = (req) => {
  const input = (req.body ?? {}) as CrearSkillInput
  const etiqueta = input.etiquetaVisible.trim()
  const colision = dbSkills.find(
    (s) =>
      s.areaId === input.areaId &&
      s.etiquetaVisible.trim().toLowerCase() === etiqueta.toLowerCase(),
  )
  if (colision) {
    throw new ApiError(409, "SKILL_DUPLICADA", "Ya existe una skill con ese nombre en esa área.")
  }
  const ahora = isoAhora()
  const nueva: SkillResponse = {
    id: nuevoUuid("skil"),
    etiquetaVisible: etiqueta,
    areaId: input.areaId,
    estado: "ACTIVA",
    createdAt: ahora,
    updatedAt: ahora,
  }
  dbSkills.unshift(nueva)
  return nueva
}

const handleRenombrarSkill: MockHandler = (req) => {
  const id = extractIdDeRuta(req.path, "/catalogo/skills/")
  const indice = buscarSkillIndice(id)
  if (indice < 0) {
    throw new ApiError(404, "NO_ENCONTRADO", "Skill no encontrada.")
  }
  const input = (req.body ?? {}) as RenombrarSkillInput
  const etiqueta = input.etiquetaVisible.trim()
  const actual = dbSkills[indice]
  if (!actual) {
    throw new ApiError(404, "NO_ENCONTRADO", "Skill no encontrada.")
  }
  const colision = dbSkills.find(
    (s, i) =>
      i !== indice &&
      s.areaId === actual.areaId &&
      s.etiquetaVisible.trim().toLowerCase() === etiqueta.toLowerCase(),
  )
  if (colision) {
    throw new ApiError(409, "SKILL_DUPLICADA", "Ya existe una skill con ese nombre en esa área.")
  }
  const actualizada: SkillResponse = {
    ...actual,
    etiquetaVisible: etiqueta,
    updatedAt: isoAhora(),
  }
  dbSkills[indice] = actualizada
  return actualizada
}

function actualizarEstadoSkill(id: string, estado: "ACTIVA" | "ARCHIVADA"): null {
  const indice = buscarSkillIndice(id)
  if (indice < 0) {
    throw new ApiError(404, "NO_ENCONTRADO", "Skill no encontrada.")
  }
  const actual = dbSkills[indice]
  if (!actual) {
    throw new ApiError(404, "NO_ENCONTRADO", "Skill no encontrada.")
  }
  dbSkills[indice] = { ...actual, estado, updatedAt: isoAhora() }
  return null
}

const handleArchivarSkill: MockHandler = (req) => {
  const id = extractIdDeRuta(req.path, "/catalogo/skills/")
  return actualizarEstadoSkill(id, "ARCHIVADA")
}

const handleDesarchivarSkill: MockHandler = (req) => {
  const id = extractIdDeRuta(req.path, "/catalogo/skills/")
  return actualizarEstadoSkill(id, "ACTIVA")
}

const handleEliminarSkill: MockHandler = (req) => {
  const id = extractIdDeRuta(req.path, "/catalogo/skills/")
  const indice = buscarSkillIndice(id)
  if (indice < 0) {
    throw new ApiError(404, "NO_ENCONTRADO", "Skill no encontrada.")
  }
  dbSkills.splice(indice, 1)
  return null
}

const handlePreviewCambioArea: MockHandler = (req) => {
  const id = extractIdDeRuta(req.path, "/catalogo/skills/")
  const skill = dbSkills.find((s) => s.id === id)
  if (!skill) {
    throw new ApiError(404, "NO_ENCONTRADO", "Skill no encontrada.")
  }
  const input = (req.body ?? {}) as CambiarAreaSkillInput
  const respuesta: PreviewCambioAreaResponse = {
    skillId: skill.id,
    areaActualId: skill.areaId,
    areaDestinoId: input.areaDestinoId,
    impacto: {
      cursosAfectados: [
        { cursoId: nuevoUuid("curs"), titulo: "Curso de muestra que usa esta skill" },
      ],
      modulosAfectados: [{ moduloId: nuevoUuid("modu"), titulo: "Módulo asociado" }],
      bloquesAfectados: 4,
      seccionesAfectadas: 2,
      totalReferencias: 7,
    },
  }
  return respuesta
}

const handleCambiarAreaSkill: MockHandler = (req) => {
  const id = extractIdDeRuta(req.path, "/catalogo/skills/")
  const indice = buscarSkillIndice(id)
  if (indice < 0) {
    throw new ApiError(404, "NO_ENCONTRADO", "Skill no encontrada.")
  }
  const actual = dbSkills[indice]
  if (!actual) {
    throw new ApiError(404, "NO_ENCONTRADO", "Skill no encontrada.")
  }
  const input = (req.body ?? {}) as CambiarAreaSkillInput
  const actualizada: SkillResponse = {
    ...actual,
    areaId: input.areaDestinoId,
    updatedAt: isoAhora(),
  }
  dbSkills[indice] = actualizada
  return actualizada
}

const handleFusionarSkills: MockHandler = (req) => {
  const input = (req.body ?? {}) as FusionarSkillsInput
  const ganadoraIdx = buscarSkillIndice(input.skillGanadoraId)
  const perdedoraIdx = buscarSkillIndice(input.skillPerdedoraId)
  if (ganadoraIdx < 0 || perdedoraIdx < 0) {
    throw new ApiError(404, "NO_ENCONTRADO", "Alguna de las skills no fue encontrada.")
  }
  const ganadora = dbSkills[ganadoraIdx]
  const perdedora = dbSkills[perdedoraIdx]
  if (!(ganadora && perdedora)) {
    throw new ApiError(404, "NO_ENCONTRADO", "Alguna de las skills no fue encontrada.")
  }
  const perdedoraActualizada: SkillResponse = {
    ...perdedora,
    estado: "ARCHIVADA",
    updatedAt: isoAhora(),
  }
  dbSkills[perdedoraIdx] = perdedoraActualizada
  const respuesta: FusionSkillsResponse = {
    skillGanadora: ganadora,
    skillPerdedora: perdedoraActualizada,
    referenciasMigradas: { secciones: 3, cursos: 2, bloques: 5 },
  }
  return respuesta
}

// -------------------- MÓDULOS --------------------

const handleListarModulos: MockHandler = (req) => {
  const params = parseQuery(req.path)
  const { page, pageSize, q } = leerPageQuery(req.path)
  const estado = params.get("estado") ?? undefined
  const termino = q?.toLowerCase().trim()
  const filtrados = dbModulos.filter((m) => {
    if (estado && m.estado !== estado) {
      return false
    }
    if (
      termino &&
      !m.titulo.toLowerCase().includes(termino) &&
      !(m.descripcion?.toLowerCase().includes(termino) ?? false)
    ) {
      return false
    }
    return true
  })
  return paginar(filtrados, page, pageSize)
}

function buscarModuloIndice(id: string): number {
  return dbModulos.findIndex((m) => m.id === id)
}

const handleCrearModulo: MockHandler = (req) => {
  const input = (req.body ?? {}) as CrearModuloInput
  const titulo = input.titulo.trim()
  const colision = dbModulos.find((m) => m.titulo.trim().toLowerCase() === titulo.toLowerCase())
  if (colision) {
    throw new ApiError(409, "MODULO_DUPLICADO", "Ya existe un módulo con ese título.")
  }
  const ahora = isoAhora()
  const nuevo: ModuloResponse = {
    id: nuevoUuid("modu"),
    titulo,
    descripcion: input.descripcion?.trim() ?? null,
    estado: "ACTIVO",
    createdAt: ahora,
    updatedAt: ahora,
  }
  dbModulos.unshift(nuevo)
  return nuevo
}

const handleActualizarModulo: MockHandler = (req) => {
  const id = extractIdDeRuta(req.path, "/catalogo/modulos/")
  const indice = buscarModuloIndice(id)
  if (indice < 0) {
    throw new ApiError(404, "NO_ENCONTRADO", "Módulo no encontrado.")
  }
  const actual = dbModulos[indice]
  if (!actual) {
    throw new ApiError(404, "NO_ENCONTRADO", "Módulo no encontrado.")
  }
  const input = (req.body ?? {}) as ActualizarModuloInput
  if (input.titulo !== undefined) {
    const titulo = input.titulo.trim()
    const colision = dbModulos.find(
      (m, i) => i !== indice && m.titulo.trim().toLowerCase() === titulo.toLowerCase(),
    )
    if (colision) {
      throw new ApiError(409, "MODULO_DUPLICADO", "Ya existe un módulo con ese título.")
    }
  }
  const actualizado: ModuloResponse = {
    ...actual,
    titulo: input.titulo?.trim() ?? actual.titulo,
    descripcion:
      input.descripcion === undefined ? actual.descripcion : (input.descripcion?.trim() ?? null),
    updatedAt: isoAhora(),
  }
  dbModulos[indice] = actualizado
  return actualizado
}

function actualizarEstadoModulo(id: string, estado: "ACTIVO" | "ARCHIVADO"): null {
  const indice = buscarModuloIndice(id)
  if (indice < 0) {
    throw new ApiError(404, "NO_ENCONTRADO", "Módulo no encontrado.")
  }
  const actual = dbModulos[indice]
  if (!actual) {
    throw new ApiError(404, "NO_ENCONTRADO", "Módulo no encontrado.")
  }
  dbModulos[indice] = { ...actual, estado, updatedAt: isoAhora() }
  return null
}

const handleArchivarModulo: MockHandler = (req) => {
  const id = extractIdDeRuta(req.path, "/catalogo/modulos/")
  return actualizarEstadoModulo(id, "ARCHIVADO")
}

const handleDesarchivarModulo: MockHandler = (req) => {
  const id = extractIdDeRuta(req.path, "/catalogo/modulos/")
  return actualizarEstadoModulo(id, "ACTIVO")
}

const handleEliminarModulo: MockHandler = (req) => {
  const id = extractIdDeRuta(req.path, "/catalogo/modulos/")
  const indice = buscarModuloIndice(id)
  if (indice < 0) {
    throw new ApiError(404, "NO_ENCONTRADO", "Módulo no encontrado.")
  }
  dbModulos.splice(indice, 1)
  return null
}

// -------------------- CLIENTES --------------------

const handleListarClientes: MockHandler = (req: MockRequest) => {
  const params = parseQuery(req.path)
  const { page, pageSize, q } = leerPageQuery(req.path)
  const activoStr = params.get("activo")
  const activo = activoStr === "true" ? true : activoStr === "false" ? false : undefined
  const termino = q?.toLowerCase().trim()
  const filtrados = dbClientes.filter((c) => {
    if (activo !== undefined && c.activo !== activo) {
      return false
    }
    if (termino && !c.nombre.toLowerCase().includes(termino)) {
      return false
    }
    return true
  })
  return paginar(filtrados, page, pageSize)
}

function buscarClienteIndice(id: string): number {
  return dbClientes.findIndex((c) => c.id === id)
}

const handleObtenerCliente: MockHandler = (req) => {
  const id = extractIdDeRuta(req.path, "/catalogo/clientes/")
  const cliente = dbClientes.find((c) => c.id === id)
  if (!cliente) {
    throw new ApiError(404, "NO_ENCONTRADO", "Cliente no encontrado.")
  }
  const detalle: ClienteDetalleResponse = { ...cliente, datosContacto: null }
  return detalle
}

const handleCrearCliente: MockHandler = (req) => {
  const input = (req.body ?? {}) as CrearClienteInput
  const nombre = input.nombre.trim()
  const colision = dbClientes.find((c) => c.nombre.trim().toLowerCase() === nombre.toLowerCase())
  if (colision) {
    throw new ApiError(409, "CLIENTE_DUPLICADO", "Ya existe un cliente con ese nombre.")
  }
  const ahora = isoAhora()
  const nuevo: ClienteResponse = {
    id: nuevoUuid("clie"),
    nombre,
    activo: true,
    fechaCreacion: ahora,
    createdAt: ahora,
    updatedAt: ahora,
  }
  dbClientes.unshift(nuevo)
  return nuevo
}

const handleActualizarCliente: MockHandler = (req) => {
  const id = extractIdDeRuta(req.path, "/catalogo/clientes/")
  const indice = buscarClienteIndice(id)
  if (indice < 0) {
    throw new ApiError(404, "NO_ENCONTRADO", "Cliente no encontrado.")
  }
  const actual = dbClientes[indice]
  if (!actual) {
    throw new ApiError(404, "NO_ENCONTRADO", "Cliente no encontrado.")
  }
  const input = (req.body ?? {}) as ActualizarClienteInput
  if (input.nombre !== undefined) {
    const nombre = input.nombre.trim()
    const colision = dbClientes.find(
      (c, i) => i !== indice && c.nombre.trim().toLowerCase() === nombre.toLowerCase(),
    )
    if (colision) {
      throw new ApiError(409, "CLIENTE_DUPLICADO", "Ya existe un cliente con ese nombre.")
    }
  }
  const actualizado: ClienteResponse = {
    ...actual,
    nombre: input.nombre?.trim() ?? actual.nombre,
    activo: input.activo ?? actual.activo,
    updatedAt: isoAhora(),
  }
  dbClientes[indice] = actualizado
  return actualizado
}

const handleEliminarCliente: MockHandler = (req) => {
  const id = extractIdDeRuta(req.path, "/catalogo/clientes/")
  const indice = buscarClienteIndice(id)
  if (indice < 0) {
    throw new ApiError(404, "NO_ENCONTRADO", "Cliente no encontrado.")
  }
  dbClientes.splice(indice, 1)
  return null
}

export const handlersCatalogo = [
  defineRoute("GET", /^\/catalogo\/areas(\?.*)?$/, handleListarAreas),
  defineRoute("GET", /^\/catalogo\/areas\/[^/?]+$/, handleObtenerArea),
  defineRoute("POST", /^\/catalogo\/areas$/, handleCrearArea),
  defineRoute("PATCH", /^\/catalogo\/areas\/[^/?]+$/, handleActualizarArea),
  defineRoute("DELETE", /^\/catalogo\/areas\/[^/?]+$/, handleEliminarArea),
  defineRoute("POST", /^\/catalogo\/skills\/fusionar$/, handleFusionarSkills),
  defineRoute("GET", /^\/catalogo\/skills(\?.*)?$/, handleListarSkills),
  defineRoute("POST", /^\/catalogo\/skills$/, handleCrearSkill),
  defineRoute("PATCH", /^\/catalogo\/skills\/[^/?]+$/, handleRenombrarSkill),
  defineRoute("DELETE", /^\/catalogo\/skills\/[^/?]+$/, handleEliminarSkill),
  defineRoute("POST", /^\/catalogo\/skills\/[^/?]+\/archivar$/, handleArchivarSkill),
  defineRoute("POST", /^\/catalogo\/skills\/[^/?]+\/desarchivar$/, handleDesarchivarSkill),
  defineRoute("POST", /^\/catalogo\/skills\/[^/?]+\/preview-cambio-area$/, handlePreviewCambioArea),
  defineRoute("POST", /^\/catalogo\/skills\/[^/?]+\/area$/, handleCambiarAreaSkill),
  defineRoute("GET", /^\/catalogo\/modulos(\?.*)?$/, handleListarModulos),
  defineRoute("POST", /^\/catalogo\/modulos$/, handleCrearModulo),
  defineRoute("PATCH", /^\/catalogo\/modulos\/[^/?]+$/, handleActualizarModulo),
  defineRoute("DELETE", /^\/catalogo\/modulos\/[^/?]+$/, handleEliminarModulo),
  defineRoute("POST", /^\/catalogo\/modulos\/[^/?]+\/archivar$/, handleArchivarModulo),
  defineRoute("POST", /^\/catalogo\/modulos\/[^/?]+\/desarchivar$/, handleDesarchivarModulo),
  defineRoute("GET", /^\/catalogo\/clientes(\?.*)?$/, handleListarClientes),
  defineRoute("GET", /^\/catalogo\/clientes\/[^/?]+$/, handleObtenerCliente),
  defineRoute("POST", /^\/catalogo\/clientes$/, handleCrearCliente),
  defineRoute("PATCH", /^\/catalogo\/clientes\/[^/?]+$/, handleActualizarCliente),
  defineRoute("DELETE", /^\/catalogo\/clientes\/[^/?]+$/, handleEliminarCliente),
]
