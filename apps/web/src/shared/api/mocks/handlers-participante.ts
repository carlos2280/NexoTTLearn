import type {
  CursoDisponibleVoluntario,
  MeCursoResumen,
  NotificacionBadgeResponse,
  NotificacionResumen,
  Paginated,
} from "@nexott-learn/shared-types"
import { type MockRequest, defineRoute } from "./router"

const RTE_ME_CURSOS = /^\/me\/cursos(\?.*)?$/
const RTE_NOTIFICACIONES_BADGE = /^\/notificaciones\/badge$/
const RTE_NOTIFICACIONES = /^\/notificaciones(\?.*)?$/
const RTE_NOTIFICACION_MARCAR_LEIDA = /^\/notificaciones\/[^/]+\/marcar-leida$/
const RTE_NOTIFICACIONES_MARCAR_TODAS = /^\/notificaciones\/marcar-todas-leidas$/
const RTE_CURSOS_DISPONIBLES = /^\/cursos\/disponibles-voluntario(\?.*)?$/
const RGX_MARCAR_LEIDA_ID = /^\/notificaciones\/([^/]+)\/marcar-leida$/

function diasDesdeHoy(diasOffset: number): string {
  const fecha = new Date()
  fecha.setDate(fecha.getDate() + diasOffset)
  return fecha.toISOString()
}

interface MockNotificacionState {
  notificaciones: NotificacionResumen[]
}

const stateNotificaciones: MockNotificacionState = {
  notificaciones: [
    {
      id: "notif-1",
      tipoEvento: "TRANSVERSAL_DISPONIBLE",
      esCritico: false,
      fechaCreacion: diasDesdeHoy(-0),
      leida: false,
      fechaLeida: null,
      archivada: false,
    },
    {
      id: "notif-2",
      tipoEvento: "PLAN_RECALCULADO",
      esCritico: false,
      fechaCreacion: diasDesdeHoy(-1),
      leida: false,
      fechaLeida: null,
      archivada: false,
    },
    {
      id: "notif-3",
      tipoEvento: "RECORDATORIO_DEADLINE",
      esCritico: false,
      fechaCreacion: diasDesdeHoy(-3),
      leida: false,
      fechaLeida: null,
      archivada: false,
    },
  ],
}

const MOCK_MIS_CURSOS: readonly MeCursoResumen[] = [
  {
    asignacionId: "asg-java-001",
    cursoId: "curso-java-senior",
    cursoTitulo: "Java Senior",
    cursoEstado: "ACTIVO",
    rol: "ASIGNADO",
    estadoAsignado: "EN_PROGRESO",
    estadoVoluntario: null,
    fechaInscripcion: diasDesdeHoy(-30),
    fechaDeadline: diasDesdeHoy(12),
    porcentajeAvance: 62,
  },
  {
    asignacionId: "asg-react-002",
    cursoId: "curso-react-frontend-mid",
    cursoTitulo: "React Frontend Mid",
    cursoEstado: "ACTIVO",
    rol: "ASIGNADO",
    estadoAsignado: "EN_PROGRESO",
    estadoVoluntario: null,
    fechaInscripcion: diasDesdeHoy(-15),
    fechaDeadline: diasDesdeHoy(27),
    porcentajeAvance: 18,
  },
  {
    asignacionId: "asg-bank-003",
    cursoId: "curso-banking-suite",
    cursoTitulo: "Banking Suite",
    cursoEstado: "ACTIVO",
    rol: "VOLUNTARIO",
    estadoAsignado: null,
    estadoVoluntario: "EN_PROGRESO",
    fechaInscripcion: diasDesdeHoy(-10),
    fechaDeadline: diasDesdeHoy(90),
    porcentajeAvance: 45,
  },
]

const MOCK_VOLUNTARIADO_TOTAL = 8

function paginar<T>(data: readonly T[], page = 1, pageSize = 20): Paginated<T> {
  const total = data.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const inicio = (page - 1) * pageSize
  return {
    data: data.slice(inicio, inicio + pageSize),
    meta: { page, pageSize, total, totalPages },
  }
}

function leerNumeroQuery(path: string, clave: string, fallback: number): number {
  const idx = path.indexOf("?")
  if (idx < 0) {
    return fallback
  }
  const sp = new URLSearchParams(path.slice(idx + 1))
  const valor = sp.get(clave)
  const num = valor ? Number.parseInt(valor, 10) : Number.NaN
  return Number.isFinite(num) && num > 0 ? num : fallback
}

function leerStringQuery(path: string, clave: string): string | null {
  const idx = path.indexOf("?")
  if (idx < 0) {
    return null
  }
  return new URLSearchParams(path.slice(idx + 1)).get(clave)
}

function handlerMeCursos(req: MockRequest): Paginated<MeCursoResumen> {
  const page = leerNumeroQuery(req.path, "page", 1)
  const pageSize = leerNumeroQuery(req.path, "pageSize", 20)
  return paginar(MOCK_MIS_CURSOS, page, pageSize)
}

function handlerCursosDisponibles(req: MockRequest): Paginated<CursoDisponibleVoluntario> {
  const page = leerNumeroQuery(req.path, "page", 1)
  const pageSize = leerNumeroQuery(req.path, "pageSize", 20)
  const data: readonly CursoDisponibleVoluntario[] = Array.from(
    { length: MOCK_VOLUNTARIADO_TOTAL },
    (_, i) => ({
      cursoId: `curso-vol-${i + 1}`,
      titulo: `Curso voluntariado ${i + 1}`,
      cliente: { id: `cli-${i + 1}`, nombre: "Cliente demo" },
      fechaInicio: diasDesdeHoy(-5),
      fechaDeadline: diasDesdeHoy(60),
      voluntariosInscritos: 0,
    }),
  )
  return paginar(data, page, pageSize)
}

function handlerNotificacionesBadge(): NotificacionBadgeResponse {
  return {
    noLeidas: stateNotificaciones.notificaciones.filter((n) => !(n.leida || n.archivada)).length,
  }
}

function handlerNotificaciones(req: MockRequest): Paginated<NotificacionResumen> {
  const page = leerNumeroQuery(req.path, "page", 1)
  const pageSize = leerNumeroQuery(req.path, "pageSize", 20)
  const leidaParam = leerStringQuery(req.path, "leida")
  const archivadaParam = leerStringQuery(req.path, "archivada") ?? "false"
  let lista = stateNotificaciones.notificaciones.slice()
  if (leidaParam !== null) {
    const filtro = leidaParam === "true"
    lista = lista.filter((n) => n.leida === filtro)
  }
  if (archivadaParam === "false") {
    lista = lista.filter((n) => !n.archivada)
  }
  lista.sort((a, b) => b.fechaCreacion.localeCompare(a.fechaCreacion))
  return paginar(lista, page, pageSize)
}

function handlerMarcarLeida(req: MockRequest): void {
  const match = req.path.match(RGX_MARCAR_LEIDA_ID)
  if (!match) {
    return
  }
  const id = match[1]
  const notif = stateNotificaciones.notificaciones.find((n) => n.id === id)
  if (notif && !notif.leida) {
    const ahora = new Date().toISOString()
    const idx = stateNotificaciones.notificaciones.indexOf(notif)
    stateNotificaciones.notificaciones[idx] = { ...notif, leida: true, fechaLeida: ahora }
  }
}

function handlerMarcarTodasLeidas(): void {
  const ahora = new Date().toISOString()
  stateNotificaciones.notificaciones = stateNotificaciones.notificaciones.map((n) =>
    n.leida ? n : { ...n, leida: true, fechaLeida: ahora },
  )
}

export const handlersParticipante = [
  defineRoute("GET", RTE_ME_CURSOS, handlerMeCursos),
  defineRoute("GET", RTE_NOTIFICACIONES_BADGE, handlerNotificacionesBadge),
  defineRoute("GET", RTE_NOTIFICACIONES, handlerNotificaciones),
  defineRoute("POST", RTE_NOTIFICACION_MARCAR_LEIDA, handlerMarcarLeida),
  defineRoute("POST", RTE_NOTIFICACIONES_MARCAR_TODAS, handlerMarcarTodasLeidas),
  defineRoute("GET", RTE_CURSOS_DISPONIBLES, handlerCursosDisponibles),
]
