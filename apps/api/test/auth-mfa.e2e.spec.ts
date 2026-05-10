// biome-ignore lint/correctness/noNodejsModules: el harness e2e necesita filesystem para detectar dist/.
import { existsSync } from "node:fs"
// biome-ignore lint/correctness/noNodejsModules: idem.
import { join, resolve } from "node:path"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcrypt"
import { generateSecret, generateSync } from "otplib"
import supertest, { type Agent, type Response } from "supertest"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

const HAS_DB_URL = Boolean(process.env.DATABASE_URL)
const DIST_DIR = resolve(__dirname, "..", "dist")
const DIST_DISPONIBLE = existsSync(join(DIST_DIR, "app.module.js"))
const RUN_E2E = HAS_DB_URL && DIST_DISPONIBLE

if (!HAS_DB_URL) {
  console.warn("auth-mfa.e2e.spec: DATABASE_URL ausente — tests SKIP.")
}
if (HAS_DB_URL && !DIST_DISPONIBLE) {
  console.warn(
    "auth-mfa.e2e.spec: dist/ no encontrado — `pnpm --filter @nexott-learn/api build` antes de los e2e. SKIP.",
  )
}

interface ModuloApp {
  // biome-ignore lint/style/useNamingConvention: el modulo exporta una clase Nest (PascalCase).
  AppModule: unknown
}
interface ModuloHttp {
  configurarHttp: (app: unknown) => void
}

const MFA_USER_PASSWORD = "MfaUser123!"
// Admin dedicado para los e2e MFA — evita race con auth.e2e.spec que muta el
// admin del seed (Admin1234! -> Nuevo1234XY!).
const ADMIN_EMAIL = "admin-mfa-e2e@nexott.local"
const ADMIN_PASSWORD = "MfaAdmin123!"

describe.runIf(RUN_E2E)("auth MFA e2e", () => {
  let app: any
  let prisma: PrismaClient

  beforeAll(async () => {
    prisma = new PrismaClient()
    try {
      await prisma.$queryRaw`SELECT 1`
    } catch (error) {
      const detalle = error instanceof Error ? error.message : String(error)
      throw new Error(`No se pudo conectar a la BD para los e2e: ${detalle}`)
    }

    // Limpieza: borrar usuarios MFA del seed previo (cascada limpia challenges).
    await borrarUsuariosMfaPrevios(prisma)

    // Garantizar admin del seed (se usa para disable admin con motivo).
    await garantizarAdmin(prisma)

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
  }, 60_000)

  afterAll(async () => {
    if (app) {
      await app.close()
    }
    if (prisma) {
      await prisma.$disconnect()
    }
  })

  it("login con MFA habilitado: 200 { mfaRequired:true, mfaChallengeId } sin Set-Cookie de sesion", async () => {
    const { email } = await crearUsuarioConMfaActivo(prisma, "mfa-1")
    const agent = supertest.agent(app.getHttpServer())
    const res = await agent.post("/api/v1/auth/login").send({ email, password: MFA_USER_PASSWORD })
    expect(res.status).toBe(200)
    const body = res.body as { mfaRequired: boolean; mfaChallengeId?: string }
    expect(body.mfaRequired).toBe(true)
    expect(body.mfaChallengeId).toMatch(/^[0-9a-f-]{36}$/)
    const setCookie = (res.headers["set-cookie"] ?? []) as readonly string[]
    expect(setCookie.some((c) => c.startsWith("XSRF-TOKEN="))).toBe(false)
  })

  it("verify con codigo correcto: 200 perfil + cookies de sesion emitidas", async () => {
    const { email, secret } = await crearUsuarioConMfaActivo(prisma, "mfa-2")
    const agent = supertest.agent(app.getHttpServer())
    const login = await agent
      .post("/api/v1/auth/login")
      .send({ email, password: MFA_USER_PASSWORD })
    const challengeId = (login.body as { mfaChallengeId: string }).mfaChallengeId

    const codigo = generateSync({ secret })
    const verify = await agent
      .post("/api/v1/auth/mfa/verify")
      .send({ mfaChallengeId: challengeId, codigo })
    expect(verify.status).toBe(200)
    expect((verify.body as { perfil: { mfaHabilitado: boolean } }).perfil.mfaHabilitado).toBe(true)
    const setCookie = (verify.headers["set-cookie"] ?? []) as readonly string[]
    expect(setCookie.some((c) => c.startsWith("nexott.sid="))).toBe(true)
    expect(setCookie.some((c) => c.startsWith("XSRF-TOKEN="))).toBe(true)

    // Tras verify la cookie de sesion permite acceder a /auth/me.
    const me = await agent.get("/api/v1/auth/me")
    expect(me.status).toBe(200)
  })

  it("verify con 5 codigos incorrectos: 6a llamada devuelve MFA_CHALLENGE_EXPIRADO", async () => {
    const { email } = await crearUsuarioConMfaActivo(prisma, "mfa-3")
    const agent = supertest.agent(app.getHttpServer())
    const login = await agent
      .post("/api/v1/auth/login")
      .send({ email, password: MFA_USER_PASSWORD })
    const challengeId = (login.body as { mfaChallengeId: string }).mfaChallengeId

    for (let i = 0; i < 5; i += 1) {
      const r = await agent
        .post("/api/v1/auth/mfa/verify")
        .send({ mfaChallengeId: challengeId, codigo: "000000" })
      expect(r.status).toBe(401)
      expect((r.body as { code: string }).code).toBe("CODIGO_MFA_INVALIDO")
    }
    const r6 = await agent
      .post("/api/v1/auth/mfa/verify")
      .send({ mfaChallengeId: challengeId, codigo: "000000" })
    expect(r6.status).toBe(401)
    expect((r6.body as { code: string }).code).toBe("MFA_CHALLENGE_EXPIRADO")
  })

  it("flujo completo: alta con habilitarMfa=true -> primer login -> setup -> enable -> opera + re-login con MFA", async () => {
    // 1. Admin crea colaborador con habilitarMfa=true
    const adminAgent = supertest.agent(app.getHttpServer())
    const { csrf: csrfAdmin } = await loginAdmin(adminAgent, prisma)

    const email = `mfa-bisagra-${Date.now()}@nttdata.test`
    const altaRes = await adminAgent
      .post("/api/v1/colaboradores")
      .set("X-XSRF-TOKEN", csrfAdmin)
      .set("X-Motivo", "Test e2e: alta con MFA")
      .send({ email, nombre: "Bisagra", rol: "PARTICIPANTE", habilitarMfa: true })
    expect(altaRes.status).toBe(201)
    const passwordTemp = (altaRes.body as { passwordTemporal: string }).passwordTemporal
    const usuarioId = (altaRes.body as { usuario: { id: string } }).usuario.id

    // 2. Cambio password (necesario por requiereCambioPassword=true).
    const userAgent = supertest.agent(app.getHttpServer())
    const loginInicial = await userAgent
      .post("/api/v1/auth/login")
      .send({ email, password: passwordTemp })
    expect(loginInicial.status).toBe(200)
    const csrfUser = extraerXsrfDeResponse(loginInicial)
    expect(csrfUser).toBeTruthy()

    const cambio = await userAgent
      .post("/api/v1/auth/cambiar-password")
      .set("X-XSRF-TOKEN", csrfUser as string)
      .send({ passwordActual: passwordTemp, passwordNuevo: MFA_USER_PASSWORD })
    expect(cambio.status).toBe(204)

    // 3. Re-login con la password definitiva (sigue requiereSetupMfa=true).
    const userAgent2 = supertest.agent(app.getHttpServer())
    const login2 = await userAgent2
      .post("/api/v1/auth/login")
      .send({ email, password: MFA_USER_PASSWORD })
    expect(login2.status).toBe(200)
    const csrfUser2 = extraerXsrfDeResponse(login2)
    expect(csrfUser2).toBeTruthy()

    // 4. MustSetupMfaGuard bloquea endpoints fuera del flujo.
    // POST /api/v1/colaboradores no esta en la allow-list y rechaza con 403.
    const noPermitido = await userAgent2
      .post("/api/v1/colaboradores")
      .set("X-XSRF-TOKEN", csrfUser2 as string)
      .set("X-Motivo", "intento ilegitimo")
      .send({ email: "x@y.z", nombre: "x", rol: "PARTICIPANTE", habilitarMfa: false })
    expect(noPermitido.status).toBe(403)
    expect((noPermitido.body as { code: string }).code).toBe("SETUP_MFA_REQUERIDO")

    // 5. Setup TOTP.
    const setup = await userAgent2
      .post("/api/v1/auth/mfa/setup")
      .set("X-XSRF-TOKEN", csrfUser2 as string)
      .send()
    expect(setup.status).toBe(201)
    const secret = (setup.body as { secret: string }).secret
    expect(secret).toMatch(/^[A-Z2-7]+$/)

    // 6. Enable con codigo.
    const codigoEnable = generateSync({ secret })
    const enable = await userAgent2
      .post("/api/v1/auth/mfa/enable")
      .set("X-XSRF-TOKEN", csrfUser2 as string)
      .send({ codigo: codigoEnable })
    expect(enable.status).toBe(204)

    // 7. Verificar en BD.
    const tras = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { mfaHabilitado: true, requiereSetupMfa: true, mfaSecret: true },
    })
    expect(tras?.mfaHabilitado).toBe(true)
    expect(tras?.requiereSetupMfa).toBe(false)
    expect(tras?.mfaSecret).toBeTruthy()
    expect(tras?.mfaSecret).not.toBe(secret) // cifrado, no plain

    // 8. Re-login: ahora pide mfa.
    const userAgent3 = supertest.agent(app.getHttpServer())
    const login3 = await userAgent3
      .post("/api/v1/auth/login")
      .send({ email, password: MFA_USER_PASSWORD })
    expect(login3.status).toBe(200)
    expect((login3.body as { mfaRequired: boolean }).mfaRequired).toBe(true)
  }, 30_000)

  it("delete MFA propio con codigo: 204", async () => {
    const { email, secret, usuarioId } = await crearUsuarioConMfaActivo(prisma, "mfa-disable-self")
    const agent = supertest.agent(app.getHttpServer())
    const login = await agent
      .post("/api/v1/auth/login")
      .send({ email, password: MFA_USER_PASSWORD })
    const challengeId = (login.body as { mfaChallengeId: string }).mfaChallengeId
    const codigoVerify = generateSync({ secret })
    const verify = await agent
      .post("/api/v1/auth/mfa/verify")
      .send({ mfaChallengeId: challengeId, codigo: codigoVerify })
    expect(verify.status).toBe(200)
    const csrf = extraerXsrfDeResponse(verify)

    const codigoDisable = generateSync({ secret })
    const del = await agent
      .delete("/api/v1/auth/mfa")
      .set("X-XSRF-TOKEN", csrf as string)
      .set("X-Motivo", "Test e2e: auto-disable")
      .send({ codigo: codigoDisable })
    expect(del.status).toBe(204)

    const tras = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { mfaHabilitado: true, mfaSecret: true },
    })
    expect(tras?.mfaHabilitado).toBe(false)
    expect(tras?.mfaSecret).toBeNull()
  })

  it("delete MFA admin sin X-Motivo: 422 MOTIVO_REQUERIDO; con X-Motivo: 204", async () => {
    const { usuarioId } = await crearUsuarioConMfaActivo(prisma, "mfa-disable-admin")
    const adminAgent = supertest.agent(app.getHttpServer())
    const { csrf } = await loginAdmin(adminAgent, prisma)

    const sinMotivo = await adminAgent
      .delete("/api/v1/auth/mfa")
      .set("X-XSRF-TOKEN", csrf)
      .send({ usuarioId })
    expect(sinMotivo.status).toBe(422)
    expect((sinMotivo.body as { code: string }).code).toBe("MOTIVO_REQUERIDO")

    const conMotivo = await adminAgent
      .delete("/api/v1/auth/mfa")
      .set("X-XSRF-TOKEN", csrf)
      .set("X-Motivo", "Test e2e: admin disable")
      .send({ usuarioId })
    expect(conMotivo.status).toBe(204)
  })
})

async function borrarUsuariosMfaPrevios(prisma: PrismaClient): Promise<void> {
  const previos = await prisma.colaborador.findMany({
    where: { email: { contains: "mfa-" } },
    select: { id: true },
  })
  for (const v of previos) {
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
}

async function garantizarAdmin(prisma: PrismaClient): Promise<void> {
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12)
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
      requiereCambioPassword: false,
      passwordInicialCaduca: null,
      intentosFallidos: 0,
      bloqueado: false,
      mfaHabilitado: false,
      requiereSetupMfa: false,
      rol: "ADMIN",
    },
    create: {
      colaboradorId: colab.id,
      rol: "ADMIN",
      passwordHash,
      requiereCambioPassword: false,
      mfaHabilitado: false,
      requiereSetupMfa: false,
    },
  })
}

async function crearUsuarioConMfaActivo(
  prisma: PrismaClient,
  prefix: string,
): Promise<{ readonly email: string; readonly secret: string; readonly usuarioId: string }> {
  const email = `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@nttdata.test`
  const passwordHash = await bcrypt.hash(MFA_USER_PASSWORD, 12)
  const colab = await prisma.colaborador.create({
    data: { email, nombre: "MFA Test" },
    select: { id: true },
  })
  // otplib v13 exige >=16 bytes (128 bits) — default 20 bytes lo cumple.
  const secret = generateSecret()
  // Cifrar usando el mismo CifradoService que la app (importado del dist).
  const cifradoModule = (await import("../dist/common/crypto/cifrado.service.js")) as {
    // biome-ignore lint/style/useNamingConvention: reflejamos el nombre exportado por el modulo (clase Nest).
    CifradoService: new (
      config: unknown,
    ) => { encriptar: (plain: string) => string }
  }
  const config = {
    get: (k: string): string => {
      if (k === "SECRETS_ENCRYPTION_KEY") {
        const v = process.env.SECRETS_ENCRYPTION_KEY
        if (!v) {
          throw new Error("SECRETS_ENCRYPTION_KEY no definida en process.env (requerido para e2e)")
        }
        return v
      }
      throw new Error(`Clave inesperada: ${k}`)
    },
  }
  const cifrado = new cifradoModule.CifradoService(config)
  const cifradoSecret = cifrado.encriptar(secret)
  const usuario = await prisma.usuario.create({
    data: {
      colaboradorId: colab.id,
      rol: "PARTICIPANTE",
      passwordHash,
      requiereCambioPassword: false,
      mfaHabilitado: true,
      requiereSetupMfa: false,
      mfaSecret: cifradoSecret,
      intentosFallidos: 0,
    },
    select: { id: true },
  })
  return { email, secret, usuarioId: usuario.id }
}

async function loginAdmin(agent: Agent, prisma: PrismaClient): Promise<{ readonly csrf: string }> {
  // Asegurar que el admin no quedo con flags raros entre tests.
  await prisma.usuario.updateMany({
    where: { colaborador: { email: ADMIN_EMAIL } },
    data: { requiereSetupMfa: false, mfaHabilitado: false, bloqueado: false, intentosFallidos: 0 },
  })
  const res = await agent
    .post("/api/v1/auth/login")
    .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
  if (res.status !== 200) {
    throw new Error(`No se pudo loguear admin para e2e (status ${res.status})`)
  }
  const csrf = extraerXsrfDeResponse(res)
  if (!csrf) {
    throw new Error("No se obtuvo XSRF-TOKEN del login admin")
  }
  return { csrf }
}

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
