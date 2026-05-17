import type {
  CursoArbolResponse,
  CursoDetalle,
  DisponibilidadEntrevistaIaResponse,
  DisponibilidadTransversalResponse,
  EtiquetaCualitativa,
  MeAvanceCursoResponse,
  PlanResponseParticipante,
} from "@nexott-learn/shared-types"
import { ApiError } from "../api-error"
import { type MockRequest, defineRoute } from "./router"

// TODO B-4: cuando el backend implemente `caminoHaciaApto.porArea` en
// `MeAvanceCursoResponse`, borrar este tipo local y usar el oficial.
interface MockCaminoPorArea {
  readonly areaId: string
  readonly areaCodigo: string
  readonly areaNombre: string
  readonly skillsExigidas: number
  readonly skillsDemostradas: number
  readonly nivelCualitativo: "solido" | "enDesarrollo" | "porExplorar"
}
type MockAvanceConCamino = MeAvanceCursoResponse & {
  readonly caminoHaciaApto: {
    readonly faltantesParaApto: number
    readonly estaListo: boolean
    readonly porArea: readonly MockCaminoPorArea[]
  }
}

// TODO B-6: cuando el backend implemente `motivoBloqueo` en disponibilidades,
// borrar estos tipos locales y usar los oficiales.
type MockDispTransversal = DisponibilidadTransversalResponse & {
  readonly motivoBloqueo: string | null
}
type MockDispEntrevistaIa = DisponibilidadEntrevistaIaResponse & {
  readonly motivoBloqueo: string | null
}

const RTE_CURSO_DETALLE = /^\/cursos\/([^/?]+)(\?.*)?$/
const RTE_AVANCE_CURSO = /^\/me\/avance\/cursos\/([^/?]+)(\?.*)?$/
const RTE_ARBOL_CURSO = /^\/me\/cursos\/([^/?]+)\/arbol(\?.*)?$/
const RTE_PLAN = /^\/asignaciones\/([^/]+)\/plan$/
const RTE_DISP_TRANSVERSAL = /^\/asignaciones\/([^/]+)\/transversal\/disponibilidad$/
const RTE_DISP_IA = /^\/asignaciones\/([^/]+)\/entrevista-ia\/disponibilidad$/

const RGX_CURSO_ID = /^\/cursos\/([^/?]+)/
const RGX_AVANCE_CURSO_ID = /^\/me\/avance\/cursos\/([^/?]+)/
const RGX_ARBOL_CURSO_ID = /^\/me\/cursos\/([^/?]+)\/arbol/
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
    ["curso-fullstack-devops", "asg-fullstack-013"],
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
  [
    "curso-fullstack-devops",
    {
      id: "curso-fullstack-devops",
      titulo: "Fundamentos Full-Stack & DevOps",
      clienteId: CLIENTE_DEMO,
      estado: "ACTIVO",
      fechaInicio: diasDesdeHoy(-7),
      fechaDeadline: diasDesdeHoy(45),
      fechaCierre: null,
      toggleVoluntarios: true,
      desbloqueo: "SIEMPRE",
      createdAt: diasDesdeHoy(-20),
      updatedAt: diasDesdeHoy(-1),
      toggleCierreAutomatico: false,
      umbralNoCumple: 30,
      pesoBloques: 70,
      pesoTransversal: 20,
      pesoEntrevista: 10,
      transversalId: "transv-fullstack-001",
      entrevistaIaId: "entrev-fullstack-001",
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

const PLAN_FULLSTACK: PlanResponseParticipante = {
  planId: "plan-fullstack-001",
  asignacionId: "asg-fullstack-013",
  fechaCalculo: diasDesdeHoy(-7),
  avance: { seccionesCompletadas: 3, seccionesObligatorias: 8, porcentaje: 38 },
  items: [
    {
      moduloId: "mod-fs-1",
      tituloModulo: "Frontend Esencial",
      secciones: [
        {
          seccionId: "sec-fs-1-1",
          titulo: "HTML semántico",
          caracter: "OBLIGATORIA",
          completada: true,
          avance: { bloquesCompletados: 4, bloquesTotales: 4 },
        },
        {
          seccionId: "sec-fs-1-2",
          titulo: "JavaScript moderno",
          caracter: "OBLIGATORIA",
          completada: true,
          avance: { bloquesCompletados: 5, bloquesTotales: 5 },
        },
        {
          seccionId: "sec-fs-1-3",
          titulo: "TypeScript esencial",
          caracter: "OBLIGATORIA",
          completada: false,
          avance: { bloquesCompletados: 3, bloquesTotales: 6 },
        },
      ],
    },
    {
      moduloId: "mod-fs-2",
      tituloModulo: "Backend con Python",
      secciones: [
        {
          seccionId: "sec-fs-2-1",
          titulo: "Python para APIs",
          caracter: "OBLIGATORIA",
          completada: false,
          avance: { bloquesCompletados: 2, bloquesTotales: 5 },
        },
      ],
    },
    {
      moduloId: "mod-fs-3",
      tituloModulo: "DevOps & Cloud",
      secciones: [
        {
          seccionId: "sec-fs-3-1",
          titulo: "Git: workflow básico",
          caracter: "OBLIGATORIA",
          completada: true,
          avance: { bloquesCompletados: 4, bloquesTotales: 4 },
        },
        {
          seccionId: "sec-fs-3-2",
          titulo: "Git: ramas y PRs",
          caracter: "OBLIGATORIA",
          completada: false,
          avance: { bloquesCompletados: 0, bloquesTotales: 5 },
        },
        {
          seccionId: "sec-fs-4-1",
          titulo: "Azure: servicios core",
          caracter: "OBLIGATORIA",
          completada: false,
          avance: { bloquesCompletados: 0, bloquesTotales: 4 },
        },
        {
          seccionId: "sec-fs-4-2",
          titulo: "Azure: deploy básico",
          caracter: "OPCIONAL",
          completada: false,
          avance: { bloquesCompletados: 0, bloquesTotales: 4 },
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

const AVANCE_JAVA: MockAvanceConCamino = {
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
  // TODO B-4: backend debe devolver este bloque agregado por área (sin skills granulares).
  caminoHaciaApto: {
    faltantesParaApto: 4,
    estaListo: false,
    porArea: [
      {
        areaId: "area-backend",
        areaCodigo: "backend",
        areaNombre: "Backend",
        skillsExigidas: 5,
        skillsDemostradas: 3,
        nivelCualitativo: "enDesarrollo",
      },
      {
        areaId: "area-data",
        areaCodigo: "data",
        areaNombre: "Data",
        skillsExigidas: 3,
        skillsDemostradas: 1,
        nivelCualitativo: "porExplorar",
      },
      {
        areaId: "area-cloud",
        areaCodigo: "cloud",
        areaNombre: "Cloud",
        skillsExigidas: 4,
        skillsDemostradas: 4,
        nivelCualitativo: "solido",
      },
    ],
  },
}

const AVANCE_FULLSTACK: MockAvanceConCamino = {
  cursoId: "curso-fullstack-devops",
  estaCerrado: false,
  porcentajeAvance: 38,
  seccionesCompletadas: 3,
  seccionesObligatorias: 7,
  porSkill: [
    { skillId: "sk-fs-html", etiqueta: "html.semantico", notaActual: 85, claseColor: "verde" },
    { skillId: "sk-fs-js", etiqueta: "js.moderno", notaActual: 72, claseColor: "verde" },
    { skillId: "sk-fs-ts", etiqueta: "ts.basico", notaActual: 48, claseColor: "amarillo" },
    { skillId: "sk-fs-py", etiqueta: "python.apis", notaActual: 35, claseColor: "amarillo" },
    { skillId: "sk-fs-git", etiqueta: "git.workflow", notaActual: 80, claseColor: "verde" },
    { skillId: "sk-fs-az", etiqueta: "azure.basico", notaActual: null, claseColor: "rojo" },
  ],
  siguienteSeccion: {
    seccionId: "sec-fs-1-3",
    moduloId: "mod-fs-1",
    titulo: "TypeScript esencial",
  },
  caminoHaciaApto: {
    faltantesParaApto: 3,
    estaListo: false,
    porArea: [
      {
        areaId: "area-frontend",
        areaCodigo: "frontend",
        areaNombre: "Frontend",
        skillsExigidas: 3,
        skillsDemostradas: 2,
        nivelCualitativo: "enDesarrollo",
      },
      {
        areaId: "area-backend",
        areaCodigo: "backend",
        areaNombre: "Backend",
        skillsExigidas: 1,
        skillsDemostradas: 0,
        nivelCualitativo: "porExplorar",
      },
      {
        areaId: "area-cloud",
        areaCodigo: "cloud",
        areaNombre: "Cloud & DevOps",
        skillsExigidas: 2,
        skillsDemostradas: 1,
        nivelCualitativo: "enDesarrollo",
      },
    ],
  },
}

function buildAvanceFallback(cursoId: string): MockAvanceConCamino {
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
    // TODO B-4: backend debe devolver este bloque agregado por área.
    caminoHaciaApto: {
      faltantesParaApto: 6,
      estaListo: false,
      porArea: [
        {
          areaId: "area-frontend",
          areaCodigo: "frontend",
          areaNombre: "Frontend",
          skillsExigidas: 4,
          skillsDemostradas: 1,
          nivelCualitativo: "porExplorar",
        },
        {
          areaId: "area-backend",
          areaCodigo: "backend",
          areaNombre: "Backend",
          skillsExigidas: 3,
          skillsDemostradas: 0,
          nivelCualitativo: "porExplorar",
        },
      ],
    },
  }
}

const ARBOL_JAVA: CursoArbolResponse = {
  modo: "asignado",
  asignacionId: "asg-java-001",
  curso: {
    id: "curso-java-senior",
    titulo: "Java Senior",
    estado: "ACTIVO",
    fechaInicio: diasDesdeHoy(-30),
    fechaDeadline: diasDesdeHoy(45),
    cliente: { id: CLIENTE_DEMO, nombre: "Banco Demo" },
    areaPrincipal: { id: "area-backend", nombre: "Backend", codigo: "backend" },
    skillsDestacadas: [
      { id: "sk-1", etiquetaVisible: "Spring Boot", areaCodigo: "backend" },
      { id: "sk-2", etiquetaVisible: "Spring Data", areaCodigo: "backend" },
      { id: "sk-3", etiquetaVisible: "JPA", areaCodigo: "backend" },
      { id: "sk-4", etiquetaVisible: "Testing JVM", areaCodigo: "qa" },
    ],
  },
  modulos: [
    {
      moduloId: "mod-java-1",
      titulo: "Java Fundamentos",
      orden: 1,
      secciones: [
        { seccionId: "sec-j1-1", titulo: "Sintaxis básica", orden: 1, totalBloques: 4 },
        { seccionId: "sec-j1-2", titulo: "POO con Java", orden: 2, totalBloques: 6 },
        { seccionId: "sec-j1-3", titulo: "Streams y lambdas", orden: 3, totalBloques: 5 },
      ],
    },
    {
      moduloId: "mod-java-2",
      titulo: "Spring Boot",
      orden: 2,
      secciones: [
        { seccionId: "sec-j2-1", titulo: "Sintaxis Spring", orden: 1, totalBloques: 5 },
        { seccionId: "sec-j2-2", titulo: "APIs REST con Spring", orden: 2, totalBloques: 6 },
        { seccionId: "sec-j2-3", titulo: "Spring Security", orden: 3, totalBloques: 4 },
        { seccionId: "sec-j2-4", titulo: "Spring Data", orden: 4, totalBloques: 5 },
      ],
    },
    {
      moduloId: "mod-java-3",
      titulo: "Persistencia",
      orden: 3,
      secciones: [
        { seccionId: "sec-j3-1", titulo: "JPA básico", orden: 1, totalBloques: 4 },
        { seccionId: "sec-j3-2", titulo: "Transacciones", orden: 2, totalBloques: 4 },
        { seccionId: "sec-j3-3", titulo: "Tuning de queries", orden: 3, totalBloques: 3 },
      ],
    },
  ],
}

const ARBOL_FULLSTACK: CursoArbolResponse = {
  modo: "asignado",
  asignacionId: "asg-fullstack-013",
  curso: {
    id: "curso-fullstack-devops",
    titulo: "Fundamentos Full-Stack & DevOps",
    estado: "ACTIVO",
    fechaInicio: diasDesdeHoy(-7),
    fechaDeadline: diasDesdeHoy(45),
    cliente: { id: CLIENTE_DEMO, nombre: "Banco Demo" },
    areaPrincipal: { id: "area-frontend", nombre: "Frontend", codigo: "frontend" },
    skillsDestacadas: [
      { id: "sk-fs-html", etiquetaVisible: "HTML & CSS", areaCodigo: "frontend" },
      { id: "sk-fs-js", etiquetaVisible: "JavaScript moderno", areaCodigo: "frontend" },
      { id: "sk-fs-ts", etiquetaVisible: "TypeScript", areaCodigo: "frontend" },
      { id: "sk-fs-py", etiquetaVisible: "Python", areaCodigo: "backend" },
      { id: "sk-fs-git", etiquetaVisible: "Git & GitHub", areaCodigo: "cloud" },
      { id: "sk-fs-az", etiquetaVisible: "Azure", areaCodigo: "cloud" },
    ],
  },
  modulos: [
    {
      moduloId: "mod-fs-1",
      titulo: "Frontend Esencial",
      orden: 1,
      secciones: [
        { seccionId: "sec-fs-1-1", titulo: "HTML semántico", orden: 1, totalBloques: 4 },
        { seccionId: "sec-fs-1-2", titulo: "JavaScript moderno", orden: 2, totalBloques: 5 },
        { seccionId: "sec-fs-1-3", titulo: "TypeScript esencial", orden: 3, totalBloques: 6 },
      ],
    },
    {
      moduloId: "mod-fs-2",
      titulo: "Backend con Python",
      orden: 2,
      secciones: [
        { seccionId: "sec-fs-2-1", titulo: "Python para APIs", orden: 1, totalBloques: 5 },
      ],
    },
    {
      moduloId: "mod-fs-3",
      titulo: "DevOps & Cloud",
      orden: 3,
      secciones: [
        { seccionId: "sec-fs-3-1", titulo: "Git: workflow básico", orden: 1, totalBloques: 4 },
        { seccionId: "sec-fs-3-2", titulo: "Git: ramas y PRs", orden: 2, totalBloques: 5 },
        { seccionId: "sec-fs-4-1", titulo: "Azure: servicios core", orden: 3, totalBloques: 4 },
        { seccionId: "sec-fs-4-2", titulo: "Azure: deploy básico", orden: 4, totalBloques: 4 },
      ],
    },
  ],
}

function buildArbolFallback(cursoId: string): CursoArbolResponse {
  return {
    modo: "asignado",
    asignacionId: asignacionDesdeCursoId(cursoId),
    curso: {
      id: cursoId,
      titulo: "Curso demo",
      estado: "ACTIVO",
      fechaInicio: diasDesdeHoy(-15),
      fechaDeadline: diasDesdeHoy(30),
      cliente: { id: CLIENTE_DEMO, nombre: "Cliente demo" },
      areaPrincipal: { id: "area-frontend", nombre: "Frontend", codigo: "frontend" },
      skillsDestacadas: [],
    },
    modulos: [
      {
        moduloId: "mod-demo-1",
        titulo: "Introducción",
        orden: 1,
        secciones: [
          { seccionId: "sec-demo-1-1", titulo: "Bienvenida", orden: 1, totalBloques: 2 },
          { seccionId: "sec-demo-1-2", titulo: "Primeros pasos", orden: 2, totalBloques: 3 },
          { seccionId: "sec-demo-1-3", titulo: "Profundización", orden: 3, totalBloques: 5 },
        ],
      },
    ],
  }
}

function handlerArbolCurso(req: MockRequest): CursoArbolResponse {
  const cursoId = extraerId(req.path, RGX_ARBOL_CURSO_ID)
  if (!cursoId) {
    throw new ApiError(404, "NOT_FOUND", "Curso no encontrado")
  }
  if (cursoId === "curso-java-senior") {
    return ARBOL_JAVA
  }
  if (cursoId === "curso-fullstack-devops") {
    return ARBOL_FULLSTACK
  }
  return buildArbolFallback(cursoId)
}

function handlerCursoDetalle(req: MockRequest): CursoDetalle {
  const cursoId = extraerId(req.path, RGX_CURSO_ID)
  if (!cursoId) {
    throw new ApiError(404, "NOT_FOUND", "Curso no encontrado")
  }
  return CURSOS_DETALLE.get(cursoId) ?? buildCursoFallback(cursoId)
}

function handlerAvanceCurso(req: MockRequest): MockAvanceConCamino {
  const cursoId = extraerId(req.path, RGX_AVANCE_CURSO_ID)
  if (!cursoId) {
    throw new ApiError(404, "NOT_FOUND", "Curso no encontrado")
  }
  let base: MockAvanceConCamino
  if (cursoId === "curso-java-senior") {
    base = AVANCE_JAVA
  } else if (cursoId === "curso-fullstack-devops") {
    base = AVANCE_FULLSTACK
  } else {
    base = buildAvanceFallback(cursoId)
  }
  return aplicarCierreSiCorresponde(base, cursoId)
}

// Permite alternar el banner persistente "Curso cerrado" del inmersivo desde
// devtools. Setea en consola:
//   localStorage.setItem("nexott-mock:cursos-cerrados", "curso-java-senior,curso-cierre-no-apto")
// y recarga el inmersivo del curso. Borra la clave para volver a flujo normal.
const STORAGE_KEY_CURSOS_CERRADOS = "nexott-mock:cursos-cerrados"

const CIERRE_POR_CURSO: Readonly<Record<string, { etiqueta: EtiquetaCualitativa; nota: number }>> =
  {
    "curso-fullstack-devops": { etiqueta: "excelencia", nota: 88 },
    "curso-java-senior": { etiqueta: "solido", nota: 78 },
    "curso-cierre-no-apto": { etiqueta: "enDesarrollo", nota: 62 },
  }

function leerCursosCerrados(): ReadonlySet<string> {
  if (typeof window === "undefined") {
    return new Set()
  }
  const raw = window.localStorage.getItem(STORAGE_KEY_CURSOS_CERRADOS)
  if (!raw) {
    return new Set()
  }
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  )
}

function aplicarCierreSiCorresponde(
  base: MockAvanceConCamino,
  cursoId: string,
): MockAvanceConCamino {
  if (!leerCursosCerrados().has(cursoId)) {
    return base
  }
  const cierre = CIERRE_POR_CURSO[cursoId] ?? { etiqueta: "solido" as const, nota: 70 }
  return {
    ...base,
    estaCerrado: true,
    etiquetaCualitativaFinal: cierre.etiqueta,
    notaGlobalFinal: cierre.nota,
  }
}

function handlerPlan(req: MockRequest): PlanResponseParticipante {
  const asignacionId = extraerId(req.path, RGX_PLAN_ASIG_ID) ?? "asg-unknown"
  if (asignacionId === "asg-java-001") {
    return PLAN_JAVA
  }
  if (asignacionId === "asg-fullstack-013") {
    return PLAN_FULLSTACK
  }
  return buildPlanFallback(asignacionId)
}

function handlerDispTransversal(req: MockRequest): MockDispTransversal {
  const asignacionId = extraerId(req.path, RGX_TRANS_ASIG_ID)
  const disponible = asignacionId === "asg-java-001"
  return {
    disponible,
    razon: disponible ? "PLAN_COMPLETADO" : "BLOQUEADO_PLAN_INCOMPLETO",
    fechaDisponibleDesde: disponible ? diasDesdeHoy(-1) : null,
    // TODO B-6: backend debe devolver `motivoBloqueo` para no hardcodear copy en cliente.
    motivoBloqueo: disponible ? null : "Completa tu plan de estudio",
  }
}

function handlerDispEntrevistaIa(_req: MockRequest): MockDispEntrevistaIa {
  return {
    disponible: false,
    razon: "PLAN_INCOMPLETO",
    intentosUsadosHoy: 0,
    maxPorHora: 5,
    // TODO B-6: backend debe devolver `motivoBloqueo` para no hardcodear copy en cliente.
    motivoBloqueo: "Aprueba el proyecto transversal",
  }
}

// El primer alias permite localizar la asignación por curso desde otros mocks
// (por ejemplo, si un endpoint sólo conoce el curso).
export const _internalAsignacionDesdeCursoId = asignacionDesdeCursoId

export const handlersCursoDetalle = [
  defineRoute("GET", RTE_ARBOL_CURSO, handlerArbolCurso),
  defineRoute("GET", RTE_CURSO_DETALLE, handlerCursoDetalle),
  defineRoute("GET", RTE_AVANCE_CURSO, handlerAvanceCurso),
  defineRoute("GET", RTE_PLAN, handlerPlan),
  defineRoute("GET", RTE_DISP_TRANSVERSAL, handlerDispTransversal),
  defineRoute("GET", RTE_DISP_IA, handlerDispEntrevistaIa),
]
