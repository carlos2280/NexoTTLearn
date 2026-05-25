// Catalogo base del seed: admins, areas, cliente y participante de prueba.
//
// Estado simplificado (post-refactor): el seed siembra UN unico curso vivo
// ("Frontend desde Cero: Mentalidad, Codigo y Confianza") y mantiene la
// dotacion minima de usuarios para QA manual:
//   - 3 admins NTT (Rodrigo, Carlos y un atajo qa-admin)
//   - 1 participante de prueba (sin cambio de password)
//
// Las skills del curso ya no viven aqui: las define curso-soporte-react.ts
// (rango idx 20-28). Las skills antiguas idx 1-10 quedaron retiradas junto
// con el curso placeholder "Frontend para devs backend".

import { EstadoEmpleado, type PrismaClient, RolUsuario } from "@prisma/client"
import bcrypt from "bcrypt"

import { ADMIN_PASSWORD, DIAS_CADUCIDAD, FACTOR_BCRYPT, USER_PASSWORD } from "./_config"
import { adminId, clienteId, dateNDaysAgo, dateNDaysAhead, log, partId } from "./_utils"

// ============================================================================
// Admins NTT
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
// Areas (transversales al sistema)
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
// Participante unico de prueba
// ============================================================================

export interface ParticipanteDef {
  readonly idx: number
  readonly email: string
  readonly nombre: string
}

export const PARTICIPANTES: readonly ParticipanteDef[] = [
  {
    idx: 1,
    email: "participante@nexott.local",
    nombre: "Participante de Prueba",
  },
]

// ============================================================================
// Cliente unico (el espacio de trabajo donde vive el curso)
// ============================================================================

export const CLIENTE_NOMBRE = "NTT Data — Frontend Practice"

// ============================================================================
// Fases del seed
// ============================================================================

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
  log(`Fase 2: ${PARTICIPANTES.length} participante(s) de prueba...`)
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
