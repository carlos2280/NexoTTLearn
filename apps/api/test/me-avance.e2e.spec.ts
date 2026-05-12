// biome-ignore lint/correctness/noNodejsModules: el harness e2e necesita filesystem para detectar dist/.
import { existsSync } from "node:fs"
// biome-ignore lint/correctness/noNodejsModules: idem.
import { join, resolve } from "node:path"
import type { INestApplication, Type } from "@nestjs/common"
import { PrismaClient, type PrismaClient as PrismaClientType } from "@prisma/client"
import bcrypt from "bcrypt"
import supertest, { type Agent, type Response } from "supertest"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

const HAS_DB_URL = Boolean(process.env.DATABASE_URL)
const DIST_DIR = resolve(__dirname, "..", "dist")
const DIST_DISPONIBLE = existsSync(join(DIST_DIR, "app.module.js"))

if (!HAS_DB_URL) {
  console.warn("me-avance.e2e.spec: DATABASE_URL ausente — tests SKIP.")
}
if (HAS_DB_URL && !DIST_DISPONIBLE) {
  console.warn("me-avance.e2e.spec: dist/ no encontrado — SKIP.")
}

const RUN_E2E = HAS_DB_URL && DIST_DISPONIBLE

const PART_EMAIL = "me-avance-part-p11c@nttdata.test"
const PASSWORD = "Avance1234!"
const CLIENTE_NOMBRE = "Cliente Avance P11c"
const CURSO_TITULO = "Curso Avance P11c"

interface ModuloApp {
  // biome-ignore lint/style/useNamingConvention: la clase Nest es PascalCase.
  AppModule: Type<unknown>
}
interface ModuloHttp {
  configurarHttp: (app: unknown) => void
}

function extraerXsrf(res: Response): string | null {
  const setCookie = res.headers["set-cookie"]
  if (!setCookie) {
    return null
  }
  const arr = Array.isArray(setCookie) ? setCookie : [setCookie]
  for (const raw of arr) {
    const m = /^XSRF-TOKEN=([^;]+)/.exec(raw)
    if (m?.[1]) {
      return m[1]
    }
  }
  return null
}

async function loginYObtenerCsrf(agente: Agent, email: string): Promise<string> {
  const res = await agente.post("/api/v1/auth/login").send({ email, password: PASSWORD })
  if (res.status !== 200) {
    throw new Error(`Login fallo para ${email} con status ${res.status}`)
  }
  const token = extraerXsrf(res)
  if (!token) {
    throw new Error(`Sin XSRF tras login ${email}`)
  }
  return token
}

async function upsertParticipante(
  prisma: PrismaClientType,
  email: string,
  passwordHash: string,
  nombre: string,
): Promise<{ colaboradorId: string; usuarioId: string }> {
  const col = await prisma.colaborador.upsert({
    where: { email },
    update: { nombre, estadoEmpleado: "ACTIVO" },
    create: { email, nombre, estadoEmpleado: "ACTIVO" },
    select: { id: true },
  })
  const user = await prisma.usuario.upsert({
    where: { colaboradorId: col.id },
    update: {
      passwordHash,
      requiereCambioPassword: false,
      rol: "PARTICIPANTE",
      intentosFallidos: 0,
      bloqueado: false,
      mfaHabilitado: false,
      requiereSetupMfa: false,
    },
    create: {
      colaboradorId: col.id,
      rol: "PARTICIPANTE",
      passwordHash,
      requiereCambioPassword: false,
      intentosFallidos: 0,
      bloqueado: false,
      mfaHabilitado: false,
    },
    select: { id: true },
  })
  return { colaboradorId: col.id, usuarioId: user.id }
}

describe.runIf(RUN_E2E)("me-avance e2e (P11c — /me/avance/cursos/:cursoId)", () => {
  let app: INestApplication
  let prisma: PrismaClient
  let agentePart: Agent
  let colaboradorId: string
  let cursoActivoId: string
  let clienteId: string

  beforeAll(async () => {
    prisma = new PrismaClient()
    try {
      await prisma.$queryRaw`SELECT 1`
    } catch (error) {
      throw new Error(
        `No se pudo conectar a la BD: ${error instanceof Error ? error.message : error}`,
      )
    }

    const passwordHash = await bcrypt.hash(PASSWORD, 12)
    const part = await upsertParticipante(prisma, PART_EMAIL, passwordHash, "Part Avance")
    colaboradorId = part.colaboradorId

    const cliente = await prisma.cliente.upsert({
      where: { nombre: CLIENTE_NOMBRE },
      update: {},
      create: { nombre: CLIENTE_NOMBRE },
      select: { id: true },
    })
    clienteId = cliente.id

    const curso = await prisma.curso.create({
      data: {
        titulo: CURSO_TITULO,
        clienteId: cliente.id,
        estado: "ACTIVO",
        fechaInicio: new Date(),
        fechaDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      select: { id: true },
    })
    cursoActivoId = curso.id

    await prisma.asignacionCurso.create({
      data: {
        colaboradorId,
        cursoId: cursoActivoId,
        rol: "ASIGNADO",
        estadoAsignado: "EN_PROGRESO",
      },
    })

    await prisma.$executeRaw`
      DELETE FROM sesiones
      WHERE (sess::jsonb->>'usuarioId') IN (
        SELECT id::text FROM usuarios WHERE colaborador_id IN
          (SELECT id FROM colaboradores WHERE email = ${PART_EMAIL})
      )
    `

    const moduleApp = (await import(join(DIST_DIR, "app.module.js"))) as ModuloApp
    const moduleHttp = (await import(join(DIST_DIR, "bootstrap-http.js"))) as ModuloHttp
    const { Test } = await import("@nestjs/testing")
    const { ThrottlerGuard, ThrottlerStorage } = await import("@nestjs/throttler")
    const { ThrottlerStorageFake } = await import("./throttler-storage-fake.js")
    const throttlerSiempreOk = { canActivate: (): boolean => true }
    const moduleRef = await Test.createTestingModule({ imports: [moduleApp.AppModule] })
      .overrideGuard(ThrottlerGuard)
      .useValue(throttlerSiempreOk)
      .overrideProvider(ThrottlerStorage)
      .useValue(new ThrottlerStorageFake())
      .compile()
    app = moduleRef.createNestApplication()
    moduleHttp.configurarHttp(app)
    await app.init()
    agentePart = supertest.agent(app.getHttpServer())
    await loginYObtenerCsrf(agentePart, PART_EMAIL)
  }, 60_000)

  afterAll(async () => {
    try {
      await prisma.asignacionCurso.deleteMany({ where: { colaboradorId } })
      await prisma.curso.deleteMany({ where: { id: cursoActivoId } })
      await prisma.cliente.deleteMany({ where: { id: clienteId } })
      await prisma.$executeRaw`
        DELETE FROM sesiones
        WHERE (sess::jsonb->>'usuarioId') IN (
          SELECT id::text FROM usuarios WHERE colaborador_id IN
            (SELECT id FROM colaboradores WHERE email = ${PART_EMAIL})
        )
      `
    } finally {
      await app.close()
      await prisma.$disconnect()
    }
  }, 30_000)

  it("PARTICIPANTE con asignacion a curso ACTIVO -> 200 con estaCerrado=false", async () => {
    const res = await agentePart.get(`/api/v1/me/avance/cursos/${cursoActivoId}`).expect(200)
    expect(res.body.estaCerrado).toBe(false)
    expect(res.body.cursoId).toBe(cursoActivoId)
    expect(typeof res.body.porcentajeAvance).toBe("number")
    expect("notaGlobalFinal" in res.body).toBe(false)
    expect("etiquetaCualitativaFinal" in res.body).toBe(false)
  })

  it("PARTICIPANTE sin asignacion al curso -> 404", async () => {
    const cursoSinAsignar = "00000000-0000-0000-0000-000000000000"
    await agentePart.get(`/api/v1/me/avance/cursos/${cursoSinAsignar}`).expect(404)
  })

  it("cursoId no UUID -> 400 invalidQuery", async () => {
    await agentePart.get("/api/v1/me/avance/cursos/no-es-uuid").expect(400)
  })
})
