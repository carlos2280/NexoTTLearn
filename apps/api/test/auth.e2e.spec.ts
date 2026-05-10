// biome-ignore lint/correctness/noNodejsModules: el harness e2e necesita filesystem para detectar dist/.
import { existsSync } from "node:fs"
// biome-ignore lint/correctness/noNodejsModules: idem.
import { join, resolve } from "node:path"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcrypt"
import supertest, { type Agent, type Response } from "supertest"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

const ADMIN_EMAIL = "admin@nexott.local"
const ADMIN_PASSWORD = "Admin1234!"
const ADMIN_PASSWORD_NUEVO = "Nuevo1234XY!"

const HAS_DB_URL = Boolean(process.env.DATABASE_URL)
const DIST_DIR = resolve(__dirname, "..", "dist")
const DIST_DISPONIBLE = existsSync(join(DIST_DIR, "app.module.js"))

if (!HAS_DB_URL) {
  console.warn("auth.e2e.spec: DATABASE_URL ausente — tests SKIP.")
}
if (HAS_DB_URL && !DIST_DISPONIBLE) {
  console.warn(
    "auth.e2e.spec: dist/ no encontrado — el runner vitest no emite decoradores; ejecutar `pnpm --filter @nexott-learn/api build` antes de los e2e. SKIP.",
  )
}

const RUN_E2E = HAS_DB_URL && DIST_DISPONIBLE

interface ModuloApp {
  // biome-ignore lint/style/useNamingConvention: el modulo exporta una clase Nest (PascalCase).
  AppModule: unknown
}
interface ModuloHttp {
  configurarHttp: (app: unknown) => void
}

describe.runIf(RUN_E2E)("auth e2e", () => {
  let app: any
  let agente: Agent
  let csrfAgente: string
  let prisma: PrismaClient

  beforeAll(async () => {
    prisma = new PrismaClient()
    try {
      await prisma.$queryRaw`SELECT 1`
    } catch (error) {
      const detalle = error instanceof Error ? error.message : String(error)
      throw new Error(`No se pudo conectar a la BD para los e2e: ${detalle}`)
    }

    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12)
    const passwordInicialCaduca = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    const colab = await prisma.colaborador.upsert({
      where: { email: ADMIN_EMAIL },
      update: { nombre: "Administrador", estadoEmpleado: "ACTIVO" },
      create: { email: ADMIN_EMAIL, nombre: "Administrador", estadoEmpleado: "ACTIVO" },
      select: { id: true },
    })
    await prisma.usuario.upsert({
      where: { colaboradorId: colab.id },
      update: {
        passwordHash,
        passwordInicialCaduca,
        requiereCambioPassword: true,
        intentosFallidos: 0,
        bloqueado: false,
        rol: "ADMIN",
      },
      create: {
        colaboradorId: colab.id,
        rol: "ADMIN",
        passwordHash,
        passwordInicialCaduca,
        requiereCambioPassword: true,
        intentosFallidos: 0,
        bloqueado: false,
        mfaHabilitado: false,
      },
    })
    await prisma.$executeRaw`
      DELETE FROM sesiones
      WHERE (sess::jsonb->>'usuarioId') IN (
        SELECT id::text FROM usuarios WHERE colaborador_id = ${colab.id}::uuid
      )
    `
    // Limpieza idempotente: borrar historico de passwords del admin para que el
    // cambio a ADMIN_PASSWORD_NUEVO no choque con un run previo.
    await prisma.historicoPassword.deleteMany({
      where: { usuario: { colaboradorId: colab.id } },
    })
    // Borrar colaboradores "victima-*" residuales de runs previos (con sus
    // usuarios y sesiones via cascada).
    const victimas = await prisma.colaborador.findMany({
      where: { email: { contains: "victima-" } },
      select: { id: true },
    })
    for (const v of victimas) {
      await prisma.$executeRaw`
        DELETE FROM sesiones
        WHERE (sess::jsonb->>'usuarioId') IN (
          SELECT id::text FROM usuarios WHERE colaborador_id = ${v.id}::uuid
        )
      `
      await prisma.historicoPassword.deleteMany({
        where: { usuario: { colaboradorId: v.id } },
      })
      await prisma.usuario.deleteMany({ where: { colaboradorId: v.id } })
      await prisma.colaborador.delete({ where: { id: v.id } })
    }

    const moduleApp = (await import(join(DIST_DIR, "app.module.js"))) as ModuloApp
    const moduleHttp = (await import(join(DIST_DIR, "bootstrap-http.js"))) as ModuloHttp
    const { Test } = await import("@nestjs/testing")
    const { ThrottlerGuard } = await import("@nestjs/throttler")
    const throttlerSiempreOk = { canActivate: (): boolean => true }

    const moduleRef = await Test.createTestingModule({
      imports: [moduleApp.AppModule as any],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue(throttlerSiempreOk)
      .compile()

    app = moduleRef.createNestApplication()
    moduleHttp.configurarHttp(app)
    await app.init()
    agente = supertest.agent(app.getHttpServer())
  }, 60_000)

  afterAll(async () => {
    if (app) {
      await app.close()
    }
    if (prisma) {
      await prisma.$disconnect()
    }
  })

  it("login con credenciales correctas devuelve 200, perfil y cookies", async () => {
    const res = await agente
      .post("/api/v1/auth/login")
      .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
    expect(res.status).toBe(200)
    const body = res.body as {
      mfaRequired: boolean
      perfil: { rol: string; requiereCambioPassword: boolean }
    }
    expect(body.mfaRequired).toBe(false)
    expect(body.perfil.rol).toBe("ADMIN")
    expect(body.perfil.requiereCambioPassword).toBe(true)
    const setCookie = (res.headers["set-cookie"] ?? []) as readonly string[]
    expect(setCookie.some((c) => c.startsWith("nexott.sid="))).toBe(true)
    expect(setCookie.some((c) => c.startsWith("XSRF-TOKEN="))).toBe(true)
    const csrf = extraerXsrfDeResponse(res)
    expect(csrf).toBeTruthy()
    csrfAgente = csrf as string
  })

  it("GET /auth/me con la cookie devuelve el perfil", async () => {
    const res = await agente.get("/api/v1/auth/me")
    expect(res.status).toBe(200)
    expect((res.body as { rol: string }).rol).toBe("ADMIN")
  })

  it("POST /auth/cambiar-password sin X-XSRF-TOKEN devuelve 403", async () => {
    const res = await agente
      .post("/api/v1/auth/cambiar-password")
      .send({ passwordActual: ADMIN_PASSWORD, passwordNuevo: ADMIN_PASSWORD_NUEVO })
    expect(res.status).toBe(403)
  })

  it("POST /auth/cambiar-password con X-XSRF-TOKEN incorrecto devuelve 403", async () => {
    const res = await agente
      .post("/api/v1/auth/cambiar-password")
      .set("X-XSRF-TOKEN", "00".repeat(32))
      .send({ passwordActual: ADMIN_PASSWORD, passwordNuevo: ADMIN_PASSWORD_NUEVO })
    expect(res.status).toBe(403)
  })

  it("POST /auth/cambiar-password con CSRF correcto devuelve 204 e inserta historico", async () => {
    expect(csrfAgente).toBeTruthy()
    const res = await agente
      .post("/api/v1/auth/cambiar-password")
      .set("X-XSRF-TOKEN", csrfAgente)
      .send({ passwordActual: ADMIN_PASSWORD, passwordNuevo: ADMIN_PASSWORD_NUEVO })
    expect(res.status).toBe(204)

    const historico = await prisma.historicoPassword.findFirst({
      where: { usuario: { colaborador: { email: ADMIN_EMAIL } } },
      orderBy: { fechaCambio: "desc" },
    })
    expect(historico).not.toBeNull()
  })

  it("re-login con la nueva password funciona y requiereCambio=false", async () => {
    const agenteFresh = supertest.agent(app.getHttpServer())
    const res = await agenteFresh
      .post("/api/v1/auth/login")
      .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD_NUEVO })
    expect(res.status).toBe(200)
    expect(
      (res.body as { perfil: { requiereCambioPassword: boolean } }).perfil.requiereCambioPassword,
    ).toBe(false)
  })

  it("DELETE /auth/session cierra la sesion (GET /me posterior devuelve 401)", async () => {
    const agenteCerrar = supertest.agent(app.getHttpServer())
    const { csrf } = await loginYObtenerCsrf(agenteCerrar, ADMIN_EMAIL, ADMIN_PASSWORD_NUEVO)
    const logout = await agenteCerrar.delete("/api/v1/auth/session").set("X-XSRF-TOKEN", csrf)
    expect(logout.status).toBe(204)

    const me = await agenteCerrar.get("/api/v1/auth/me")
    expect(me.status).toBe(401)
  })

  it(
    "bloqueo tras 5 fallos + desbloqueo via /auth/desbloquear (admin)",
    { timeout: 15_000 },
    async () => {
      const passwordVictima = "Victima12!"
      const passwordHash = await bcrypt.hash(passwordVictima, 12)
      const email = `victima-${Date.now()}@nttdata.test`
      const col = await prisma.colaborador.create({
        data: { email, nombre: "Victima" },
        select: { id: true },
      })
      const usuarioVictima = await prisma.usuario.create({
        data: {
          colaboradorId: col.id,
          rol: "PARTICIPANTE",
          passwordHash,
          requiereCambioPassword: false,
          intentosFallidos: 0,
          bloqueado: false,
        },
        select: { id: true },
      })

      const fallidos = supertest.agent(app.getHttpServer())
      for (let i = 0; i < 5; i += 1) {
        const r = await fallidos.post("/api/v1/auth/login").send({ email, password: "wrong" })
        expect(r.status).toBe(401)
      }
      const tras5 = await prisma.usuario.findUnique({
        where: { id: usuarioVictima.id },
        select: { bloqueado: true, intentosFallidos: true },
      })
      expect(tras5?.bloqueado).toBe(true)

      const r6 = await fallidos
        .post("/api/v1/auth/login")
        .send({ email, password: passwordVictima })
      expect(r6.status).toBe(403)
      expect((r6.body as { code: string }).code).toBe("USUARIO_BLOQUEADO")

      const adminAgent = supertest.agent(app.getHttpServer())
      const { csrf: csrfAdmin } = await loginYObtenerCsrf(
        adminAgent,
        ADMIN_EMAIL,
        ADMIN_PASSWORD_NUEVO,
      )

      const desbloqueo = await adminAgent
        .post("/api/v1/auth/desbloquear")
        .set("X-XSRF-TOKEN", csrfAdmin)
        .set("X-Motivo", "Test e2e: validar desbloqueo")
        .send({ usuarioId: usuarioVictima.id })
      expect(desbloqueo.status).toBe(204)

      const tras = await prisma.usuario.findUnique({
        where: { id: usuarioVictima.id },
        select: { bloqueado: true, intentosFallidos: true },
      })
      expect(tras?.bloqueado).toBe(false)
      expect(tras?.intentosFallidos).toBe(0)

      const reintento = await supertest
        .agent(app.getHttpServer())
        .post("/api/v1/auth/login")
        .send({ email, password: passwordVictima })
      expect(reintento.status).toBe(200)
    },
  )
})

function extraerXsrfDeResponse(res: Response): string | null {
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

async function loginYObtenerCsrf(
  agente: Agent,
  email: string,
  password: string,
): Promise<{ res: Response; csrf: string }> {
  const res = await agente.post("/api/v1/auth/login").send({ email, password })
  const csrf = extraerXsrfDeResponse(res)
  if (!csrf) {
    throw new Error(`No se encontro XSRF-TOKEN en respuesta de login (status ${res.status})`)
  }
  return { res, csrf }
}
