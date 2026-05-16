import type {
  CursoDisponibleVoluntario,
  FichaResponse,
  MeBandejaResponse,
  MeCursoResumen,
  NotificacionBadgeResponse,
  NotificacionResumen,
  Paginated,
} from "@nexott-learn/shared-types"
import { type MockRequest, defineRoute } from "./router"

const RTE_ME_BANDEJA = /^\/me\/bandeja$/
const RTE_ME_CURSOS = /^\/me\/cursos(\?.*)?$/
const RTE_ME_FICHA = /^\/me\/ficha$/
const RTE_ME_FICHA_RESUMEN = /^\/me\/ficha\/resumen$/
const RTE_NOTIFICACIONES_BADGE = /^\/notificaciones\/badge$/
const RTE_NOTIFICACIONES = /^\/notificaciones(\?.*)?$/
const RTE_NOTIFICACION_MARCAR_LEIDA = /^\/notificaciones\/[^/]+\/marcar-leida$/
const RTE_NOTIFICACIONES_MARCAR_TODAS = /^\/notificaciones\/marcar-todas-leidas$/
const RTE_CURSOS_DISPONIBLES = /^\/cursos\/disponibles-voluntario(\?.*)?$/
const RGX_MARCAR_LEIDA_ID = /^\/notificaciones\/([^/]+)\/marcar-leida$/

// TODO B-2: cuando el backend implemente `skillsPendientesCount` en
// `MeCursoResumen`, mover al schema oficial y borrar.
// TODO B-extra: backend debe exponer `areaPrincipal` (al menos `codigo` +
// `nombre`) en `MeCursoResumen` para pintar color de área en bandeja y
// listado de "Mis cursos".
type MockMeCursoResumen = MeCursoResumen & {
  readonly skillsPendientesCount?: number
  readonly areaCodigo?: string | null
  readonly areaNombre?: string | null
}

// TODO B-3: cuando el backend implemente `GET /me/ficha/resumen`, mover este
// tipo a `@nexott-learn/shared-types` y borrar.
interface MockFichaResumenResponse {
  readonly totalAreasConActividad: number
  readonly topAreas: readonly {
    readonly areaId: string
    readonly areaNombre: string
    readonly areaCodigo: string
    readonly nivelCualitativo: "solido" | "enDesarrollo" | "inicial"
  }[]
  readonly ultimaSkillDemostrada: {
    readonly skillNombre: string
    readonly fecha: string
  } | null
}

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

const MOCK_MIS_CURSOS: readonly MockMeCursoResumen[] = [
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
    skillsPendientesCount: 4, // TODO B-2: backend debe devolver este campo.
    areaCodigo: "backend",
    areaNombre: "Backend",
  },
  {
    asignacionId: "asg-fullstack-013",
    cursoId: "curso-fullstack-devops",
    cursoTitulo: "Fundamentos Full-Stack & DevOps",
    cursoEstado: "ACTIVO",
    rol: "ASIGNADO",
    estadoAsignado: "EN_PROGRESO",
    estadoVoluntario: null,
    fechaInscripcion: diasDesdeHoy(-7),
    fechaDeadline: diasDesdeHoy(45),
    porcentajeAvance: 38,
    skillsPendientesCount: 3,
    areaCodigo: "frontend",
    areaNombre: "Frontend",
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
    areaCodigo: "frontend",
    areaNombre: "Frontend",
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
    areaCodigo: "backend",
    areaNombre: "Backend",
  },
  {
    asignacionId: "asg-spring-004",
    cursoId: "curso-spring-boot",
    cursoTitulo: "Spring Boot Avanzado",
    cursoEstado: "ACTIVO",
    rol: "ASIGNADO",
    estadoAsignado: "ASIGNADO",
    estadoVoluntario: null,
    fechaInscripcion: diasDesdeHoy(-2),
    fechaDeadline: diasDesdeHoy(60),
    porcentajeAvance: 0,
    areaCodigo: "backend",
    areaNombre: "Backend",
  },
  {
    asignacionId: "asg-test-005",
    cursoId: "curso-testing-pyramid",
    cursoTitulo: "Testing Pyramid en JS",
    cursoEstado: "ACTIVO",
    rol: "VOLUNTARIO",
    estadoAsignado: null,
    estadoVoluntario: "INSCRITO",
    fechaInscripcion: diasDesdeHoy(-1),
    fechaDeadline: diasDesdeHoy(45),
    porcentajeAvance: 5,
    areaCodigo: "qa",
    areaNombre: "QA",
  },
  {
    asignacionId: "asg-docker-006",
    cursoId: "curso-docker-k8s",
    cursoTitulo: "Docker y Kubernetes",
    cursoEstado: "CERRADO",
    rol: "ASIGNADO",
    estadoAsignado: "APTO",
    estadoVoluntario: null,
    fechaInscripcion: diasDesdeHoy(-120),
    fechaDeadline: diasDesdeHoy(-30),
    porcentajeAvance: 100,
    areaCodigo: "devops",
    areaNombre: "DevOps",
  },
  {
    asignacionId: "asg-sql-007",
    cursoId: "curso-sql-avanzado",
    cursoTitulo: "SQL Avanzado",
    cursoEstado: "CERRADO",
    rol: "VOLUNTARIO",
    estadoAsignado: null,
    estadoVoluntario: "COMPLETADO",
    fechaInscripcion: diasDesdeHoy(-90),
    fechaDeadline: diasDesdeHoy(-15),
    porcentajeAvance: 100,
    areaCodigo: "data",
    areaNombre: "Data",
  },
  {
    asignacionId: "asg-archi-008",
    cursoId: "curso-arquitectura-hex",
    cursoTitulo: "Arquitectura Hexagonal",
    cursoEstado: "ARCHIVADO",
    rol: "ASIGNADO",
    estadoAsignado: "RETIRADO",
    estadoVoluntario: null,
    fechaInscripcion: diasDesdeHoy(-200),
    fechaDeadline: diasDesdeHoy(-60),
    porcentajeAvance: 30,
    areaCodigo: "backend",
    areaNombre: "Backend",
  },
  {
    asignacionId: "asg-aws-009",
    cursoId: "curso-aws-fundamentals",
    cursoTitulo: "AWS Fundamentals",
    cursoEstado: "ACTIVO",
    rol: "VOLUNTARIO",
    estadoAsignado: null,
    estadoVoluntario: "EN_PROGRESO",
    fechaInscripcion: diasDesdeHoy(-20),
    fechaDeadline: diasDesdeHoy(40),
    porcentajeAvance: 25,
    areaCodigo: "cloud",
    areaNombre: "Cloud",
  },
  {
    asignacionId: "asg-py-010",
    cursoId: "curso-python-data",
    cursoTitulo: "Python para Data",
    cursoEstado: "ACTIVO",
    rol: "ASIGNADO",
    estadoAsignado: "LISTO",
    estadoVoluntario: null,
    fechaInscripcion: diasDesdeHoy(-45),
    fechaDeadline: diasDesdeHoy(5),
    porcentajeAvance: 100,
    areaCodigo: "data",
    areaNombre: "Data",
  },
  {
    asignacionId: "asg-net-011",
    cursoId: "curso-networking",
    cursoTitulo: "Networking esencial",
    cursoEstado: "ACTIVO",
    rol: "VOLUNTARIO",
    estadoAsignado: null,
    estadoVoluntario: "EN_PROGRESO",
    fechaInscripcion: diasDesdeHoy(-5),
    fechaDeadline: diasDesdeHoy(60),
    porcentajeAvance: 12,
    areaCodigo: "cloud",
    areaNombre: "Cloud",
  },
  {
    asignacionId: "asg-git-012",
    cursoId: "curso-git-flows",
    cursoTitulo: "Git workflows",
    cursoEstado: "CERRADO",
    rol: "ASIGNADO",
    estadoAsignado: "NO_APTO",
    estadoVoluntario: null,
    fechaInscripcion: diasDesdeHoy(-150),
    fechaDeadline: diasDesdeHoy(-80),
    porcentajeAvance: 70,
    areaCodigo: "devops",
    areaNombre: "DevOps",
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

function handlerMeCursos(req: MockRequest): Paginated<MockMeCursoResumen> {
  const page = leerNumeroQuery(req.path, "page", 1)
  const pageSize = leerNumeroQuery(req.path, "pageSize", 20)
  const estado = leerStringQuery(req.path, "estado")
  const rol = leerStringQuery(req.path, "rol")

  let filtrados: readonly MockMeCursoResumen[] = MOCK_MIS_CURSOS
  if (estado && estado !== "TODOS") {
    filtrados = filtrados.filter((c) => c.cursoEstado === estado)
  }
  if (rol && rol !== "TODOS") {
    filtrados = filtrados.filter((c) => c.rol === rol)
  }
  return paginar(filtrados, page, pageSize)
}

function handlerMeBandeja(_req: MockRequest): MeBandejaResponse {
  return {
    siguienteAccion: {
      tipo: "CONTINUAR_CURSO",
      asignacionId: "asg-java-001",
      cursoId: "curso-java-senior",
      cursoTitulo: "Java Senior",
      porcentajeAvance: 62,
      siguienteSeccionTitulo: "APIs REST con Spring",
    },
    // Bandas legacy — el nuevo diseño solo consume `siguienteAccion`.
    pendientes: [],
    novedades: [],
    contadores: {
      notificacionesNoLeidas: 0,
      cursosVoluntariadoAbiertos: MOCK_VOLUNTARIADO_TOTAL,
      cursosActivos: MOCK_MIS_CURSOS.filter((c) => c.cursoEstado === "ACTIVO").length,
    },
  }
}

// Mock de `GET /me/ficha` para la pantalla 07 "Mi ficha" (refundado).
// 6 areas con actividad (frontend, backend, cloud, data, devops, soft) + 2 sin
// actividad (mobile, qa). F2 anadira `nivelCualitativo` por area; F3 anadira
// `skillsCatalogo` para la seccion "Por explorar"; F4 anadira historial.
function handlerMeFicha(_req: MockRequest): FichaResponse {
  return {
    colaboradorId: "u-part",
    porArea: [
      {
        areaId: "area-frontend",
        nombre: "Frontend",
        promedio: 74,
        skillsConNota: 2,
        skillsTotales: 2,
        nivelCualitativo: "solido",
      },
      {
        areaId: "area-backend",
        nombre: "Backend",
        promedio: 88,
        skillsConNota: 3,
        skillsTotales: 3,
        nivelCualitativo: "excelencia",
      },
      {
        areaId: "area-cloud",
        nombre: "Cloud",
        promedio: 56,
        skillsConNota: 1,
        skillsTotales: 1,
        nivelCualitativo: "enDesarrollo",
      },
      {
        areaId: "area-data",
        nombre: "Data",
        promedio: 62,
        skillsConNota: 1,
        skillsTotales: 1,
        nivelCualitativo: "enDesarrollo",
      },
      {
        areaId: "area-devops",
        nombre: "DevOps",
        promedio: 48,
        skillsConNota: 1,
        skillsTotales: 1,
        nivelCualitativo: "inicial",
      },
      {
        areaId: "area-soft",
        nombre: "Soft Skills",
        promedio: 72,
        skillsConNota: 2,
        skillsTotales: 2,
        nivelCualitativo: "solido",
      },
      {
        areaId: "area-mobile",
        nombre: "Mobile",
        promedio: null,
        skillsConNota: 0,
        skillsTotales: 0,
        nivelCualitativo: "sinTocar",
      },
      {
        areaId: "area-qa",
        nombre: "QA",
        promedio: null,
        skillsConNota: 0,
        skillsTotales: 0,
        nivelCualitativo: "sinTocar",
      },
    ],
    skills: [
      {
        skillId: "sk-be-django",
        etiquetaVisible: "Django REST Framework",
        areaId: "area-backend",
        areaNombre: "Backend",
        notaActual: 86,
        origenActual: { tipo: "BLOQUE", cursoTitulo: "AMS Backend" },
        fechaUltimoCambio: diasDesdeHoy(-3),
      },
      {
        skillId: "sk-fe-react",
        etiquetaVisible: "React Hooks",
        areaId: "area-frontend",
        areaNombre: "Frontend",
        notaActual: 78,
        origenActual: { tipo: "BLOQUE", cursoTitulo: "Fundamentos Full-Stack & DevOps" },
        fechaUltimoCambio: diasDesdeHoy(-5),
      },
      {
        skillId: "sk-be-fastapi",
        etiquetaVisible: "FastAPI",
        areaId: "area-backend",
        areaNombre: "Backend",
        notaActual: 92,
        origenActual: { tipo: "ENTREVISTA_INICIAL" },
        fechaUltimoCambio: diasDesdeHoy(-60),
      },
      {
        skillId: "sk-fe-ts",
        etiquetaVisible: "TypeScript avanzado",
        areaId: "area-frontend",
        areaNombre: "Frontend",
        notaActual: 70,
        origenActual: { tipo: "ENTREVISTA_INICIAL" },
        fechaUltimoCambio: diasDesdeHoy(-65),
      },
      {
        skillId: "sk-be-python",
        etiquetaVisible: "Python avanzado",
        areaId: "area-backend",
        areaNombre: "Backend",
        notaActual: 86,
        origenActual: { tipo: "ENTREVISTA_INICIAL" },
        fechaUltimoCambio: diasDesdeHoy(-90),
      },
      {
        skillId: "sk-cl-azure",
        etiquetaVisible: "Azure App Service",
        areaId: "area-cloud",
        areaNombre: "Cloud",
        notaActual: 56,
        origenActual: { tipo: "TRANSVERSAL" },
        fechaUltimoCambio: diasDesdeHoy(-22),
      },
      {
        skillId: "sk-da-sql",
        etiquetaVisible: "SQL analitico",
        areaId: "area-data",
        areaNombre: "Data",
        notaActual: 62,
        origenActual: { tipo: "BLOQUE", cursoTitulo: "AMS Backend" },
        fechaUltimoCambio: diasDesdeHoy(-40),
      },
      {
        skillId: "sk-dv-docker",
        etiquetaVisible: "Docker basico",
        areaId: "area-devops",
        areaNombre: "DevOps",
        notaActual: 48,
        origenActual: { tipo: "BLOQUE", cursoTitulo: "Fundamentos Full-Stack & DevOps" },
        fechaUltimoCambio: diasDesdeHoy(-14),
      },
      {
        skillId: "sk-sf-comu",
        etiquetaVisible: "Comunicacion tecnica",
        areaId: "area-soft",
        areaNombre: "Soft Skills",
        notaActual: 74,
        origenActual: { tipo: "ENTREVISTA_INICIAL" },
        fechaUltimoCambio: diasDesdeHoy(-120),
      },
      {
        skillId: "sk-sf-trabajo",
        etiquetaVisible: "Trabajo en equipo",
        areaId: "area-soft",
        areaNombre: "Soft Skills",
        notaActual: 70,
        origenActual: { tipo: "ENTREVISTA_INICIAL" },
        fechaUltimoCambio: diasDesdeHoy(-120),
      },
    ],
  }
}

// TODO B-3: backend debe implementar `GET /me/ficha/resumen` con el shape
// definido en el_viaje_colaborador.md.
function handlerMeFichaResumen(_req: MockRequest): MockFichaResumenResponse {
  return {
    totalAreasConActividad: 6,
    topAreas: [
      {
        areaId: "area-backend",
        areaNombre: "Backend",
        areaCodigo: "backend",
        nivelCualitativo: "solido",
      },
      {
        areaId: "area-frontend",
        areaNombre: "Frontend",
        areaCodigo: "frontend",
        nivelCualitativo: "enDesarrollo",
      },
      {
        areaId: "area-cloud",
        areaNombre: "Cloud",
        areaCodigo: "cloud",
        nivelCualitativo: "solido",
      },
    ],
    ultimaSkillDemostrada: {
      skillNombre: "Spring Boot",
      fecha: diasDesdeHoy(-3),
    },
  }
}

const MOCK_AREAS_VOL: ReadonlyArray<{
  readonly id: string
  readonly nombre: string
  readonly codigo: string
}> = [
  { id: "area-mock-fe", nombre: "Frontend", codigo: "frontend" },
  { id: "area-mock-be", nombre: "Backend", codigo: "backend" },
  { id: "area-mock-qa", nombre: "Calidad y Testing", codigo: "qa" },
  { id: "area-mock-dv", nombre: "DevOps Azure", codigo: "devops" },
]

const AREA_FALLBACK = { id: "area-mock-fe", nombre: "Frontend", codigo: "frontend" }

function areaPorIndice(i: number): { id: string; nombre: string; codigo: string } {
  return MOCK_AREAS_VOL[i % MOCK_AREAS_VOL.length] ?? AREA_FALLBACK
}

function handlerCursosDisponibles(req: MockRequest): Paginated<CursoDisponibleVoluntario> {
  const page = leerNumeroQuery(req.path, "page", 1)
  const pageSize = leerNumeroQuery(req.path, "pageSize", 20)
  const data: readonly CursoDisponibleVoluntario[] = Array.from(
    { length: MOCK_VOLUNTARIADO_TOTAL },
    (_, i) => {
      const principal = areaPorIndice(i)
      const secundaria = areaPorIndice(i + 1)
      return {
        cursoId: `curso-vol-${i + 1}`,
        titulo: `Curso voluntariado ${i + 1}`,
        cliente: { id: `cli-${i + 1}`, nombre: "Cliente demo" },
        fechaInicio: diasDesdeHoy(-5),
        fechaDeadline: diasDesdeHoy(60),
        voluntariosInscritos: 0,
        areaPrincipal: principal,
        areasSecundarias: [secundaria],
        skillsDestacadas: [
          {
            id: `skill-${i}-1`,
            etiquetaVisible: "TypeScript",
            areaCodigo: principal.codigo,
          },
          {
            id: `skill-${i}-2`,
            etiquetaVisible: "Pytest",
            areaCodigo: secundaria.codigo,
          },
        ],
      }
    },
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
  defineRoute("GET", RTE_ME_BANDEJA, handlerMeBandeja),
  defineRoute("GET", RTE_ME_CURSOS, handlerMeCursos),
  defineRoute("GET", RTE_ME_FICHA, handlerMeFicha),
  defineRoute("GET", RTE_ME_FICHA_RESUMEN, handlerMeFichaResumen),
  defineRoute("GET", RTE_NOTIFICACIONES_BADGE, handlerNotificacionesBadge),
  defineRoute("GET", RTE_NOTIFICACIONES, handlerNotificaciones),
  defineRoute("POST", RTE_NOTIFICACION_MARCAR_LEIDA, handlerMarcarLeida),
  defineRoute("POST", RTE_NOTIFICACIONES_MARCAR_TODAS, handlerMarcarTodasLeidas),
  defineRoute("GET", RTE_CURSOS_DISPONIBLES, handlerCursosDisponibles),
]
