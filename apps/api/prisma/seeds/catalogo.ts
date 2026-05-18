// Catalogo + actores del seed-frontend: admins, areas, skills, cliente y
// participantes. Cada const expone los datos canonicos del curso y cada
// `seedXxx` los persiste de forma idempotente.

import {
  EstadoAsignado,
  EstadoEmpleado,
  EstadoSkill,
  EstadoVoluntario,
  type PrismaClient,
  ResultadoEntrevistaCliente,
  RolAsignacion,
  RolUsuario,
} from "@prisma/client"
import bcrypt from "bcrypt"

import { ADMIN_PASSWORD, DIAS_CADUCIDAD, FACTOR_BCRYPT, USER_PASSWORD } from "./_config"
import {
  adminId,
  bloqueId,
  clienteId,
  dateNDaysAgo,
  dateNDaysAhead,
  log,
  partId,
  skillId,
} from "./_utils"

// ============================================================================
// Definicion: admins NTT (autonomos, no dependen de seed-qa)
// ============================================================================

export interface AdminDef {
  readonly idx: number
  readonly nombre: string
  readonly email: string
  readonly requiereCambioPassword: boolean
}

export const ADMINS: readonly AdminDef[] = [
  {
    idx: 1,
    nombre: "Rodrigo Oyarzun Contreras",
    email: "royarzun@emeal.nttdata.com",
    requiereCambioPassword: true,
  },
  {
    idx: 2,
    nombre: "Carlos Fuentes Fuentes",
    email: "carlos.fuentes.fuentes@emeal.nttdata.com",
    requiereCambioPassword: true,
  },
  {
    idx: 3,
    nombre: "QA Admin (sin cambio password)",
    email: "qa-admin@nexott.local",
    requiereCambioPassword: false,
  },
]

// ============================================================================
// Definicion: areas necesarias para el curso
// ============================================================================

export interface AreaDef {
  readonly nombre: string
  readonly codigo: string
  readonly descripcion: string
}

export const AREAS: readonly AreaDef[] = [
  {
    nombre: "Frontend",
    codigo: "frontend",
    descripcion: "Desarrollo frontend web (HTML, CSS, JS, TS, React).",
  },
  {
    nombre: "Calidad y Testing",
    codigo: "qa",
    descripcion: "Calidad de codigo, testing y disciplina de proyecto.",
  },
  {
    nombre: "DevOps Azure",
    codigo: "devops",
    descripcion: "Oficio de equipo: Git, CI/CD, automatizacion.",
  },
]

// ============================================================================
// Definicion: skills nuevas
// ============================================================================

export interface SkillDef {
  readonly idx: number
  readonly etiqueta: string
  readonly area: "Frontend" | "DevOps Azure" | "Calidad y Testing"
  readonly notaMinima: number
}

export const SKILLS_FRONTEND: readonly SkillDef[] = [
  { idx: 1, etiqueta: "Git y oficio en equipo", area: "DevOps Azure", notaMinima: 70 },
  { idx: 2, etiqueta: "Uso eficiente de IA para devs", area: "Frontend", notaMinima: 70 },
  { idx: 3, etiqueta: "HTML semantico", area: "Frontend", notaMinima: 75 },
  { idx: 4, etiqueta: "CSS layout moderno", area: "Frontend", notaMinima: 75 },
  {
    idx: 5,
    etiqueta: "JavaScript moderno (perspectiva backend)",
    area: "Frontend",
    notaMinima: 75,
  },
  { idx: 6, etiqueta: "TypeScript estricto", area: "Frontend", notaMinima: 75 },
  { idx: 7, etiqueta: "Disciplina de proyecto sano", area: "Calidad y Testing", notaMinima: 70 },
  { idx: 8, etiqueta: "React fundamentos y mental model", area: "Frontend", notaMinima: 75 },
  { idx: 9, etiqueta: "Server state con Tanstack Query", area: "Frontend", notaMinima: 70 },
  {
    idx: 10,
    etiqueta: "Testing frontend (unit + integracion + E2E)",
    area: "Calidad y Testing",
    notaMinima: 70,
  },
]

// ============================================================================
// IDs preasignados para bloques con dependencias internas (CODIGO_TESTS
// apunta a CODIGO_PREGUNTAS, asi que el id se conoce antes de insertar).
// ============================================================================

export const ID_M0_S2_PREG = bloqueId(9000)
export const ID_M0_S2_TEST = bloqueId(9001)
export const ID_M1_S2_PREG = bloqueId(9002)
export const ID_M1_S2_TEST = bloqueId(9003)
export const ID_M4_S2_PREG = bloqueId(9004)
export const ID_M4_S2_TEST = bloqueId(9005)
export const ID_M5_S2_PREG = bloqueId(9006)
export const ID_M5_S2_TEST = bloqueId(9007)
export const ID_M6_S2_PREG = bloqueId(9008)
export const ID_M6_S2_TEST = bloqueId(9009)
export const ID_M7_S2_PREG = bloqueId(9010)
export const ID_M7_S2_TEST = bloqueId(9011)
export const ID_M8_S2_PREG = bloqueId(9012)
export const ID_M8_S2_TEST = bloqueId(9013)
export const ID_M9_S2_PREG = bloqueId(9014)
export const ID_M9_S2_TEST = bloqueId(9015)

// ============================================================================
// Definicion: 8 + 2 participantes asignados al curso
// ============================================================================

export type EstadoObjetivo =
  | "ASIGNADO"
  | "EN_PROGRESO"
  | "LISTO"
  | "APTO"
  | "NO_APTO"
  | "RETIRADO"
  | "VOL_EN_PROGRESO"
  | "VOL_COMPLETADO"

export type TransversalSeed =
  | {
      readonly tipo: "en_evaluacion"
      readonly repoUrl: string
      readonly comentario: string
      readonly fechaDiasAtras: number
    }
  | {
      readonly tipo: "evaluado_aprobado"
      readonly notaGlobal: number
      readonly notaTests: number
      readonly notaCualitativa: number
      readonly notaComprension: number
      readonly repoUrl: string
      readonly fechaDiasAtras: number
    }
  | {
      readonly tipo: "evaluado_no_aprobado"
      readonly notaGlobal: number
      readonly notaTests: number
      readonly notaCualitativa: number
      readonly notaComprension: number
      readonly repoUrl: string
      readonly comentario: string
      readonly fechaDiasAtras: number
    }
  | {
      readonly tipo: "anulado"
      readonly motivo: string
      readonly repoUrl: string
      readonly fechaDiasAtras: number
    }

export interface EntrevistaIaSeed {
  readonly notaGlobal: number
  readonly aprobado: boolean
  readonly notasPorArea: ReadonlyArray<{
    readonly areaNombre: "Frontend" | "Calidad y Testing" | "DevOps Azure"
    readonly nota: number
  }>
  readonly fechaDiasAtras: number
  readonly resumenTranscripcion: string
  readonly reporte: {
    readonly fortalezas: readonly string[]
    readonly mejoras: readonly string[]
    readonly justificacion: string
  }
}

export interface ParticipanteDef {
  readonly idx: number
  readonly email: string
  readonly nombre: string
  readonly estado: EstadoObjetivo
  /** Si se define, sobrescribe el porcentaje calculado desde el estado. Util
   *  para participantes con 100% de contenido pero estado distinto a LISTO. */
  readonly porcentajeOverride?: number
  /** Lista de intentos de transversal a sembrar (en orden cronologico). */
  readonly transversal?: readonly TransversalSeed[]
  /** Intento de entrevista IA finalizado a sembrar (uno solo). */
  readonly entrevistaIA?: EntrevistaIaSeed
}

export const PARTICIPANTES: readonly ParticipanteDef[] = [
  { idx: 1, email: "tomas.herrera@nexott.local", nombre: "Tomas Herrera", estado: "ASIGNADO" },
  { idx: 2, email: "martin.salazar@nexott.local", nombre: "Martin Salazar", estado: "EN_PROGRESO" },
  {
    idx: 3,
    email: "valentina.araya@nexott.local",
    nombre: "Valentina Araya",
    estado: "LISTO",
    transversal: [
      {
        tipo: "evaluado_aprobado",
        notaGlobal: 82,
        notaTests: 80,
        notaCualitativa: 85,
        notaComprension: 80,
        repoUrl: "https://github.com/valentina-araya/nexott-transversal",
        fechaDiasAtras: 4,
      },
    ],
    // Sin entrevistaIA: queda LISTA para que el QA agende y haga la IA real.
  },
  {
    idx: 4,
    email: "javier.contreras@nexott.local",
    nombre: "Javier Contreras",
    estado: "APTO",
    transversal: [
      {
        tipo: "evaluado_aprobado",
        notaGlobal: 88,
        notaTests: 88,
        notaCualitativa: 90,
        notaComprension: 85,
        repoUrl: "https://github.com/javier-contreras/nexott-transversal",
        fechaDiasAtras: 8,
      },
    ],
    entrevistaIA: {
      notaGlobal: 84,
      aprobado: true,
      notasPorArea: [
        { areaNombre: "Frontend", nota: 86 },
        { areaNombre: "Calidad y Testing", nota: 78 },
        { areaNombre: "DevOps Azure", nota: 82 },
      ],
      fechaDiasAtras: 5,
      resumenTranscripcion:
        "Defendio bien refactor de componente >150 lineas con composicion. Solido en React mental model y Tanstack Query. Margen de mejora en testing E2E y disciplina de hooks.",
      reporte: {
        fortalezas: [
          "Explico con precision por que useEffect no debe usarse para fetch y defendio el cambio a Tanstack Query con un ejemplo concreto del curso.",
          "Refactorizo en vivo un componente de 180 lineas aplicando composicion y pasando datos por props, sin caer en prop drilling.",
          "Identifico correctamente cuando una rama de codigo amerita un sub-componente vs un custom hook, citando el limite de 150/80 lineas.",
        ],
        mejoras: [
          "Profundizar en testing end-to-end: solo menciono Vitest unitarios, no incluyo flujos completos con Playwright o Cypress.",
          "Reforzar disciplina de hooks en escenarios edge: dudo al explicar por que un useCallback sin deps estables rompe la memoizacion del hijo.",
        ],
        justificacion:
          "84/100 refleja un dominio solido del mental model React y patrones de datos del curso. No subio a 90 porque el bloque de testing quedo superficial (solo unitarios) y dudo en hooks avanzados. No bajo de 80 porque resolvio el refactor en vivo sin ayudas y articulo decisiones de diseño con criterio. Apto para tomar tickets frontend de complejidad media bajo supervision puntual.",
      },
    },
  },
  {
    idx: 5,
    email: "fernanda.silva@nexott.local",
    nombre: "Fernanda Silva",
    estado: "NO_APTO",
    transversal: [
      {
        tipo: "evaluado_aprobado",
        notaGlobal: 75,
        notaTests: 70,
        notaCualitativa: 78,
        notaComprension: 77,
        repoUrl: "https://github.com/fernanda-silva/nexott-transversal",
        fechaDiasAtras: 9,
      },
    ],
    entrevistaIA: {
      notaGlobal: 58,
      aprobado: false,
      notasPorArea: [
        { areaNombre: "Frontend", nota: 55 },
        { areaNombre: "Calidad y Testing", nota: 62 },
        { areaNombre: "DevOps Azure", nota: 60 },
      ],
      fechaDiasAtras: 6,
      resumenTranscripcion:
        "Confusion en mental model de React (estado derivado vs useState). No pudo defender decisiones de tipado TS. Bien en Git y conventional commits. Sugerencia: reforzar React + TS antes de reintentar.",
      reporte: {
        fortalezas: [
          "Manejo solvente del flujo de Git: explico bien rebase vs merge y siguio Conventional Commits sin errores en los ejemplos pedidos.",
          "Reconoce los antipatrones de useEffect cuando se le señalan, aunque no los detecto por si misma.",
        ],
        mejoras: [
          "Reforzar estado derivado vs useState: intento sincronizar dos estados con useEffect cuando un calculo durante render era suficiente.",
          "Practicar tipado TS sin any: cayo en any al modelar la respuesta del backend en lugar de proponer un schema Zod.",
          "Trabajar el limite de componentes: no propuso refactor al ver un componente de 220 lineas; lo dejo pasar como aceptable.",
          "Revisar testing con Tanstack Query: no supo explicar como mockear queries en tests del frontend.",
        ],
        justificacion:
          "58/100 queda por debajo del umbral 70 porque las brechas estan en areas centrales del curso (estado de React, tipado y limites de componente). No es 40 porque demostro disciplina de Git y comprende los antipatrones cuando se le señalan. Recomendacion: repasar modulos 3-5 (React + TS) y reintentar en 2 semanas con foco en estado derivado y refactor sin any.",
      },
    },
  },
  {
    idx: 6,
    email: "sebastian.molina@nexott.local",
    nombre: "Sebastian Molina",
    estado: "VOL_EN_PROGRESO",
  },
  {
    idx: 7,
    email: "constanza.diaz@nexott.local",
    nombre: "Constanza Diaz",
    estado: "VOL_COMPLETADO",
    transversal: [
      {
        tipo: "evaluado_aprobado",
        notaGlobal: 78,
        notaTests: 75,
        notaCualitativa: 80,
        notaComprension: 78,
        repoUrl: "https://github.com/constanza-diaz/nexott-transversal",
        fechaDiasAtras: 3,
      },
    ],
    // Voluntaria: completo el curso pero no aplica entrevista IA.
  },
  { idx: 8, email: "ignacio.tapia@nexott.local", nombre: "Ignacio Tapia", estado: "RETIRADO" },
  // ---------------------------------------------------------------------------
  // Nuevos para cubrir sub-estados intermedios del transversal.
  // ---------------------------------------------------------------------------
  {
    idx: 9,
    email: "lucia.ramirez@nexott.local",
    nombre: "Lucia Ramirez",
    estado: "EN_PROGRESO",
    porcentajeOverride: 100, // contenido completo, pero transversal pendiente de evaluar
    transversal: [
      {
        tipo: "en_evaluacion",
        repoUrl: "https://github.com/lucia-ramirez/nexott-transversal",
        comentario:
          "Entrega final. Implemente el mini panel con tabla + busqueda debounced + mutation con optimistic update. Anadi 1 test de integracion con MSW y 1 E2E de Playwright. Pendiente: feedback del equipo.",
        fechaDiasAtras: 2,
      },
    ],
  },
  {
    idx: 10,
    email: "diego.vargas@nexott.local",
    nombre: "Diego Vargas",
    estado: "EN_PROGRESO",
    porcentajeOverride: 100, // contenido completo, 2 intentos fallidos del transversal
    transversal: [
      {
        tipo: "anulado",
        motivo:
          "Repositorio fuera del template proporcionado. Faltan los hooks de husky y no tiene workflow de CI. Reentrega siguiendo la plantilla base.",
        repoUrl: "https://github.com/diego-vargas/nexott-transversal-v1",
        fechaDiasAtras: 12,
      },
      {
        tipo: "evaluado_no_aprobado",
        notaGlobal: 62,
        notaTests: 60,
        notaCualitativa: 65,
        notaComprension: 60,
        repoUrl: "https://github.com/diego-vargas/nexott-transversal-v2",
        comentario:
          "Tests basicos OK pero no cubren los flujos criticos (login + mutation). El E2E es solo del happy path. Reentrega: cubrir error path del login y al menos un test de integracion con MSW.",
        fechaDiasAtras: 4,
      },
    ],
  },
]

// ============================================================================
// Helpers de estado → porcentaje / rol / estado-asignado / voluntario / cierre
// ============================================================================

export function porcentajeObjetivo(estado: EstadoObjetivo): number {
  switch (estado) {
    case "ASIGNADO":
      return 0
    case "EN_PROGRESO":
    case "VOL_EN_PROGRESO":
      return 50
    case "RETIRADO":
      return 25
    case "LISTO":
    case "APTO":
    case "NO_APTO":
    case "VOL_COMPLETADO":
      return 100
    default: {
      const _exhaustive: never = estado
      return _exhaustive
    }
  }
}

export function rolDe(estado: EstadoObjetivo): RolAsignacion {
  return estado.startsWith("VOL_") ? RolAsignacion.VOLUNTARIO : RolAsignacion.ASIGNADO
}

export function estadoAsignadoDe(estado: EstadoObjetivo): EstadoAsignado | null {
  switch (estado) {
    case "ASIGNADO":
      return EstadoAsignado.ASIGNADO
    case "EN_PROGRESO":
      return EstadoAsignado.EN_PROGRESO
    case "LISTO":
      return EstadoAsignado.LISTO
    case "APTO":
      return EstadoAsignado.APTO
    case "NO_APTO":
      return EstadoAsignado.NO_APTO
    case "RETIRADO":
      return EstadoAsignado.RETIRADO
    default:
      return null
  }
}

export function estadoVoluntarioDe(estado: EstadoObjetivo): EstadoVoluntario | null {
  switch (estado) {
    case "VOL_EN_PROGRESO":
      return EstadoVoluntario.EN_PROGRESO
    case "VOL_COMPLETADO":
      return EstadoVoluntario.COMPLETADO
    default:
      return null
  }
}

export function resultadoEntrevistaDe(estado: EstadoObjetivo): ResultadoEntrevistaCliente | null {
  if (estado === "APTO") {
    return ResultadoEntrevistaCliente.PASO
  }
  if (estado === "NO_APTO") {
    return ResultadoEntrevistaCliente.NO_PASO
  }
  if (estado === "LISTO") {
    return ResultadoEntrevistaCliente.PENDIENTE
  }
  return null
}

export function necesitaCierre(estado: EstadoObjetivo): boolean {
  return (
    estado === "APTO" ||
    estado === "NO_APTO" ||
    estado === "RETIRADO" ||
    estado === "VOL_COMPLETADO"
  )
}

// ============================================================================
// FASES
// ============================================================================

export const CLIENTE_NOMBRE = "NTT Data — Frontend Practice"

export async function seedAdmins(prisma: PrismaClient): Promise<void> {
  log(`Fase 1: ${ADMINS.length} admins...`)
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, FACTOR_BCRYPT)
  const passwordInicialCaduca = dateNDaysAhead(DIAS_CADUCIDAD)

  for (const a of ADMINS) {
    const cId = adminId(a.idx)
    const colaborador = await prisma.colaborador.upsert({
      where: { id: cId },
      update: {
        email: a.email,
        nombre: a.nombre,
        estadoEmpleado: EstadoEmpleado.ACTIVO,
        fechaOffBoarding: null,
      },
      create: {
        id: cId,
        email: a.email,
        nombre: a.nombre,
        estadoEmpleado: EstadoEmpleado.ACTIVO,
      },
      select: { id: true },
    })

    await prisma.usuario.upsert({
      where: { colaboradorId: colaborador.id },
      update: {
        rol: RolUsuario.ADMIN,
        passwordHash,
        passwordInicialCaduca,
        requiereCambioPassword: a.requiereCambioPassword,
        mfaHabilitado: false,
        requiereSetupMfa: false,
        intentosFallidos: 0,
        bloqueado: false,
      },
      create: {
        colaboradorId: colaborador.id,
        rol: RolUsuario.ADMIN,
        passwordHash,
        passwordInicialCaduca,
        requiereCambioPassword: a.requiereCambioPassword,
        mfaHabilitado: false,
        requiereSetupMfa: false,
        intentosFallidos: 0,
        bloqueado: false,
        ultimoLogin: dateNDaysAgo(1),
      },
    })
  }
}

export async function seedParticipantes(prisma: PrismaClient): Promise<void> {
  log(`Fase 2: ${PARTICIPANTES.length} participantes...`)
  const passwordHash = await bcrypt.hash(USER_PASSWORD, FACTOR_BCRYPT)
  const passwordInicialCaduca = dateNDaysAhead(DIAS_CADUCIDAD)

  for (const p of PARTICIPANTES) {
    const cId = partId(p.idx)
    const colaborador = await prisma.colaborador.upsert({
      where: { id: cId },
      update: {
        email: p.email,
        nombre: p.nombre,
        estadoEmpleado: EstadoEmpleado.ACTIVO,
        fechaOffBoarding: null,
      },
      create: {
        id: cId,
        email: p.email,
        nombre: p.nombre,
        estadoEmpleado: EstadoEmpleado.ACTIVO,
      },
      select: { id: true },
    })

    await prisma.usuario.upsert({
      where: { colaboradorId: colaborador.id },
      update: {
        rol: RolUsuario.PARTICIPANTE,
        passwordHash,
        passwordInicialCaduca,
        requiereCambioPassword: false,
        mfaHabilitado: false,
        requiereSetupMfa: false,
        intentosFallidos: 0,
        bloqueado: false,
      },
      create: {
        colaboradorId: colaborador.id,
        rol: RolUsuario.PARTICIPANTE,
        passwordHash,
        passwordInicialCaduca,
        requiereCambioPassword: false,
        mfaHabilitado: false,
        requiereSetupMfa: false,
        intentosFallidos: 0,
        bloqueado: false,
        ultimoLogin: dateNDaysAgo(p.idx),
      },
    })
  }
}

export async function seedAreas(prisma: PrismaClient): Promise<ReadonlyMap<string, string>> {
  log(`Fase 3: ${AREAS.length} areas...`)
  const out = new Map<string, string>()
  for (const a of AREAS) {
    const row = await prisma.area.upsert({
      where: { nombre: a.nombre },
      update: { codigo: a.codigo, descripcion: a.descripcion },
      create: { nombre: a.nombre, codigo: a.codigo, descripcion: a.descripcion },
      select: { id: true },
    })
    out.set(a.nombre, row.id)
  }
  return out
}

export async function seedCliente(prisma: PrismaClient): Promise<string> {
  log("Fase 4: cliente NTT Frontend Practice...")
  const row = await prisma.cliente.upsert({
    where: { nombre: CLIENTE_NOMBRE },
    update: { activo: true, deletedAt: null },
    create: { id: clienteId(1), nombre: CLIENTE_NOMBRE, activo: true },
    select: { id: true },
  })
  return row.id
}

export async function seedSkillsFrontend(
  prisma: PrismaClient,
  areaIdByNombre: ReadonlyMap<string, string>,
): Promise<ReadonlyMap<string, string>> {
  log(`Fase 5: ${SKILLS_FRONTEND.length} skills nuevas...`)
  const out = new Map<string, string>()
  for (const s of SKILLS_FRONTEND) {
    const areaId = areaIdByNombre.get(s.area)
    if (!areaId) {
      throw new Error(`[seed-frontend] area '${s.area}' no existe.`)
    }
    const sId = skillId(s.idx)
    await prisma.skill.upsert({
      where: { id: sId },
      update: { etiquetaVisible: s.etiqueta, areaId, estado: EstadoSkill.ACTIVA },
      create: {
        id: sId,
        etiquetaVisible: s.etiqueta,
        areaId,
        estado: EstadoSkill.ACTIVA,
      },
    })
    out.set(s.etiqueta, sId)
  }
  return out
}
