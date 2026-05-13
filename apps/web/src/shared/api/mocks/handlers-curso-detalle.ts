import type {
  CursoDetalle,
  DisponibilidadEntrevistaIaResponse,
  DisponibilidadTransversalResponse,
  MeAvanceCursoResponse,
  PlanResponseParticipante,
} from "@nexott-learn/shared-types"
import { ApiError } from "../api-error"
import { type MockRequest, defineRoute } from "./router"

const RTE_CURSO_DETALLE = /^\/cursos\/([^/?]+)(\?.*)?$/
const RTE_AVANCE_CURSO = /^\/me\/avance\/cursos\/([^/?]+)(\?.*)?$/
const RTE_PLAN = /^\/asignaciones\/([^/]+)\/plan$/
const RTE_DISP_TRANSVERSAL = /^\/asignaciones\/([^/]+)\/transversal\/disponibilidad$/
const RTE_DISP_IA = /^\/asignaciones\/([^/]+)\/entrevista-ia\/disponibilidad$/

const RGX_CURSO_ID = /^\/cursos\/([^/?]+)/
const RGX_AVANCE_CURSO_ID = /^\/me\/avance\/cursos\/([^/?]+)/
const RGX_PLAN_ASIG_ID = /^\/asignaciones\/([^/]+)\/plan/
const RGX_TRANS_ASIG_ID = /^\/asignaciones\/([^/]+)\/transversal/

function diasDesdeHoy(diasOffset: number): string {
  const f = new Date()
  f.setDate(f.getDate() + diasOffset)
  return f.toISOString()
}

function extraerId(path: string, regex: RegExp): string | null {
  const m = path.match(regex)
  return m?.[1] ?? null
}

function asignacionDesdeCursoId(cursoId: string): string {
  const map: ReadonlyMap<string, string> = new Map([
    ["curso-java-senior", "asg-java-001"],
    ["curso-react-frontend-mid", "asg-react-002"],
    ["curso-banking-suite", "asg-bank-003"],
    ["curso-spring-boot", "asg-spring-004"],
    ["curso-testing-pyramid", "asg-test-005"],
    ["curso-docker-k8s", "asg-docker-006"],
    ["curso-sql-avanzado", "asg-sql-007"],
    ["curso-arquitectura-hex", "asg-archi-008"],
    ["curso-aws-fundamentals", "asg-aws-009"],
    ["curso-python-data", "asg-py-010"],
    ["curso-networking", "asg-net-011"],
    ["curso-git-flows", "asg-git-012"],
  ])
  return map.get(cursoId) ?? "asg-unknown"
}

const CLIENTE_DEMO = "11111111-1111-1111-1111-111111111111"

const CURSOS_DETALLE: ReadonlyMap<string, CursoDetalle> = new Map([
  [
    "curso-java-senior",
    {
      id: "curso-java-senior",
      titulo: "Java Senior",
      clienteId: CLIENTE_DEMO,
      estado: "ACTIVO",
      fechaInicio: diasDesdeHoy(-30),
      fechaDeadline: diasDesdeHoy(12),
      fechaCierre: null,
      toggleVoluntarios: true,
      desbloqueo: "SIEMPRE",
      createdAt: diasDesdeHoy(-60),
      updatedAt: diasDesdeHoy(-1),
      toggleCierreAutomatico: false,
      umbralNoCumple: 30,
      pesoBloques: 50,
      pesoTransversal: 30,
      pesoEntrevista: 20,
      transversalId: "transv-java-001",
      entrevistaIaId: "entrev-java-001",
      fechaDesbloqueo: null,
      areasExigidas: [],
      skillsExigidas: [],
      modulosHabilitados: [],
    },
  ],
  [
    "curso-react-frontend-mid",
    {
      id: "curso-react-frontend-mid",
      titulo: "React Frontend Mid",
      clienteId: CLIENTE_DEMO,
      estado: "ACTIVO",
      fechaInicio: diasDesdeHoy(-15),
      fechaDeadline: diasDesdeHoy(27),
      fechaCierre: null,
      toggleVoluntarios: false,
      desbloqueo: "SIEMPRE",
      createdAt: diasDesdeHoy(-45),
      updatedAt: diasDesdeHoy(-1),
      toggleCierreAutomatico: false,
      umbralNoCumple: 30,
      pesoBloques: 70,
      pesoTransversal: 30,
      pesoEntrevista: 0,
      transversalId: "transv-react-001",
      entrevistaIaId: null,
      fechaDesbloqueo: null,
      areasExigidas: [],
      skillsExigidas: [],
      modulosHabilitados: [],
    },
  ],
])

function buildCursoFallback(cursoId: string): CursoDetalle {
  return {
    id: cursoId,
    titulo: "Curso demo",
    clienteId: CLIENTE_DEMO,
    estado: "ACTIVO",
    fechaInicio: diasDesdeHoy(-10),
    fechaDeadline: diasDesdeHoy(45),
    fechaCierre: null,
    toggleVoluntarios: false,
    desbloqueo: "SIEMPRE",
    createdAt: diasDesdeHoy(-30),
    updatedAt: diasDesdeHoy(-1),
    toggleCierreAutomatico: false,
    umbralNoCumple: 30,
    pesoBloques: 70,
    pesoTransversal: 30,
    pesoEntrevista: 0,
    transversalId: null,
    entrevistaIaId: null,
    fechaDesbloqueo: null,
    areasExigidas: [],
    skillsExigidas: [],
    modulosHabilitados: [],
  }
}

const PLAN_JAVA: PlanResponseParticipante = {
  planId: "plan-java-001",
  asignacionId: "asg-java-001",
  fechaCalculo: diasDesdeHoy(-30),
  avance: { seccionesCompletadas: 5, seccionesObligatorias: 8, porcentaje: 62 },
  items: [
    {
      moduloId: "mod-java-1",
      tituloModulo: "Java Fundamentos",
      secciones: [
        {
          seccionId: "sec-j1-1",
          titulo: "Sintaxis básica",
          caracter: "OBLIGATORIA",
          completada: true,
          avance: { bloquesCompletados: 4, bloquesTotales: 4 },
        },
        {
          seccionId: "sec-j1-2",
          titulo: "POO con Java",
          caracter: "OBLIGATORIA",
          completada: true,
          avance: { bloquesCompletados: 6, bloquesTotales: 6 },
        },
        {
          seccionId: "sec-j1-3",
          titulo: "Streams y lambdas",
          caracter: "OBLIGATORIA",
          completada: true,
          avance: { bloquesCompletados: 5, bloquesTotales: 5 },
        },
      ],
    },
    {
      moduloId: "mod-java-2",
      tituloModulo: "Spring Boot",
      secciones: [
        {
          seccionId: "sec-j2-1",
          titulo: "Sintaxis Spring",
          caracter: "OBLIGATORIA",
          completada: true,
          avance: { bloquesCompletados: 5, bloquesTotales: 5 },
        },
        {
          seccionId: "sec-j2-2",
          titulo: "APIs REST con Spring",
          caracter: "OBLIGATORIA",
          completada: false,
          avance: { bloquesCompletados: 2, bloquesTotales: 6 },
        },
        {
          seccionId: "sec-j2-3",
          titulo: "Spring Security",
          caracter: "OBLIGATORIA",
          completada: true,
          avance: { bloquesCompletados: 4, bloquesTotales: 4 },
        },
        {
          seccionId: "sec-j2-4",
          titulo: "Spring Data",
          caracter: "OBLIGATORIA",
          completada: false,
          avance: { bloquesCompletados: 0, bloquesTotales: 5 },
        },
      ],
    },
    {
      moduloId: "mod-java-3",
      tituloModulo: "Persistencia",
      secciones: [
        {
          seccionId: "sec-j3-1",
          titulo: "JPA básico",
          caracter: "OBLIGATORIA",
          completada: true,
          avance: { bloquesCompletados: 4, bloquesTotales: 4 },
        },
        {
          seccionId: "sec-j3-2",
          titulo: "Transacciones",
          caracter: "OBLIGATORIA",
          completada: false,
          avance: { bloquesCompletados: 0, bloquesTotales: 4 },
        },
        {
          seccionId: "sec-j3-3",
          titulo: "Tuning de queries",
          caracter: "OPCIONAL",
          completada: false,
          avance: { bloquesCompletados: 0, bloquesTotales: 3 },
        },
      ],
    },
  ],
}

function buildPlanFallback(asignacionId: string): PlanResponseParticipante {
  return {
    planId: `plan-${asignacionId}`,
    asignacionId,
    fechaCalculo: diasDesdeHoy(-7),
    avance: { seccionesCompletadas: 1, seccionesObligatorias: 3, porcentaje: 33 },
    items: [
      {
        moduloId: "mod-demo-1",
        tituloModulo: "Fundamentos",
        secciones: [
          {
            seccionId: "sec-demo-1-1",
            titulo: "Introducción",
            caracter: "OBLIGATORIA",
            completada: true,
            avance: { bloquesCompletados: 3, bloquesTotales: 3 },
          },
          {
            seccionId: "sec-demo-1-2",
            titulo: "Conceptos clave",
            caracter: "OBLIGATORIA",
            completada: false,
            avance: { bloquesCompletados: 1, bloquesTotales: 4 },
          },
          {
            seccionId: "sec-demo-1-3",
            titulo: "Profundización",
            caracter: "OBLIGATORIA",
            completada: false,
            avance: { bloquesCompletados: 0, bloquesTotales: 5 },
          },
        ],
      },
    ],
  }
}

const AVANCE_JAVA: MeAvanceCursoResponse = {
  cursoId: "curso-java-senior",
  estaCerrado: false,
  porcentajeAvance: 62,
  seccionesCompletadas: 6,
  seccionesObligatorias: 9,
  porSkill: [
    { skillId: "sk-1", etiqueta: "java.spring", notaActual: 78, claseColor: "verde" },
    { skillId: "sk-2", etiqueta: "java.spring-data", notaActual: 55, claseColor: "amarillo" },
    { skillId: "sk-3", etiqueta: "java.testing", notaActual: 30, claseColor: "rojo" },
    { skillId: "sk-4", etiqueta: "python.basico", notaActual: 88, claseColor: "verde" },
    { skillId: "sk-5", etiqueta: "rest.diseño", notaActual: null, claseColor: "rojo" },
  ],
  siguienteSeccion: {
    seccionId: "sec-j2-2",
    moduloId: "mod-java-2",
    titulo: "APIs REST con Spring",
  },
}

function buildAvanceFallback(cursoId: string): MeAvanceCursoResponse {
  return {
    cursoId,
    estaCerrado: false,
    porcentajeAvance: 30,
    seccionesCompletadas: 1,
    seccionesObligatorias: 3,
    porSkill: [
      { skillId: "sk-x1", etiqueta: "skill.demo", notaActual: 50, claseColor: "amarillo" },
    ],
    siguienteSeccion: null,
  }
}

function handlerCursoDetalle(req: MockRequest): CursoDetalle {
  const cursoId = extraerId(req.path, RGX_CURSO_ID)
  if (!cursoId) {
    throw new ApiError(404, "NOT_FOUND", "Curso no encontrado")
  }
  return CURSOS_DETALLE.get(cursoId) ?? buildCursoFallback(cursoId)
}

function handlerAvanceCurso(req: MockRequest): MeAvanceCursoResponse {
  const cursoId = extraerId(req.path, RGX_AVANCE_CURSO_ID)
  if (!cursoId) {
    throw new ApiError(404, "NOT_FOUND", "Curso no encontrado")
  }
  if (cursoId === "curso-java-senior") {
    return AVANCE_JAVA
  }
  return buildAvanceFallback(cursoId)
}

function handlerPlan(req: MockRequest): PlanResponseParticipante {
  const asignacionId = extraerId(req.path, RGX_PLAN_ASIG_ID) ?? "asg-unknown"
  if (asignacionId === "asg-java-001") {
    return PLAN_JAVA
  }
  return buildPlanFallback(asignacionId)
}

function handlerDispTransversal(req: MockRequest): DisponibilidadTransversalResponse {
  const asignacionId = extraerId(req.path, RGX_TRANS_ASIG_ID)
  const disponible = asignacionId === "asg-java-001"
  return {
    disponible,
    razon: disponible ? "PLAN_COMPLETADO" : "BLOQUEADO_PLAN_INCOMPLETO",
    fechaDisponibleDesde: disponible ? diasDesdeHoy(-1) : null,
  }
}

function handlerDispEntrevistaIa(_req: MockRequest): DisponibilidadEntrevistaIaResponse {
  return {
    disponible: false,
    razon: "PLAN_INCOMPLETO",
    intentosUsadosHoy: 0,
    maxPorHora: 5,
  }
}

// El primer alias permite localizar la asignación por curso desde otros mocks
// (por ejemplo, si un endpoint sólo conoce el curso).
export const _internalAsignacionDesdeCursoId = asignacionDesdeCursoId

export const handlersCursoDetalle = [
  defineRoute("GET", RTE_CURSO_DETALLE, handlerCursoDetalle),
  defineRoute("GET", RTE_AVANCE_CURSO, handlerAvanceCurso),
  defineRoute("GET", RTE_PLAN, handlerPlan),
  defineRoute("GET", RTE_DISP_TRANSVERSAL, handlerDispTransversal),
  defineRoute("GET", RTE_DISP_IA, handlerDispEntrevistaIa),
]
