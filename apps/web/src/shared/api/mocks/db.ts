import type { Rol } from "@/features/auth/types"

export interface MockUsuario {
  id: string
  email: string
  password: string
  nombre: string
  apellido: string
  rol: Rol
  avatar: string | null
  mfaHabilitado: boolean
  requiereCambioPassword: boolean
  requiereAceptarAvisoPrivacidad: boolean
  estado: "ACTIVO" | "BLOQUEADO" | "EX_EMPLEADO" | "PENDIENTE_PRIMER_INGRESO"
  passwordHistorial: string[]
}

export const VERSION_AVISO_PRIVACIDAD = "v1.0"

export const usuariosMock: MockUsuario[] = [
  {
    id: "u-admin",
    email: "admin@nexott.local",
    password: "Admin1234!",
    nombre: "Camila",
    apellido: "Salazar",
    rol: "ADMIN",
    avatar: null,
    mfaHabilitado: false,
    requiereCambioPassword: false,
    requiereAceptarAvisoPrivacidad: false,
    estado: "ACTIVO",
    passwordHistorial: ["Admin1234!"],
  },
  {
    id: "u-part",
    email: "participante@nexott.local",
    // biome-ignore lint/nursery/noSecrets: credencial de prueba en mock de desarrollo, no es un secreto real
    password: "Participante1234!",
    nombre: "Diego",
    apellido: "Reyes",
    rol: "PARTICIPANTE",
    avatar: null,
    mfaHabilitado: false,
    requiereCambioPassword: false,
    requiereAceptarAvisoPrivacidad: false,
    estado: "ACTIVO",
    // biome-ignore lint/nursery/noSecrets: credencial de prueba en mock de desarrollo, no es un secreto real
    passwordHistorial: ["Participante1234!"],
  },
  {
    id: "u-nuevo",
    email: "nuevo@nexott.local",
    password: "Inicial1234!",
    nombre: "Lucía",
    apellido: "Mendoza",
    rol: "PARTICIPANTE",
    avatar: null,
    mfaHabilitado: false,
    requiereCambioPassword: true,
    requiereAceptarAvisoPrivacidad: true,
    estado: "PENDIENTE_PRIMER_INGRESO",
    passwordHistorial: ["Inicial1234!"],
  },
  {
    id: "u-mfa",
    email: "mfa@nexott.local",
    password: "Mfa1234!",
    nombre: "Tomás",
    apellido: "Aguirre",
    rol: "ADMIN",
    avatar: null,
    mfaHabilitado: true,
    requiereCambioPassword: false,
    requiereAceptarAvisoPrivacidad: false,
    estado: "ACTIVO",
    passwordHistorial: ["Mfa1234!"],
  },
  {
    id: "u-aviso",
    email: "aviso@nexott.local",
    password: "Aviso1234!",
    nombre: "Renata",
    apellido: "Cárdenas",
    rol: "PARTICIPANTE",
    avatar: null,
    mfaHabilitado: false,
    requiereCambioPassword: false,
    requiereAceptarAvisoPrivacidad: true,
    estado: "ACTIVO",
    passwordHistorial: ["Aviso1234!"],
  },
  {
    id: "u-bloq",
    email: "bloqueado@nexott.local",
    password: "Bloqueado1234!",
    nombre: "Marcos",
    apellido: "Vega",
    rol: "PARTICIPANTE",
    avatar: null,
    mfaHabilitado: false,
    requiereCambioPassword: false,
    requiereAceptarAvisoPrivacidad: false,
    estado: "BLOQUEADO",
    passwordHistorial: [],
  },
  {
    id: "u-ex",
    email: "ex@nexott.local",
    password: "Ex1234!",
    nombre: "Paula",
    apellido: "Quintana",
    rol: "PARTICIPANTE",
    avatar: null,
    mfaHabilitado: false,
    requiereCambioPassword: false,
    requiereAceptarAvisoPrivacidad: false,
    estado: "EX_EMPLEADO",
    passwordHistorial: [],
  },
]

interface MockSession {
  usuarioId: string
}

interface MockMfaChallenge {
  id: string
  usuarioId: string
  expiraEn: number
}

interface MockState {
  sesionActual: MockSession | null
  mfaChallenges: Map<string, MockMfaChallenge>
  intentosFallidos: Map<string, number>
}

// Persistimos solo la sesion en localStorage para sobrevivir a F5 / reapertura
// de pestana. `mfaChallenges` y `intentosFallidos` se mantienen en memoria
// porque son efimeros y reiniciarlos en cada recarga es razonable (mejor DX).
const STORAGE_KEY_SESION = "nexott-mock:sesion"

function leerSesionPersistida(): MockSession | null {
  if (typeof window === "undefined") {
    return null
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_SESION)
    if (!raw) {
      return null
    }
    const parsed = JSON.parse(raw) as { usuarioId?: unknown }
    if (typeof parsed.usuarioId !== "string") {
      return null
    }
    if (!buscarUsuarioPorId(parsed.usuarioId)) {
      return null
    }
    return { usuarioId: parsed.usuarioId }
  } catch {
    return null
  }
}

export const mockState: MockState = {
  sesionActual: leerSesionPersistida(),
  mfaChallenges: new Map(),
  intentosFallidos: new Map(),
}

export function setSesionActual(sesion: MockSession | null): void {
  mockState.sesionActual = sesion
  if (typeof window === "undefined") {
    return
  }
  if (sesion) {
    window.localStorage.setItem(STORAGE_KEY_SESION, JSON.stringify(sesion))
  } else {
    window.localStorage.removeItem(STORAGE_KEY_SESION)
  }
}

export function buscarUsuarioPorEmail(email: string): MockUsuario | undefined {
  return usuariosMock.find((u) => u.email.toLowerCase() === email.toLowerCase())
}

export function buscarUsuarioPorId(id: string): MockUsuario | undefined {
  return usuariosMock.find((u) => u.id === id)
}
