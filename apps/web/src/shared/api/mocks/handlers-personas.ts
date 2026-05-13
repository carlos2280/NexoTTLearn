import type {
  ColaboradorAdminResumen,
  CrearColaboradorInput,
  ListarColaboradoresQuery,
  Paginated,
} from "@nexott-learn/shared-types"
import { ApiError } from "../api-error"
import { type MockHandler, type MockRequest, defineRoute } from "./router"

const RTE_LISTAR = /^\/colaboradores(\?.*)?$/
const RTE_CREAR = /^\/colaboradores$/
const RTE_FICHA = /^\/colaboradores\/[^/]+\/ficha$/
const RTE_REGENERAR = /^\/auth\/regenerar-password-inicial$/
const RTE_DESBLOQUEAR = /^\/auth\/desbloquear$/

interface PersonaSeed {
  readonly id: string
  readonly email: string
  readonly nombre: string
  readonly estadoEmpleado: "ACTIVO" | "EX_EMPLEADO"
  readonly fechaOffBoarding: string | null
  readonly createdAt: string
  readonly usuario: {
    readonly id: string
    readonly rol: "ADMIN" | "PARTICIPANTE"
    readonly bloqueado: boolean
    readonly mfaHabilitado: boolean
    readonly requiereCambioPassword: boolean
    readonly requiereSetupMfa: boolean
    readonly intentosFallidos: number
    readonly ultimoLogin: string | null
  } | null
}

const SEED: PersonaSeed[] = [
  seed("11111111-1111-1111-1111-111111111111", "Camila Salazar", "admin@nexott.local", {
    rol: "ADMIN",
    ultimoLogin: hace(2),
  }),
  seed("22222222-2222-2222-2222-222222222222", "Diego Reyes", "participante@nexott.local", {
    rol: "PARTICIPANTE",
    ultimoLogin: hace(6),
  }),
  seed("33333333-3333-3333-3333-333333333333", "Lucía Mendoza", "nuevo@nexott.local", {
    rol: "PARTICIPANTE",
    requiereCambioPassword: true,
    ultimoLogin: null,
  }),
  seed("44444444-4444-4444-4444-444444444444", "Tomás Aguirre", "mfa@nexott.local", {
    rol: "ADMIN",
    mfaHabilitado: true,
    ultimoLogin: hace(1),
  }),
  seed("55555555-5555-5555-5555-555555555555", "Marcos Vega", "bloqueado@nexott.local", {
    rol: "PARTICIPANTE",
    bloqueado: true,
    intentosFallidos: 5,
    ultimoLogin: hace(40),
  }),
  seed("66666666-6666-6666-6666-666666666666", "Renata Cárdenas", "renata@nexott.local", {
    rol: "PARTICIPANTE",
    ultimoLogin: hace(11),
  }),
  seed("77777777-7777-7777-7777-777777777777", "Paula Quintana", "paula@nexott.local", {
    rol: "PARTICIPANTE",
    estadoEmpleado: "EX_EMPLEADO",
    fechaOffBoarding: hace(120),
    ultimoLogin: hace(200),
  }),
]

const store = new Map<string, PersonaSeed>(SEED.map((p) => [p.id, p]))

function hace(dias: number): string {
  return new Date(Date.now() - dias * 24 * 60 * 60 * 1000).toISOString()
}

function seed(
  id: string,
  nombre: string,
  email: string,
  parcial: Partial<
    PersonaSeed["usuario"] & {
      estadoEmpleado: PersonaSeed["estadoEmpleado"]
      fechaOffBoarding: string | null
    }
  >,
): PersonaSeed {
  return {
    id,
    nombre,
    email,
    estadoEmpleado: parcial.estadoEmpleado ?? "ACTIVO",
    fechaOffBoarding: parcial.fechaOffBoarding ?? null,
    createdAt: hace(60),
    usuario: {
      id: `usr-${id.slice(0, 8)}`,
      rol: parcial.rol ?? "PARTICIPANTE",
      bloqueado: parcial.bloqueado ?? false,
      mfaHabilitado: parcial.mfaHabilitado ?? false,
      requiereCambioPassword: parcial.requiereCambioPassword ?? false,
      requiereSetupMfa: parcial.requiereSetupMfa ?? false,
      intentosFallidos: parcial.intentosFallidos ?? 0,
      ultimoLogin: parcial.ultimoLogin ?? null,
    },
  }
}

function parseQuery(path: string): ListarColaboradoresQuery {
  const url = new URL(`http://x${path}`)
  const q = url.searchParams
  return {
    page: Number(q.get("page") ?? "1"),
    pageSize: Number(q.get("pageSize") ?? "20"),
    q: q.get("q") ?? undefined,
    rol: (q.get("rol") as "ADMIN" | "PARTICIPANTE" | null) ?? undefined,
    estadoEmpleado: (q.get("estadoEmpleado") as "ACTIVO" | "EX_EMPLEADO" | null) ?? undefined,
    bloqueado:
      q.get("bloqueado") === "true" ? true : q.get("bloqueado") === "false" ? false : undefined,
  }
}

function aplicarFiltros(query: ListarColaboradoresQuery): PersonaSeed[] {
  const todos = Array.from(store.values())
  return todos
    .filter((p) => (query.estadoEmpleado ? p.estadoEmpleado === query.estadoEmpleado : true))
    .filter((p) => (query.rol ? p.usuario?.rol === query.rol : true))
    .filter((p) =>
      query.bloqueado !== undefined ? (p.usuario?.bloqueado ?? false) === query.bloqueado : true,
    )
    .filter((p) => {
      if (!query.q) {
        return true
      }
      const needle = query.q.toLowerCase()
      return p.nombre.toLowerCase().includes(needle) || p.email.toLowerCase().includes(needle)
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre))
}

const listarHandler: MockHandler = (req) => {
  const query = parseQuery(req.path)
  const filtrados = aplicarFiltros(query)
  const total = filtrados.length
  const skip = (query.page - 1) * query.pageSize
  const data: ColaboradorAdminResumen[] = filtrados.slice(skip, skip + query.pageSize)
  const respuesta: Paginated<ColaboradorAdminResumen> = {
    data,
    meta: {
      page: query.page,
      pageSize: query.pageSize,
      total,
      totalPages: query.pageSize > 0 ? Math.ceil(total / query.pageSize) : 0,
    },
  }
  return respuesta
}

function nuevoUuid(): string {
  return `${crypto.randomUUID()}`
}

const crearHandler: MockHandler = (req: MockRequest) => {
  const input = req.body as CrearColaboradorInput
  if (Array.from(store.values()).some((p) => p.email.toLowerCase() === input.email.toLowerCase())) {
    throw new ApiError(409, "CONFLICT_EMAIL_DUPLICADO", "Ya existe un colaborador con ese email.")
  }
  const id = nuevoUuid()
  const persona: PersonaSeed = {
    id,
    nombre: input.nombre,
    email: input.email,
    estadoEmpleado: "ACTIVO",
    fechaOffBoarding: null,
    createdAt: new Date().toISOString(),
    usuario: {
      id: `usr-${id.slice(0, 8)}`,
      rol: input.rol,
      bloqueado: false,
      mfaHabilitado: false,
      requiereCambioPassword: true,
      requiereSetupMfa: input.habilitarMfa,
      intentosFallidos: 0,
      ultimoLogin: null,
    },
  }
  store.set(id, persona)
  const caduca = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  return {
    colaborador: {
      id: persona.id,
      email: persona.email,
      nombre: persona.nombre,
      estadoEmpleado: persona.estadoEmpleado,
    },
    usuario: {
      id: persona.usuario?.id ?? "",
      rol: input.rol,
      requiereCambioPassword: true,
      requiereSetupMfa: input.habilitarMfa,
      passwordInicialCaducaEn: caduca,
    },
    modoEntrega: "MANUAL",
    passwordTemporal: "Inicial1234!",
  }
}

const fichaHandler: MockHandler = () => ({
  colaboradorId: "mock",
  nombre: "Mock",
  email: "mock@nexott.local",
  areas: [],
  resumen: {
    totalSkills: 0,
    skillsConNota: 0,
    porcentajePorArea: [],
  },
})

const regenerarHandler: MockHandler = () => ({
  modoEntrega: "MANUAL",
  passwordTemporal: "Nueva1234!",
  caducaEn: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
})

const desbloquearHandler: MockHandler = (req: MockRequest) => {
  const body = req.body as { usuarioId?: string }
  for (const persona of store.values()) {
    if (persona.usuario?.id === body.usuarioId) {
      store.set(persona.id, {
        ...persona,
        usuario: persona.usuario
          ? { ...persona.usuario, bloqueado: false, intentosFallidos: 0 }
          : null,
      })
      break
    }
  }
  return undefined
}

export const handlersPersonas = [
  defineRoute("GET", RTE_LISTAR, listarHandler),
  defineRoute("POST", RTE_CREAR, crearHandler),
  defineRoute("GET", RTE_FICHA, fichaHandler),
  defineRoute("POST", RTE_REGENERAR, regenerarHandler),
  defineRoute("POST", RTE_DESBLOQUEAR, desbloquearHandler),
]
