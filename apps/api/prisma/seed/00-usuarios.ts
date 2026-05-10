/**
 * Usuarios del seed.
 *
 *  - 1 admin principal (login dev local).
 *  - 1 admin secundario (para flujos de actor distinto en log).
 *  - 6 participantes del ESQUEMA + casos borde para testing.
 *
 * Idempotente vía upsert por email.
 *
 * Casos cubiertos:
 *  - admin@nexott.local         · ADMIN, debeCambiarPassword=true (primer login).
 *  - admin2@nexott.local        · ADMIN segundo (para auditoría con dos actores).
 *  - participante@nexott.local  · PARTICIPANTE genérico Carlos Fuentes.
 *  - juan.perez@xyz.local       · ESQUEMA caso real (brechas en BE/BD/CL).
 *  - maria.reyes@xyz.local      · ESQUEMA caso real (brecha en FE).
 *  - pedro.soto@xyz.local       · ESQUEMA caso real (cumple todo).
 *  - ana.bloqueada@xyz.local    · soft delete vía bloqueo (T01).
 *  - bruno.libre@nexott.local   · auto-inscripción LIBRE (catálogo libre).
 *  - elena.mfa@xyz.local        · MFA pendiente de confirmar.
 */
import type { Usuario } from "@prisma/client"
import { diasAtras, hashPassword, horasAtras, prisma, uuidEstable } from "./_lib.js"

export const USUARIO_KEYS = [
  "admin",
  "admin2",
  "participante",
  "juan",
  "maria",
  "pedro",
  "ana_bloqueada",
  "bruno_libre",
  "elena_mfa",
] as const

export type UsuarioKey = (typeof USUARIO_KEYS)[number]

type UsuarioSeed = {
  key: UsuarioKey
  email: string
  nombre: string
  apellido: string
  rol: "ADMIN" | "PARTICIPANTE"
  password: string
  debeCambiarPassword?: boolean
  mfaActivado?: boolean
  mfaConfirmado?: boolean
  bloqueado?: boolean
  ultimoLoginHaceDias?: number
  intentosFallidos?: number
}

const USUARIOS: UsuarioSeed[] = [
  {
    key: "admin",
    email: "admin@nexott.local",
    nombre: "Admin",
    apellido: "NexoTT",
    rol: "ADMIN",
    password: "Admin1234!",
    debeCambiarPassword: true,
  },
  {
    key: "admin2",
    email: "admin2@nexott.local",
    nombre: "Patricia",
    apellido: "Núñez",
    rol: "ADMIN",
    password: "Admin1234!",
    ultimoLoginHaceDias: 1,
  },
  {
    key: "participante",
    email: "participante@nexott.local",
    nombre: "Carlos",
    apellido: "Fuentes",
    rol: "PARTICIPANTE",
    password: "Participante1234!",
    debeCambiarPassword: true,
  },
  {
    key: "juan",
    email: "juan.perez@xyz.local",
    nombre: "Juan",
    apellido: "Pérez",
    rol: "PARTICIPANTE",
    password: "Juan1234!",
    ultimoLoginHaceDias: 2,
  },
  {
    key: "maria",
    email: "maria.reyes@xyz.local",
    nombre: "María",
    apellido: "Reyes",
    rol: "PARTICIPANTE",
    password: "Maria1234!",
    ultimoLoginHaceDias: 3,
  },
  {
    key: "pedro",
    email: "pedro.soto@xyz.local",
    nombre: "Pedro",
    apellido: "Soto",
    rol: "PARTICIPANTE",
    password: "Pedro1234!",
    ultimoLoginHaceDias: 5,
  },
  {
    key: "ana_bloqueada",
    email: "ana.bloqueada@xyz.local",
    nombre: "Ana",
    apellido: "Soto",
    rol: "PARTICIPANTE",
    password: "Ana1234!",
    bloqueado: true,
  },
  {
    key: "bruno_libre",
    email: "bruno.libre@nexott.local",
    nombre: "Bruno",
    apellido: "Castro",
    rol: "PARTICIPANTE",
    password: "Bruno1234!",
    ultimoLoginHaceDias: 7,
  },
  {
    key: "elena_mfa",
    email: "elena.mfa@xyz.local",
    nombre: "Elena",
    apellido: "Vega",
    rol: "PARTICIPANTE",
    password: "Elena1234!",
    mfaActivado: true,
    mfaConfirmado: false,
  },
]

export type UsuariosSeedResult = Record<UsuarioKey, Usuario>

export async function seedUsuarios(): Promise<UsuariosSeedResult> {
  const result = {} as UsuariosSeedResult

  for (const u of USUARIOS) {
    const passwordHash = await hashPassword(u.password)
    const ultimoLoginEn = u.ultimoLoginHaceDias != null ? diasAtras(u.ultimoLoginHaceDias) : null
    const passwordCambiadoEn = u.debeCambiarPassword ? null : diasAtras(30)
    const id = uuidEstable(`usuario:${u.key}`)

    const usuario = await prisma.usuario.upsert({
      where: { email: u.email },
      update: {
        passwordHash,
        nombre: u.nombre,
        apellido: u.apellido,
        rol: u.rol,
        debeCambiarPassword: u.debeCambiarPassword ?? false,
        mfaActivado: u.mfaActivado ?? false,
        mfaConfirmadoEn: u.mfaActivado && u.mfaConfirmado ? horasAtras(12) : null,
        bloqueado: u.bloqueado ?? false,
        bloqueadoAt: u.bloqueado ? diasAtras(15) : null,
        bloqueadoHasta: null,
        intentosFallidos: u.intentosFallidos ?? 0,
        ultimoLoginEn,
        passwordCambiadoEn,
      },
      create: {
        id,
        email: u.email,
        passwordHash,
        nombre: u.nombre,
        apellido: u.apellido,
        rol: u.rol,
        debeCambiarPassword: u.debeCambiarPassword ?? false,
        mfaActivado: u.mfaActivado ?? false,
        mfaConfirmadoEn: u.mfaActivado && u.mfaConfirmado ? horasAtras(12) : null,
        bloqueado: u.bloqueado ?? false,
        bloqueadoAt: u.bloqueado ? diasAtras(15) : null,
        intentosFallidos: u.intentosFallidos ?? 0,
        ultimoLoginEn,
        passwordCambiadoEn,
      },
    })
    result[u.key] = usuario
  }

  console.info(`  ✓ Usuarios: ${USUARIOS.length} (1 bloqueado, 1 con MFA pendiente)`)
  return result
}

/** Para imprimir credenciales útiles al final del seed. */
export function credencialesParaConsola(): Array<{ email: string; password: string; rol: string }> {
  return USUARIOS.map((u) => ({ email: u.email, password: u.password, rol: u.rol }))
}
