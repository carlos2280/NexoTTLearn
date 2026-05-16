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
const DIST_DIR = resolve(__dirname, "..", "..", "dist")
const DIST_DISPONIBLE = existsSync(join(DIST_DIR, "app.module.js"))

if (!HAS_DB_URL) {
  console.warn("auditoria.e2e.spec: DATABASE_URL ausente — tests SKIP.")
}
if (HAS_DB_URL && !DIST_DISPONIBLE) {
  console.warn("auditoria.e2e.spec: dist/ no encontrado — SKIP.")
}

const RUN_E2E = HAS_DB_URL && DIST_DISPONIBLE

const ADMIN_EMAIL = "auditoria-admin-p12@nttdata.test"
const PART_EMAIL = "auditoria-part-p12@nttdata.test"
const PASSWORD = "Audit1234!"

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
  prisma: PrismaClientType,
  email: string,
  passwordHash: string,
  rol: "ADMIN" | "PARTICIPANTE",
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
      passwordInicialCaduca: null,
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

describe.runIf(RUN_E2E)("Auditoria e2e (Slice 12 P12 — /admin/auditoria)", () => {
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
    adminUsuarioId = await upsertUsuario(prisma, ADMIN_EMAIL, passwordHash, "ADMIN", "Admin P12")
    await upsertUsuario(prisma, PART_EMAIL, passwordHash, "PARTICIPANTE", "Part P12")

    // Sembrar 3 eventos: 1 LOGIN_OK del admin + 1 evento de sistema + 1 LOGIN_FAIL.
    await prisma.activityLog.deleteMany({
      where: { recursoTipo: "auditoria-e2e-marker" },
    })
    await prisma.activityLog.create({
      data: {
        usuarioId: adminUsuarioId,
        accion: "LOGIN_OK",
        exito: true,
        recursoTipo: "auditoria-e2e-marker",
        ip: "127.0.0.1",
        userAgent: "ua-test",
      },
    })
    await prisma.activityLog.create({
      data: {
        usuarioId: null,
        accion: "MODULO_HUERFANO_DETECTADO",
        exito: true,
        recursoTipo: "auditoria-e2e-marker",
        metadata: { contexto: "cron" },
      },
    })
    await prisma.activityLog.create({
      data: {
        usuarioId: adminUsuarioId,
        accion: "LOGIN_FAIL",
        exito: false,
        recursoTipo: "auditoria-e2e-marker",
        ip: "10.0.0.1",
      },
    })

    await prisma.$executeRaw`
      DELETE FROM sesiones
      WHERE (sess::jsonb->>'usuarioId') IN (
        SELECT id::text FROM usuarios WHERE colaborador_id IN
          (SELECT id FROM colaboradores WHERE email IN (${ADMIN_EMAIL}, ${PART_EMAIL}))
      )
    `

    const moduleApp = (await import(join(DIST_DIR, "app.module.js"))) as ModuloApp
    const moduleHttp = (await import(join(DIST_DIR, "bootstrap-http.js"))) as ModuloHttp
    const { Test } = await import("@nestjs/testing")
    const { ThrottlerGuard, ThrottlerStorage } = await import("@nestjs/throttler")
    const { ThrottlerStorageFake } = await import("../throttler-storage-fake.js")
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
      await prisma.activityLog.deleteMany({
        where: { recursoTipo: "auditoria-e2e-marker" },
      })
      await prisma.activityLog.deleteMany({
        where: { recursoTipo: "auditoria", usuarioId: adminUsuarioId },
      })
      await prisma.$executeRaw`
        DELETE FROM sesiones
        WHERE (sess::jsonb->>'usuarioId') IN (
          SELECT id::text FROM usuarios WHERE colaborador_id IN
            (SELECT id FROM colaboradores WHERE email IN (${ADMIN_EMAIL}, ${PART_EMAIL}))
        )
      `
    } finally {
      await app.close()
      await prisma.$disconnect()
    }
  }, 30_000)

  it("ADMIN lista auditoria filtrada por recursoTipo -> 200 paginado", async () => {
    const res = await agenteAdmin
      .get("/api/v1/admin/auditoria?recursoTipo=auditoria-e2e-marker")
      .expect(200)
    expect(res.body.meta).toBeDefined()
    expect(res.body.meta.total).toBeGreaterThanOrEqual(3)
    expect(Array.isArray(res.body.data)).toBe(true)
    // ordenacion desc por createdAt: la mas reciente primero.
    const fila = res.body.data[0]
    expect(fila).toHaveProperty("id")
    expect(fila).toHaveProperty("accion")
    expect(fila).toHaveProperty("exito")
  })

  it("PARTICIPANTE intenta listar -> 403", async () => {
    await agentePart.get("/api/v1/admin/auditoria").expect(403)
  })

  it("ADMIN exporta CSV con filtro -> 200 + headers + payload valido", async () => {
    const res = await agenteAdmin
      .get("/api/v1/admin/auditoria/exportar?recursoTipo=auditoria-e2e-marker")
      .expect(200)
    expect(res.headers["content-type"]).toContain("text/csv")
    expect(res.headers["content-disposition"]).toMatch(
      /^attachment; filename="auditoria-\d{4}-\d{2}-\d{2}\.csv"$/,
    )
    const csv = res.text || res.body.toString()
    expect(csv).toContain(
      "id,actorEmail,actorNombre,accion,recursoTipo,recursoId,exito,ip,createdAt",
    )
    expect(csv).toContain("auditoria-e2e-marker")
    // metadata NO debe aparecer en el CSV (R-S12-5).
    expect(csv).not.toContain("metadata")
    expect(csv).not.toContain("contexto")
  })

  it("ADMIN exporta audita AUDITORIA_EXPORTADA con metadata", async () => {
    await agenteAdmin
      .get("/api/v1/admin/auditoria/exportar?recursoTipo=auditoria-e2e-marker")
      .expect(200)
    const log = await prisma.activityLog.findFirst({
      where: {
        accion: "AUDITORIA_EXPORTADA",
        usuarioId: adminUsuarioId,
      },
      orderBy: { createdAt: "desc" },
    })
    expect(log).not.toBeNull()
    const metadata = (log?.metadata ?? null) as {
      filtrosAplicados?: Record<string, unknown>
      totalFilas?: number
    } | null
    expect(metadata?.filtrosAplicados).toBeDefined()
    expect(metadata?.totalFilas).toBeGreaterThanOrEqual(3)
  })

  it("PARTICIPANTE intenta exportar -> 403", async () => {
    await agentePart.get("/api/v1/admin/auditoria/exportar").expect(403)
  })

  it("ADMIN con queryParams invalidos (pageSize > 200) -> 400", async () => {
    await agenteAdmin.get("/api/v1/admin/auditoria?pageSize=500").expect(400)
  })
})
