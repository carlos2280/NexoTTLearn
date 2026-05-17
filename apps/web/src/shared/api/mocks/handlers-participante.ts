import type {
  CursoDisponibleVoluntario,
  EntradaHistoricoNotaSkill,
  EventoHistorialFicha,
  FichaResponse,
  MeBandejaResponse,
  MeCursoResumen,
  NotificacionBadgeResponse,
  NotificacionResponse,
  NotificacionResumen,
  Paginated,
  PatchPreferenciasNotificacionInput,
  PreferenciasNotificacionResponse,
  ResumenCierreCurso,
  TipoEventoNotif,
} from "@nexott-learn/shared-types"
import { TIPOS_CRITICOS_NOTIF } from "@nexott-learn/shared-types"
import { ApiError } from "../api-error"
import { type MockRequest, defineRoute } from "./router"

const RTE_ME_BANDEJA = /^\/me\/bandeja$/
const RTE_ME_CURSOS = /^\/me\/cursos(\?.*)?$/
const RTE_ME_FICHA = /^\/me\/ficha$/
const RTE_ME_FICHA_RESUMEN = /^\/me\/ficha\/resumen$/
const RTE_ME_FICHA_HISTORIAL = /^\/me\/ficha\/historial(\?.*)?$/
const RTE_HISTORICO_SKILL = /^\/colaboradores\/[^/]+\/ficha\/skills\/[^/]+\/historico$/
const RGX_HISTORICO_SKILL = /^\/colaboradores\/[^/]+\/ficha\/skills\/([^/]+)\/historico$/
const RTE_RESUMEN_CIERRE = /^\/me\/cursos\/[^/]+\/resumen-cierre$/
const RGX_RESUMEN_CIERRE = /^\/me\/cursos\/([^/]+)\/resumen-cierre$/
const RTE_NOTIFICACIONES_BADGE = /^\/notificaciones\/badge$/
const RTE_NOTIFICACIONES_PREFERENCIAS = /^\/notificaciones\/preferencias$/
const RTE_NOTIFICACIONES = /^\/notificaciones(\?.*)?$/
const RTE_NOTIFICACION_DETALLE = /^\/notificaciones\/[^/]+$/
const RTE_NOTIFICACION_MARCAR_LEIDA = /^\/notificaciones\/[^/]+\/marcar-leida$/
const RTE_NOTIFICACIONES_MARCAR_TODAS = /^\/notificaciones\/marcar-todas-leidas$/
const RTE_NOTIFICACION_ARCHIVAR = /^\/notificaciones\/[^/]+\/archivar$/
const RTE_CURSOS_DISPONIBLES = /^\/cursos\/disponibles-voluntario(\?.*)?$/
const RGX_MARCAR_LEIDA_ID = /^\/notificaciones\/([^/]+)\/marcar-leida$/
const RGX_ARCHIVAR_ID = /^\/notificaciones\/([^/]+)\/archivar$/
const RGX_DETALLE_ID = /^\/notificaciones\/([^/]+)$/

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
    // HOY — 2 no leidas (1 critica)
    {
      id: "notif-1",
      tipoEvento: "TRANSVERSAL_DISPONIBLE",
      esCritico: false,
      fechaCreacion: diasDesdeHoy(0),
      leida: false,
      fechaLeida: null,
      archivada: false,
    },
    {
      id: "notif-2",
      tipoEvento: "CASO_REABIERTO",
      esCritico: true,
      fechaCreacion: diasDesdeHoy(0),
      leida: false,
      fechaLeida: null,
      archivada: false,
    },
    // ESTA SEMANA — 3 (2 no leidas + 1 leida)
    {
      id: "notif-3",
      tipoEvento: "ENTREVISTA_IA_DISPONIBLE",
      esCritico: false,
      fechaCreacion: diasDesdeHoy(-2),
      leida: false,
      fechaLeida: null,
      archivada: false,
    },
    {
      id: "notif-4",
      tipoEvento: "RECORDATORIO_DEADLINE",
      esCritico: false,
      fechaCreacion: diasDesdeHoy(-3),
      leida: true,
      fechaLeida: diasDesdeHoy(-2),
      archivada: false,
    },
    {
      id: "notif-5",
      tipoEvento: "PLAN_RECALCULADO",
      esCritico: false,
      fechaCreacion: diasDesdeHoy(-5),
      leida: false,
      fechaLeida: null,
      archivada: false,
    },
    // ANTERIOR — 4 (todas leidas, mezcla de tipos)
    {
      id: "notif-6",
      tipoEvento: "ASIGNACION_CURSO",
      esCritico: true,
      fechaCreacion: diasDesdeHoy(-12),
      leida: true,
      fechaLeida: diasDesdeHoy(-11),
      archivada: false,
    },
    {
      id: "notif-7",
      tipoEvento: "RESULTADO_CIERRE",
      esCritico: true,
      fechaCreacion: diasDesdeHoy(-20),
      leida: true,
      fechaLeida: diasDesdeHoy(-20),
      archivada: false,
    },
    {
      id: "notif-8",
      tipoEvento: "CURSO_DEADLINE",
      esCritico: false,
      fechaCreacion: diasDesdeHoy(-25),
      leida: true,
      fechaLeida: diasDesdeHoy(-25),
      archivada: false,
    },
    // ARCHIVADA — 1 (para validar tab "Archivadas")
    {
      id: "notif-archived-1",
      tipoEvento: "PLAN_RECALCULADO",
      esCritico: false,
      fechaCreacion: diasDesdeHoy(-40),
      leida: true,
      fechaLeida: diasDesdeHoy(-40),
      archivada: true,
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

// Permite alternar el "siguiente paso" desde devtools para validar pantallas
// dependientes (ej. trigger del cierre en la pantalla 08). Setea en consola:
//   localStorage.setItem("nexott-mock:bandeja-escenario", "cierre-apto")
//   localStorage.setItem("nexott-mock:bandeja-escenario", "cierre-apto-comentario")
//   localStorage.setItem("nexott-mock:bandeja-escenario", "cierre-no-apto")
// Borrar la clave o setear "continuar" devuelve al flujo normal.
const STORAGE_KEY_BANDEJA = "nexott-mock:bandeja-escenario"

function leerEscenarioBandeja(): string {
  if (typeof window === "undefined") {
    return "continuar"
  }
  return window.localStorage.getItem(STORAGE_KEY_BANDEJA) ?? "continuar"
}

function handlerMeBandeja(_req: MockRequest): MeBandejaResponse {
  return {
    siguienteAccion: siguienteAccionPorEscenario(leerEscenarioBandeja()),
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

function siguienteAccionPorEscenario(escenario: string): MeBandejaResponse["siguienteAccion"] {
  switch (escenario) {
    case "cierre-apto":
      return {
        tipo: "RESULTADO_CIERRE_LISTO",
        asignacionId: "asg-fullstack-013",
        cursoId: "curso-fullstack-devops",
        cursoTitulo: "Fundamentos Full-Stack & DevOps",
        resultado: "APTO",
        fechaCierre: diasDesdeHoy(-1),
      }
    case "cierre-apto-comentario":
      return {
        tipo: "RESULTADO_CIERRE_LISTO",
        asignacionId: "asg-java-001",
        cursoId: "curso-java-senior",
        cursoTitulo: "Java Senior",
        resultado: "APTO",
        fechaCierre: diasDesdeHoy(-2),
      }
    case "cierre-no-apto":
      return {
        tipo: "RESULTADO_CIERRE_LISTO",
        asignacionId: "asg-ams-014",
        cursoId: "curso-cierre-no-apto",
        cursoTitulo: "AMS Frontend + Backend Django",
        resultado: "NO_APTO",
        fechaCierre: diasDesdeHoy(-1),
      }
    default:
      return {
        tipo: "CONTINUAR_CURSO",
        asignacionId: "asg-java-001",
        cursoId: "curso-java-senior",
        cursoTitulo: "Java Senior",
        porcentajeAvance: 62,
        siguienteSeccionTitulo: "APIs REST con Spring",
      }
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
        skillsTotales: 4,
        nivelCualitativo: "solido",
        skillsCatalogo: [
          { skillId: "sk-fe-react", etiquetaVisible: "React Hooks" },
          { skillId: "sk-fe-ts", etiquetaVisible: "TypeScript avanzado" },
          { skillId: "sk-fe-css", etiquetaVisible: "CSS moderno" },
          { skillId: "sk-fe-perf", etiquetaVisible: "Performance web" },
        ],
      },
      {
        areaId: "area-backend",
        nombre: "Backend",
        promedio: 88,
        skillsConNota: 3,
        skillsTotales: 5,
        nivelCualitativo: "excelencia",
        skillsCatalogo: [
          { skillId: "sk-be-django", etiquetaVisible: "Django REST Framework" },
          { skillId: "sk-be-fastapi", etiquetaVisible: "FastAPI" },
          { skillId: "sk-be-python", etiquetaVisible: "Python avanzado" },
          { skillId: "sk-be-graphql", etiquetaVisible: "GraphQL" },
          { skillId: "sk-be-grpc", etiquetaVisible: "gRPC" },
        ],
      },
      {
        areaId: "area-cloud",
        nombre: "Cloud",
        promedio: 56,
        skillsConNota: 1,
        skillsTotales: 3,
        nivelCualitativo: "enDesarrollo",
        skillsCatalogo: [
          { skillId: "sk-cl-azure", etiquetaVisible: "Azure App Service" },
          { skillId: "sk-cl-functions", etiquetaVisible: "Azure Functions" },
          { skillId: "sk-cl-storage", etiquetaVisible: "Storage Accounts" },
        ],
      },
      {
        areaId: "area-data",
        nombre: "Data",
        promedio: 62,
        skillsConNota: 1,
        skillsTotales: 3,
        nivelCualitativo: "enDesarrollo",
        skillsCatalogo: [
          { skillId: "sk-da-sql", etiquetaVisible: "SQL analitico" },
          { skillId: "sk-da-etl", etiquetaVisible: "ETL con Python" },
          { skillId: "sk-da-bi", etiquetaVisible: "Modelado para BI" },
        ],
      },
      {
        areaId: "area-devops",
        nombre: "DevOps",
        promedio: 48,
        skillsConNota: 1,
        skillsTotales: 4,
        nivelCualitativo: "inicial",
        skillsCatalogo: [
          { skillId: "sk-dv-docker", etiquetaVisible: "Docker basico" },
          { skillId: "sk-dv-ci", etiquetaVisible: "CI/CD con GitHub Actions" },
          { skillId: "sk-dv-iac", etiquetaVisible: "Infra como codigo" },
          { skillId: "sk-dv-obs", etiquetaVisible: "Observabilidad" },
        ],
      },
      {
        areaId: "area-soft",
        nombre: "Soft Skills",
        promedio: 72,
        skillsConNota: 2,
        skillsTotales: 4,
        nivelCualitativo: "solido",
        skillsCatalogo: [
          { skillId: "sk-sf-comu", etiquetaVisible: "Comunicacion tecnica" },
          { skillId: "sk-sf-trabajo", etiquetaVisible: "Trabajo en equipo" },
          { skillId: "sk-sf-mentoria", etiquetaVisible: "Mentoria" },
          { skillId: "sk-sf-cliente", etiquetaVisible: "Trato con cliente" },
        ],
      },
      {
        areaId: "area-mobile",
        nombre: "Mobile",
        promedio: null,
        skillsConNota: 0,
        skillsTotales: 3,
        nivelCualitativo: "sinTocar",
        skillsCatalogo: [
          { skillId: "sk-mo-rn", etiquetaVisible: "React Native" },
          { skillId: "sk-mo-flutter", etiquetaVisible: "Flutter" },
          { skillId: "sk-mo-uxmovil", etiquetaVisible: "UX movil" },
        ],
      },
      {
        areaId: "area-qa",
        nombre: "QA",
        promedio: null,
        skillsConNota: 0,
        skillsTotales: 3,
        nivelCualitativo: "sinTocar",
        skillsCatalogo: [
          { skillId: "sk-qa-unit", etiquetaVisible: "Tests unitarios" },
          { skillId: "sk-qa-e2e", etiquetaVisible: "Tests E2E" },
          { skillId: "sk-qa-cypress", etiquetaVisible: "Cypress / Playwright" },
        ],
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

// Mock de `GET /me/cursos/:cursoId/resumen-cierre` (TODO B-26). Devuelve la
// "ceremonia" del veredicto para la pantalla 08. F1 cubre el caso APTO con
// "Fundamentos Full-Stack & DevOps" como curso de prueba; F2 anadira el caso
// NO_APTO y el comentario del admin.
function handlerResumenCierre(req: MockRequest): ResumenCierreCurso {
  const match = req.path.match(RGX_RESUMEN_CIERRE)
  const cursoId = match?.[1] ?? "curso-fullstack-devops"
  const base = RESUMENES_CIERRE[cursoId] ?? RESUMEN_CIERRE_DEFAULT
  return { ...base, cursoId }
}

const RESUMEN_CIERRE_DEFAULT: ResumenCierreCurso = {
  cursoId: "default",
  cursoTitulo: "Curso de prueba",
  fechaCierre: diasDesdeHoy(-1),
  resultado: "APTO",
  etiquetaCualitativaFinal: "solido",
  notaGlobalFinal: 78,
  skillsDemostradasNuevas: [],
  areasPorTrabajar: [],
  comentarioAdmin: null,
}

const RESUMENES_CIERRE: Readonly<Record<string, ResumenCierreCurso>> = {
  // Caso APTO limpio (sin comentario admin). Excelencia + 4 skills cosechadas.
  "curso-fullstack-devops": {
    cursoId: "curso-fullstack-devops",
    cursoTitulo: "Fundamentos Full-Stack & DevOps",
    fechaCierre: diasDesdeHoy(-1),
    resultado: "APTO",
    etiquetaCualitativaFinal: "excelencia",
    notaGlobalFinal: 88,
    skillsDemostradasNuevas: [
      {
        skillId: "sk-fe-react",
        skillNombre: "React Hooks",
        areaCodigo: "frontend",
        areaNombre: "Frontend",
      },
      {
        skillId: "sk-be-django",
        skillNombre: "Django REST Framework",
        areaCodigo: "backend",
        areaNombre: "Backend",
      },
      {
        skillId: "sk-dv-docker",
        skillNombre: "Docker basico",
        areaCodigo: "devops",
        areaNombre: "DevOps",
      },
      {
        skillId: "sk-da-sql",
        skillNombre: "SQL analitico",
        areaCodigo: "data",
        areaNombre: "Data",
      },
    ],
    areasPorTrabajar: [],
    comentarioAdmin: null,
  },
  // Caso APTO + comentario admin. Solido, 2 skills cosechadas.
  "curso-java-senior": {
    cursoId: "curso-java-senior",
    cursoTitulo: "Java Senior",
    fechaCierre: diasDesdeHoy(-2),
    resultado: "APTO",
    etiquetaCualitativaFinal: "solido",
    notaGlobalFinal: 78,
    skillsDemostradasNuevas: [
      {
        skillId: "sk-be-python",
        skillNombre: "Diseno OO avanzado",
        areaCodigo: "backend",
        areaNombre: "Backend",
      },
      {
        skillId: "sk-be-fastapi",
        skillNombre: "Patrones de concurrencia",
        areaCodigo: "backend",
        areaNombre: "Backend",
      },
    ],
    areasPorTrabajar: [],
    comentarioAdmin:
      "Solido manejo de los fundamentos. Te recomiendo profundizar en testing E2E para tu proxima asignacion.",
  },
  // Caso NO_APTO + comentario admin. En desarrollo, skills cosechadas igual
  // (cada paso suma) + areas a profundizar.
  "curso-cierre-no-apto": {
    cursoId: "curso-cierre-no-apto",
    cursoTitulo: "AMS Frontend + Backend Django",
    fechaCierre: diasDesdeHoy(-1),
    resultado: "NO_APTO",
    etiquetaCualitativaFinal: "enDesarrollo",
    notaGlobalFinal: 62,
    skillsDemostradasNuevas: [
      {
        skillId: "sk-be-django",
        skillNombre: "Django REST Framework",
        areaCodigo: "backend",
        areaNombre: "Backend",
      },
      {
        skillId: "sk-fe-react",
        skillNombre: "Tanstack Query",
        areaCodigo: "frontend",
        areaNombre: "Frontend",
      },
    ],
    areasPorTrabajar: [
      {
        areaId: "area-backend",
        areaNombre: "Backend",
        areaCodigo: "backend",
        nivelCualitativo: "enDesarrollo",
      },
      {
        areaId: "area-qa",
        areaNombre: "Testing",
        areaCodigo: "qa",
        nivelCualitativo: "inicial",
      },
    ],
    comentarioAdmin:
      "Buenas bases en backend, pero falta consolidar testing y la integracion frontend con el flujo asincrono. Repasa el modulo 3 antes de la proxima evaluacion.",
  },
}

// Mock de `GET /me/ficha/historial` (TODO B-24). Devuelve la coleccion
// completa de eventos cronologicos (cambios de skill + hitos de curso). El
// frontend pagina en memoria hasta que el backend implemente el endpoint
// real con cursor o `?limite=N&desde=...`.
function handlerMeFichaHistorial(_req: MockRequest): readonly EventoHistorialFicha[] {
  return EVENTOS_HISTORIAL
}

const EVENTOS_HISTORIAL: readonly EventoHistorialFicha[] = [
  {
    tipo: "SKILL_DEMOSTRADA",
    id: "evt-0",
    fecha: diasDesdeHoy(-3),
    skillId: "sk-be-arquitectura",
    skillNombre: "Arquitectura backend",
    areaId: "area-backend",
    areaNombre: "Backend",
    nivelCualitativo: "excelencia",
    origenNarrativo: 'Entrevista IA · Curso "Java Senior"',
    origen: "ENTREVISTA_IA",
    referenciaIntentoIaId: "00000000-0000-4000-c000-0001fa5e1001",
  },
  {
    tipo: "SKILL_DEMOSTRADA",
    id: "evt-1",
    fecha: diasDesdeHoy(-3),
    skillId: "sk-be-django",
    skillNombre: "Django REST Framework",
    areaId: "area-backend",
    areaNombre: "Backend",
    nivelCualitativo: "excelencia",
    origenNarrativo: 'Curso "AMS Backend"',
  },
  {
    tipo: "SKILL_DEMOSTRADA",
    id: "evt-2",
    fecha: diasDesdeHoy(-5),
    skillId: "sk-fe-react",
    skillNombre: "React Hooks",
    areaId: "area-frontend",
    areaNombre: "Frontend",
    nivelCualitativo: "solido",
    origenNarrativo: 'Curso "Fundamentos Full-Stack & DevOps"',
  },
  {
    tipo: "CURSO_INICIADO",
    id: "evt-3",
    fecha: diasDesdeHoy(-7),
    cursoId: "curso-fullstack-devops",
    cursoTitulo: "Fundamentos Full-Stack & DevOps",
  },
  {
    tipo: "SKILL_DEMOSTRADA",
    id: "evt-4",
    fecha: diasDesdeHoy(-14),
    skillId: "sk-dv-docker",
    skillNombre: "Docker basico",
    areaId: "area-devops",
    areaNombre: "DevOps",
    nivelCualitativo: "inicial",
    origenNarrativo: 'Curso "Fundamentos Full-Stack & DevOps"',
  },
  {
    tipo: "SKILL_DEMOSTRADA",
    id: "evt-5",
    fecha: diasDesdeHoy(-22),
    skillId: "sk-cl-azure",
    skillNombre: "Azure App Service",
    areaId: "area-cloud",
    areaNombre: "Cloud",
    nivelCualitativo: "enDesarrollo",
    origenNarrativo: 'Proyecto "Migracion AMS"',
  },
  {
    tipo: "CURSO_INICIADO",
    id: "evt-6",
    fecha: diasDesdeHoy(-30),
    cursoId: "curso-java-senior",
    cursoTitulo: "Java Senior",
  },
  {
    tipo: "SKILL_DEMOSTRADA",
    id: "evt-7",
    fecha: diasDesdeHoy(-40),
    skillId: "sk-da-sql",
    skillNombre: "SQL analitico",
    areaId: "area-data",
    areaNombre: "Data",
    nivelCualitativo: "enDesarrollo",
    origenNarrativo: 'Curso "AMS Backend"',
  },
  {
    tipo: "SKILL_DEMOSTRADA",
    id: "evt-8",
    fecha: diasDesdeHoy(-60),
    skillId: "sk-be-fastapi",
    skillNombre: "FastAPI",
    areaId: "area-backend",
    areaNombre: "Backend",
    nivelCualitativo: "excelencia",
    origenNarrativo: "Entrevista inicial",
  },
  {
    tipo: "SKILL_DEMOSTRADA",
    id: "evt-9",
    fecha: diasDesdeHoy(-90),
    skillId: "sk-be-python",
    skillNombre: "Python avanzado",
    areaId: "area-backend",
    areaNombre: "Backend",
    nivelCualitativo: "excelencia",
    origenNarrativo: "Entrevista inicial",
  },
  {
    tipo: "SKILL_DEMOSTRADA",
    id: "evt-10",
    fecha: diasDesdeHoy(-120),
    skillId: "sk-sf-comu",
    skillNombre: "Comunicacion tecnica",
    areaId: "area-soft",
    areaNombre: "Soft Skills",
    nivelCualitativo: "solido",
    origenNarrativo: "Entrevista inicial",
  },
]

// Mock de `GET /colaboradores/:id/ficha/skills/:skillId/historico`.
// Devuelve un historico determinista por `skillId`. Si el skillId no aparece,
// se devuelve un historico vacio (skill aun no demostrada).
function handlerHistoricoSkill(req: MockRequest): readonly EntradaHistoricoNotaSkill[] {
  const match = req.path.match(RGX_HISTORICO_SKILL)
  if (!match) {
    return []
  }
  const skillId = match[1] ?? ""
  return HISTORICO_POR_SKILL[skillId] ?? []
}

const HISTORICO_POR_SKILL: Readonly<Record<string, readonly EntradaHistoricoNotaSkill[]>> = {
  "sk-be-django": [
    {
      id: "hist-django-2",
      fecha: diasDesdeHoy(-3),
      valor: 86,
      origen: "BLOQUE",
      referencia: { cursoTitulo: "AMS Backend", bloqueTitulo: "REST con Django" },
      autorUsuarioId: null,
    },
    {
      id: "hist-django-1",
      fecha: diasDesdeHoy(-95),
      valor: 72,
      origen: "ENTREVISTA_INICIAL",
      referencia: null,
      autorUsuarioId: null,
    },
  ],
  "sk-be-fastapi": [
    {
      id: "hist-fastapi-1",
      fecha: diasDesdeHoy(-60),
      valor: 92,
      origen: "ENTREVISTA_INICIAL",
      referencia: null,
      autorUsuarioId: null,
    },
  ],
  "sk-be-python": [
    {
      id: "hist-python-1",
      fecha: diasDesdeHoy(-90),
      valor: 86,
      origen: "ENTREVISTA_INICIAL",
      referencia: null,
      autorUsuarioId: null,
    },
  ],
  "sk-fe-react": [
    {
      id: "hist-react-2",
      fecha: diasDesdeHoy(-5),
      valor: 78,
      origen: "BLOQUE",
      referencia: { cursoTitulo: "Fundamentos Full-Stack & DevOps" },
      autorUsuarioId: null,
    },
    {
      id: "hist-react-1",
      fecha: diasDesdeHoy(-110),
      valor: 60,
      origen: "ENTREVISTA_INICIAL",
      referencia: null,
      autorUsuarioId: null,
    },
  ],
  "sk-fe-ts": [
    {
      id: "hist-ts-1",
      fecha: diasDesdeHoy(-65),
      valor: 70,
      origen: "ENTREVISTA_INICIAL",
      referencia: null,
      autorUsuarioId: null,
    },
  ],
  "sk-cl-azure": [
    {
      id: "hist-azure-1",
      fecha: diasDesdeHoy(-22),
      valor: 56,
      origen: "TRANSVERSAL",
      referencia: { proyectoTitulo: "Migracion AMS" },
      autorUsuarioId: null,
    },
  ],
  "sk-da-sql": [
    {
      id: "hist-sql-1",
      fecha: diasDesdeHoy(-40),
      valor: 62,
      origen: "BLOQUE",
      referencia: { cursoTitulo: "AMS Backend" },
      autorUsuarioId: null,
    },
  ],
  "sk-dv-docker": [
    {
      id: "hist-docker-1",
      fecha: diasDesdeHoy(-14),
      valor: 48,
      origen: "BLOQUE",
      referencia: { cursoTitulo: "Fundamentos Full-Stack & DevOps" },
      autorUsuarioId: null,
    },
  ],
  "sk-sf-comu": [
    {
      id: "hist-comu-1",
      fecha: diasDesdeHoy(-120),
      valor: 74,
      origen: "ENTREVISTA_INICIAL",
      referencia: null,
      autorUsuarioId: null,
    },
  ],
  "sk-sf-trabajo": [
    {
      id: "hist-trabajo-1",
      fecha: diasDesdeHoy(-120),
      valor: 70,
      origen: "ENTREVISTA_INICIAL",
      referencia: null,
      autorUsuarioId: null,
    },
  ],
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
  // archivada=true → solo archivadas. archivada=false (default) → solo no archivadas.
  const soloArchivadas = archivadaParam === "true"
  lista = lista.filter((n) => n.archivada === soloArchivadas)
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

// Payloads mockeados por notificacion id. Cuando el backend exponga el
// payload en el listado resumido, esto desaparece y el centro evita un
// fetch por item.
const PAYLOAD_POR_ID: ReadonlyMap<string, Record<string, unknown>> = new Map([
  [
    "notif-1",
    { asignacionId: "asg-java-001", cursoId: "curso-java-senior", cursoTitulo: "Java Senior" },
  ],
  [
    "notif-2",
    {
      asignacionId: "asg-fullstack-013",
      cursoId: "curso-fullstack-devops",
      cursoTitulo: "Fundamentos Full-Stack & DevOps",
    },
  ],
  [
    "notif-3",
    { asignacionId: "asg-java-001", cursoId: "curso-java-senior", cursoTitulo: "Java Senior" },
  ],
  [
    "notif-4",
    {
      asignacionId: "asg-fullstack-013",
      cursoId: "curso-fullstack-devops",
      cursoTitulo: "Fundamentos Full-Stack & DevOps",
    },
  ],
  [
    "notif-5",
    { asignacionId: "asg-java-001", cursoId: "curso-java-senior", cursoTitulo: "Java Senior" },
  ],
  [
    "notif-6",
    {
      asignacionId: "asg-react-007",
      cursoId: "curso-react-frontend-mid",
      cursoTitulo: "React Frontend Mid",
    },
  ],
  [
    "notif-7",
    {
      asignacionId: "asg-fullstack-013",
      cursoId: "curso-fullstack-devops",
      cursoTitulo: "Fundamentos Full-Stack & DevOps",
    },
  ],
  [
    "notif-8",
    {
      asignacionId: "asg-react-007",
      cursoId: "curso-react-frontend-mid",
      cursoTitulo: "React Frontend Mid",
    },
  ],
  [
    "notif-archived-1",
    { asignacionId: "asg-java-001", cursoId: "curso-java-senior", cursoTitulo: "Java Senior" },
  ],
])

function handlerDetalleNotificacion(req: MockRequest): NotificacionResponse {
  const match = req.path.match(RGX_DETALLE_ID)
  const id = match?.[1] ?? null
  const notif = id ? stateNotificaciones.notificaciones.find((n) => n.id === id) : null
  if (!notif) {
    throw new ApiError(404, "NOTIFICACION_NO_ENCONTRADA", "No encuentro esa notificación.")
  }
  return {
    ...notif,
    payload: PAYLOAD_POR_ID.get(notif.id) ?? {},
    canalesEnviados: ["IN_APP"],
    errorCorreo: null,
  }
}

const PREFERENCIAS_STORAGE_KEY = "nexott-mock-preferencias-notif"

function leerPreferenciasGuardadas(): readonly TipoEventoNotif[] {
  if (typeof window === "undefined") {
    return []
  }
  try {
    const raw = window.localStorage.getItem(PREFERENCIAS_STORAGE_KEY)
    if (!raw) {
      return []
    }
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }
    return parsed.filter((v): v is TipoEventoNotif => typeof v === "string")
  } catch {
    return []
  }
}

function guardarPreferencias(silenciados: readonly TipoEventoNotif[]): void {
  if (typeof window === "undefined") {
    return
  }
  window.localStorage.setItem(PREFERENCIAS_STORAGE_KEY, JSON.stringify(silenciados))
}

function handlerObtenerPreferencias(): PreferenciasNotificacionResponse {
  return {
    silenciados: leerPreferenciasGuardadas(),
    tiposCriticos: TIPOS_CRITICOS_NOTIF,
  }
}

function handlerActualizarPreferencias(req: MockRequest): PreferenciasNotificacionResponse {
  const body = (req.body ?? {}) as Partial<PatchPreferenciasNotificacionInput>
  const silenciar = Array.isArray(body.silenciar) ? body.silenciar : []
  const desilenciar = Array.isArray(body.desilenciar) ? body.desilenciar : []

  const contradiccion = silenciar.find((t) => desilenciar.includes(t))
  if (contradiccion) {
    throw new ApiError(
      422,
      // biome-ignore lint/nursery/noSecrets: codigo de error del API, no es un secreto
      "validacionTipoEnSilenciarYDesilenciar",
      "Un mismo tipo no puede silenciarse y desilenciarse a la vez.",
    )
  }
  const criticoInvalido = silenciar.find((t) => TIPOS_CRITICOS_NOTIF.includes(t))
  if (criticoInvalido) {
    throw new ApiError(
      422,
      // biome-ignore lint/nursery/noSecrets: codigo de error del API, no es un secreto
      "validacionTipoCriticoNoSilenciable",
      "Ese tipo de notificación es crítico y no se puede silenciar.",
    )
  }

  const actual = new Set(leerPreferenciasGuardadas())
  for (const tipo of silenciar) {
    actual.add(tipo)
  }
  for (const tipo of desilenciar) {
    actual.delete(tipo)
  }

  const siguiente: readonly TipoEventoNotif[] = Array.from(actual)
  guardarPreferencias(siguiente)
  return { silenciados: siguiente, tiposCriticos: TIPOS_CRITICOS_NOTIF }
}

function handlerArchivar(req: MockRequest): void {
  const match = req.path.match(RGX_ARCHIVAR_ID)
  if (!match) {
    return
  }
  const id = match[1]
  const idx = stateNotificaciones.notificaciones.findIndex((n) => n.id === id)
  if (idx === -1) {
    return
  }
  const notif = stateNotificaciones.notificaciones[idx]
  if (!notif) {
    return
  }
  stateNotificaciones.notificaciones[idx] = { ...notif, archivada: true }
}

export const handlersParticipante = [
  defineRoute("GET", RTE_ME_BANDEJA, handlerMeBandeja),
  defineRoute("GET", RTE_ME_CURSOS, handlerMeCursos),
  defineRoute("GET", RTE_ME_FICHA, handlerMeFicha),
  defineRoute("GET", RTE_ME_FICHA_HISTORIAL, handlerMeFichaHistorial),
  defineRoute("GET", RTE_HISTORICO_SKILL, handlerHistoricoSkill),
  defineRoute("GET", RTE_ME_FICHA_RESUMEN, handlerMeFichaResumen),
  defineRoute("GET", RTE_RESUMEN_CIERRE, handlerResumenCierre),
  defineRoute("GET", RTE_NOTIFICACIONES_BADGE, handlerNotificacionesBadge),
  defineRoute("GET", RTE_NOTIFICACIONES_PREFERENCIAS, handlerObtenerPreferencias),
  defineRoute("PATCH", RTE_NOTIFICACIONES_PREFERENCIAS, handlerActualizarPreferencias),
  defineRoute("GET", RTE_NOTIFICACIONES, handlerNotificaciones),
  defineRoute("POST", RTE_NOTIFICACION_MARCAR_LEIDA, handlerMarcarLeida),
  defineRoute("POST", RTE_NOTIFICACIONES_MARCAR_TODAS, handlerMarcarTodasLeidas),
  defineRoute("POST", RTE_NOTIFICACION_ARCHIVAR, handlerArchivar),
  defineRoute("GET", RTE_NOTIFICACION_DETALLE, handlerDetalleNotificacion),
  defineRoute("GET", RTE_CURSOS_DISPONIBLES, handlerCursosDisponibles),
]
