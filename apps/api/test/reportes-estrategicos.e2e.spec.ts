// biome-ignore lint/correctness/noNodejsModules: el harness e2e necesita filesystem para detectar dist/.
import { existsSync } from "node:fs"
// biome-ignore lint/correctness/noNodejsModules: idem.
import { join, resolve } from "node:path"
import type { INestApplication, Type } from "@nestjs/common"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcrypt"
import supertest, { type Agent, type Response } from "supertest"
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"

const HAS_DB_URL = Boolean(process.env.DATABASE_URL)
const DIST_DIR = resolve(__dirname, "..", "dist")
const DIST_DISPONIBLE = existsSync(join(DIST_DIR, "app.module.js"))

if (!HAS_DB_URL) {
  console.warn("reportes-estrategicos.e2e.spec: DATABASE_URL ausente — tests SKIP.")
}
if (HAS_DB_URL && !DIST_DISPONIBLE) {
  console.warn("reportes-estrategicos.e2e.spec: dist/ no encontrado — SKIP.")
}

const RUN_E2E = HAS_DB_URL && DIST_DISPONIBLE

const ADMIN_EMAIL = "estrategicos-admin-p11c@nttdata.test"
const PART_EMAIL = "estrategicos-part-p11c@nttdata.test"
const PASSWORD = "Estrat1234!"

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

async function upsertUsuario(
  prisma: PrismaClient,
  email: string,
  rol: "ADMIN" | "PARTICIPANTE",
  passwordHash: string,
  nombre: string,
): Promise<string> {
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
      intentosFallidos: 0,
      bloqueado: false,
      rol,
      mfaHabilitado: false,
      requiereSetupMfa: false,
    },
    create: {
      colaboradorId: col.id,
      rol,
      passwordHash,
      requiereCambioPassword: false,
      intentosFallidos: 0,
      bloqueado: false,
      mfaHabilitado: false,
    },
    select: { id: true },
  })
  return user.id
}

describe.runIf(RUN_E2E)("reportes estrategicos e2e (P11c)", () => {
  let app: INestApplication
  let prisma: PrismaClient
  let agenteAdmin: Agent
  let agentePart: Agent
  let adminUsuarioId: string

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
    adminUsuarioId = await upsertUsuario(prisma, ADMIN_EMAIL, "ADMIN", passwordHash, "Estrat Admin")
    await upsertUsuario(prisma, PART_EMAIL, "PARTICIPANTE", passwordHash, "Estrat Part")

    await prisma.$executeRaw`
      DELETE FROM sesiones
      WHERE (sess::jsonb->>'usuarioId') IN (
        SELECT id::text FROM usuarios WHERE colaborador_id IN
          (SELECT id FROM colaboradores WHERE email IN
            (${ADMIN_EMAIL}, ${PART_EMAIL}))
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
    agenteAdmin = supertest.agent(app.getHttpServer())
    agentePart = supertest.agent(app.getHttpServer())
    await loginYObtenerCsrf(agenteAdmin, ADMIN_EMAIL)
    await loginYObtenerCsrf(agentePart, PART_EMAIL)
  }, 60_000)

  afterAll(async () => {
    try {
      await prisma.reporteCache.deleteMany({})
      await prisma.consultaLog.deleteMany({
        where: { autorUsuarioId: adminUsuarioId },
      })
      await prisma.$executeRaw`
        DELETE FROM sesiones
        WHERE (sess::jsonb->>'usuarioId') IN (
          SELECT id::text FROM usuarios WHERE colaborador_id IN
            (SELECT id FROM colaboradores WHERE email IN
              (${ADMIN_EMAIL}, ${PART_EMAIL}))
        )
      `
    } finally {
      await app.close()
      await prisma.$disconnect()
    }
  }, 30_000)

  beforeEach(async () => {
    await prisma.reporteCache.deleteMany({})
    await prisma.consultaLog.deleteMany({
      where: { autorUsuarioId: adminUsuarioId },
    })
  })

  it("GET /reportes/eficacia-plataforma con ADMIN devuelve 200 + shape + meta", async () => {
    const res = await agenteAdmin.get("/api/v1/reportes/eficacia-plataforma").expect(200)
    expect(res.body).toMatchObject({
      presentadosCliente: expect.any(Number),
      aptos: expect.objectContaining({ total: expect.any(Number) }),
      noAptos: expect.objectContaining({ total: expect.any(Number) }),
      meta: expect.objectContaining({
        frescura: expect.any(String),
        scopeHash: expect.stringMatching(/^[0-9a-f]{64}$/),
      }),
    })
  })

  it("PARTICIPANTE recibe 403 en /reportes/eficacia-plataforma", async () => {
    await agentePart.get("/api/v1/reportes/eficacia-plataforma").expect(403)
  })

  it("format=csv devuelve Content-Disposition attachment", async () => {
    const res = await agenteAdmin.get("/api/v1/reportes/eficacia-plataforma?format=csv").expect(200)
    expect(res.headers["content-type"]).toContain("text/csv")
    expect(res.headers["content-disposition"]).toMatch(/attachment;\s*filename=/)
  })

  it("cache: dos llamadas consecutivas con mismo scope devuelven el mismo scopeHash y frescura", async () => {
    const a = await agenteAdmin.get("/api/v1/reportes/eficacia-plataforma").expect(200)
    const b = await agenteAdmin.get("/api/v1/reportes/eficacia-plataforma").expect(200)
    expect(a.body.meta.scopeHash).toBe(b.body.meta.scopeHash)
    expect(a.body.meta.frescura).toBe(b.body.meta.frescura)
  })

  it("consultas_logs poblado tras consumir el endpoint (post-cleanup §5.129)", async () => {
    await agenteAdmin.get("/api/v1/reportes/eficacia-plataforma").expect(200)
    const filas = await prisma.consultaLog.findMany({
      where: {
        autorUsuarioId: adminUsuarioId,
        endpoint: "/reportes/eficacia-plataforma",
      },
    })
    expect(filas.length).toBeGreaterThanOrEqual(1)
    expect(filas[0]?.endpoint).toBe("/reportes/eficacia-plataforma")
    expect(filas[0]?.queryParams).toBeDefined()
  })

  it("GET /reportes/historico-cliente exige clienteId requerido", async () => {
    await agenteAdmin.get("/api/v1/reportes/historico-cliente").expect(400)
  })

  it("GET /reportes/historico-cliente con clienteId inexistente -> 404", async () => {
    const cualquierUuid = "00000000-0000-0000-0000-000000000000"
    await agenteAdmin
      .get(`/api/v1/reportes/historico-cliente?clienteId=${cualquierUuid}`)
      .expect(404)
  })

  it("GET /reportes/inventario-skills 200 + shape", async () => {
    const res = await agenteAdmin.get("/api/v1/reportes/inventario-skills").expect(200)
    expect(Array.isArray(res.body.skills)).toBe(true)
    expect(res.body.meta.scopeHash).toMatch(/^[0-9a-f]{64}$/)
  })

  it("GET /reportes/inventario-skills con umbralCumple=80 acepta el param", async () => {
    const res = await agenteAdmin
      .get("/api/v1/reportes/inventario-skills?umbralCumple=80")
      .expect(200)
    expect(res.body.meta.frescura).toBeTruthy()
  })

  it("GET /reportes/reutilizacion-catalogo 200 con rankings", async () => {
    const res = await agenteAdmin.get("/api/v1/reportes/reutilizacion-catalogo").expect(200)
    expect(Array.isArray(res.body.modulos)).toBe(true)
    expect(Array.isArray(res.body.skills)).toBe(true)
  })
})
