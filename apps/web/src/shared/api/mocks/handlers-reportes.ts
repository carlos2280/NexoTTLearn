import type {
  CentroRevisionResponse,
  EficaciaPlataformaResponse,
  EventoHistorico,
  FilaAvanceCurso,
  InventarioSkillsResponse,
  Paginated,
} from "@nexott-learn/shared-types"
import { type MockHandler, defineRoute } from "./router"

const RTE_CENTRO_REVISION = /^\/reportes\/centro-revision(\?.*)?$/
const RTE_EFICACIA = /^\/reportes\/eficacia-plataforma(\?.*)?$/
const RTE_INVENTARIO_SKILLS = /^\/reportes\/inventario-skills(\?.*)?$/
const RTE_AVANCE_CURSO = /^\/reportes\/avance-curso(\?.*)?$/

const RESPUESTA_CENTRO_REVISION_VACIA: CentroRevisionResponse = {
  transversales: [],
  entrevistasIa: [],
  totales: { transversales: 0, entrevistasIa: 0 },
  meta: { frescura: new Date().toISOString() },
}

const obtenerCentroRevisionHandler: MockHandler = () => RESPUESTA_CENTRO_REVISION_VACIA

const RESPUESTA_EFICACIA: EficaciaPlataformaResponse = {
  presentadosCliente: 48,
  aptos: {
    total: 36,
    pasaron: 27,
    noPasaron: 6,
    pendientes: 3,
  },
  noAptos: {
    total: 19,
    presentadosIgual: 12,
    pasaronIgual: 4,
  },
  correlacion: 0.62,
  observacionesFrecuentes: [
    { texto: "Comprensión de negocio insuficiente en entrevista", casos: 8 },
    { texto: "Profundidad técnica por debajo del umbral", casos: 6 },
    { texto: "Comunicación poco estructurada", casos: 4 },
    { texto: "Falta de ejemplos concretos del CV", casos: 3 },
  ],
  meta: {
    frescura: new Date().toISOString(),
    scopeHash: "a3f29c1b8e4d7f02",
  },
}

const obtenerEficaciaHandler: MockHandler = () => RESPUESTA_EFICACIA

const AREA_FRONTEND = "11111111-1111-1111-1111-111111111111"
const AREA_BACKEND = "22222222-2222-2222-2222-222222222222"
const AREA_CLOUD = "33333333-3333-3333-3333-333333333333"
const AREA_DATA = "44444444-4444-4444-4444-444444444444"
const AREA_SOFT = "55555555-5555-5555-5555-555555555555"

const RESPUESTA_INVENTARIO_SKILLS: InventarioSkillsResponse = {
  skills: [
    {
      skillId: "sk-react",
      etiqueta: "React",
      areaId: AREA_FRONTEND,
      totalColaboradores: 42,
      porEtiquetaCualitativa: { excelencia: 11, solido: 18, enDesarrollo: 9, noCumple: 4 },
    },
    {
      skillId: "sk-typescript",
      etiqueta: "TypeScript",
      areaId: AREA_FRONTEND,
      totalColaboradores: 38,
      porEtiquetaCualitativa: { excelencia: 9, solido: 16, enDesarrollo: 10, noCumple: 3 },
    },
    {
      skillId: "sk-nodejs",
      etiqueta: "Node.js",
      areaId: AREA_BACKEND,
      totalColaboradores: 35,
      porEtiquetaCualitativa: { excelencia: 7, solido: 14, enDesarrollo: 9, noCumple: 5 },
    },
    {
      skillId: "sk-postgres",
      etiqueta: "PostgreSQL",
      areaId: AREA_BACKEND,
      totalColaboradores: 28,
      porEtiquetaCualitativa: { excelencia: 5, solido: 10, enDesarrollo: 8, noCumple: 5 },
    },
    {
      skillId: "sk-aws",
      etiqueta: "AWS",
      areaId: AREA_CLOUD,
      totalColaboradores: 24,
      porEtiquetaCualitativa: { excelencia: 3, solido: 8, enDesarrollo: 9, noCumple: 4 },
    },
    {
      skillId: "sk-kubernetes",
      etiqueta: "Kubernetes",
      areaId: AREA_CLOUD,
      totalColaboradores: 18,
      porEtiquetaCualitativa: { excelencia: 2, solido: 5, enDesarrollo: 7, noCumple: 4 },
    },
    {
      skillId: "sk-python",
      etiqueta: "Python",
      areaId: AREA_DATA,
      totalColaboradores: 31,
      porEtiquetaCualitativa: { excelencia: 8, solido: 13, enDesarrollo: 7, noCumple: 3 },
    },
    {
      skillId: "sk-comunicacion",
      etiqueta: "Comunicación con cliente",
      areaId: AREA_SOFT,
      totalColaboradores: 52,
      porEtiquetaCualitativa: { excelencia: 14, solido: 22, enDesarrollo: 11, noCumple: 5 },
    },
  ],
  meta: {
    frescura: new Date().toISOString(),
    scopeHash: "b7c4e8d1f3a902e5",
  },
}

const obtenerInventarioSkillsHandler: MockHandler = () => RESPUESTA_INVENTARIO_SKILLS

const FILAS_AVANCE: readonly FilaAvanceCurso[] = [
  {
    asignacionId: "as-001",
    colaborador: { id: "c-001", nombre: "María Fernández", email: "maria.fernandez@nttdata.com" },
    estado: "EN_PROGRESO",
    porcentajeAvance: 78,
    alertas: [],
  },
  {
    asignacionId: "as-002",
    colaborador: { id: "c-002", nombre: "Diego Cabrera", email: "diego.cabrera@nttdata.com" },
    estado: "EN_PROGRESO",
    porcentajeAvance: 42,
    alertas: ["SIN_ACTIVIDAD_7_DIAS"],
  },
  {
    asignacionId: "as-003",
    colaborador: { id: "c-003", nombre: "Lucía Romero", email: "lucia.romero@nttdata.com" },
    estado: "APTO",
    porcentajeAvance: 100,
    alertas: [],
  },
  {
    asignacionId: "as-004",
    colaborador: { id: "c-004", nombre: "Andrés Pinto", email: "andres.pinto@nttdata.com" },
    estado: "ASIGNADO",
    porcentajeAvance: 0,
    alertas: ["PLAN_NO_CALCULADO"],
  },
  {
    asignacionId: "as-005",
    colaborador: { id: "c-005", nombre: "Sofía Núñez", email: "sofia.nunez@nttdata.com" },
    estado: "EN_PROGRESO",
    porcentajeAvance: 64,
    alertas: ["PLAN_DESACTUALIZADO"],
  },
  {
    asignacionId: "as-006",
    colaborador: { id: "c-006", nombre: "Bruno Acosta", email: "bruno.acosta@nttdata.com" },
    estado: "EN_PROGRESO",
    porcentajeAvance: 28,
    alertas: ["SIN_ACTIVIDAD_7_DIAS", "INTENTO_INVALIDADO_RECIENTE"],
  },
  {
    asignacionId: "as-007",
    colaborador: { id: "c-007", nombre: "Camila Ortega", email: "camila.ortega@nttdata.com" },
    estado: "APTO",
    porcentajeAvance: 100,
    alertas: [],
  },
  {
    asignacionId: "as-008",
    colaborador: { id: "c-008", nombre: "Pablo Salinas", email: "pablo.salinas@nttdata.com" },
    estado: "NO_APTO",
    porcentajeAvance: 92,
    alertas: [],
  },
  {
    asignacionId: "as-009",
    colaborador: { id: "c-009", nombre: "Valentina Báez", email: "valentina.baez@nttdata.com" },
    estado: "EN_PROGRESO",
    porcentajeAvance: 55,
    alertas: [],
  },
  {
    asignacionId: "as-010",
    colaborador: { id: "c-010", nombre: "Mateo Galeano", email: "mateo.galeano@nttdata.com" },
    estado: "EN_PROGRESO",
    porcentajeAvance: 87,
    alertas: [],
  },
]

const EVENTOS_HISTORICO: readonly EventoHistorico[] = [
  {
    tipoCambio: "ESTADO_ACTUALIZADO",
    fecha: new Date(Date.now() - 86400_000 * 1).toISOString(),
    autor: "Admin · Carla Mendoza",
    valorPrev: "EN_PROGRESO",
    valorNuevo: "APTO",
    motivo: null,
  },
  {
    tipoCambio: "PLAN_RECALCULADO",
    fecha: new Date(Date.now() - 86400_000 * 2).toISOString(),
    autor: "Sistema",
    valorPrev: "v3",
    valorNuevo: "v4",
    motivo: "Skills exigidas actualizadas",
  },
  {
    tipoCambio: "INTENTO_INVALIDADO",
    fecha: new Date(Date.now() - 86400_000 * 3).toISOString(),
    autor: "Admin · Carla Mendoza",
    valorPrev: "VALIDO",
    valorNuevo: "INVALIDADO",
    motivo: "Sospecha de copia detectada en revisión manual",
  },
  {
    tipoCambio: "ASIGNACION_CREADA",
    fecha: new Date(Date.now() - 86400_000 * 14).toISOString(),
    autor: "Admin · Carla Mendoza",
    valorPrev: null,
    valorNuevo: "ASIGNADO",
    motivo: null,
  },
  {
    tipoCambio: "CURSO_PUBLICADO",
    fecha: new Date(Date.now() - 86400_000 * 21).toISOString(),
    autor: "Admin · Marcos Britos",
    valorPrev: "BORRADOR",
    valorNuevo: "PUBLICADO",
    motivo: null,
  },
]

function paginar<T>(items: readonly T[], page: number, pageSize: number): Paginated<T> {
  const start = (page - 1) * pageSize
  const data = items.slice(start, start + pageSize)
  return {
    data,
    meta: {
      page,
      pageSize,
      total: items.length,
      totalPages: Math.max(1, Math.ceil(items.length / pageSize)),
    },
  }
}

const obtenerAvanceCursoHandler: MockHandler = (req) => {
  const url = new URL(req.path, "http://x")
  const vista = url.searchParams.get("vista") ?? "ACTUAL"
  const page = Number(url.searchParams.get("page") ?? "1")
  const pageSize = Number(url.searchParams.get("pageSize") ?? "20")

  if (vista === "HISTORICO") {
    return paginar(EVENTOS_HISTORICO, page, pageSize)
  }
  return paginar(FILAS_AVANCE, page, pageSize)
}

export const handlersReportes = [
  defineRoute("GET", RTE_CENTRO_REVISION, obtenerCentroRevisionHandler),
  defineRoute("GET", RTE_EFICACIA, obtenerEficaciaHandler),
  defineRoute("GET", RTE_INVENTARIO_SKILLS, obtenerInventarioSkillsHandler),
  defineRoute("GET", RTE_AVANCE_CURSO, obtenerAvanceCursoHandler),
]
