// biome-ignore lint/correctness/noNodejsModules: el harness e2e necesita filesystem para detectar dist/.
import { existsSync } from "node:fs"
// biome-ignore lint/correctness/noNodejsModules: idem.
import { join, resolve } from "node:path"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcrypt"
import supertest, { type Agent } from "supertest"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

const HAS_DB_URL = Boolean(process.env.DATABASE_URL)
const DIST_DIR = resolve(__dirname, "..", "dist")
const DIST_DISPONIBLE = existsSync(join(DIST_DIR, "app.module.js"))

if (!HAS_DB_URL) {
  console.warn("catalogo.e2e.spec: DATABASE_URL ausente — tests SKIP.")
}
if (HAS_DB_URL && !DIST_DISPONIBLE) {
  console.warn(
    "catalogo.e2e.spec: dist/ no encontrado — ejecutar `pnpm --filter @nexott-learn/api build`. SKIP.",
  )
}

const RUN_E2E = HAS_DB_URL && DIST_DISPONIBLE

// Admin propio para este e2e — evita pelearse con auth.e2e.spec.ts que muta la
// password del admin principal en paralelo.
const ADMIN_EMAIL = "catalogo-admin@nttdata.test"
const ADMIN_PASSWORD = "Catalogo1234!"

interface ModuloApp {
  // biome-ignore lint/style/useNamingConvention: la clase Nest es PascalCase.
  AppModule: unknown
}
interface ModuloHttp {
  configurarHttp: (app: unknown) => void
}

describe.runIf(RUN_E2E)("catalogo e2e", () => {
  let app: any
  let agente: Agent
  let prisma: PrismaClient

  beforeAll(async () => {
    prisma = new PrismaClient()
    try {
      await prisma.$queryRaw`SELECT 1`
    } catch (error) {
      const detalle = error instanceof Error ? error.message : String(error)
      throw new Error(`No se pudo conectar a la BD para los e2e: ${detalle}`)
    }

    // Upsert idempotente del admin de este e2e. requiereCambioPassword=false
    // para poder llamar a endpoints sin el flujo de cambio obligatorio.
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12)
    const col = await prisma.colaborador.upsert({
      where: { email: ADMIN_EMAIL },
      update: { nombre: "Catalogo Admin", estadoEmpleado: "ACTIVO" },
      create: { email: ADMIN_EMAIL, nombre: "Catalogo Admin", estadoEmpleado: "ACTIVO" },
      select: { id: true },
    })
    await prisma.usuario.upsert({
      where: { colaboradorId: col.id },
      update: {
        passwordHash,
        requiereCambioPassword: false,
        passwordInicialCaduca: null,
        intentosFallidos: 0,
        bloqueado: false,
        rol: "ADMIN",
        mfaHabilitado: false,
        requiereSetupMfa: false,
      },
      create: {
        colaboradorId: col.id,
        rol: "ADMIN",
        passwordHash,
        requiereCambioPassword: false,
        intentosFallidos: 0,
        bloqueado: false,
        mfaHabilitado: false,
      },
    })
    await prisma.$executeRaw`
      DELETE FROM sesiones
      WHERE (sess::jsonb->>'usuarioId') IN (
        SELECT id::text FROM usuarios WHERE colaborador_id = ${col.id}::uuid
      )
    `

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

    const login = await agente
      .post("/api/v1/auth/login")
      .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
    if (login.status !== 200) {
      throw new Error(`Login del admin de catalogo fallo con status ${login.status}`)
    }
  }, 60_000)

  afterAll(async () => {
    if (app) {
      await app.close()
    }
    if (prisma) {
      await prisma.$disconnect()
    }
  })

  it("GET /catalogo/areas sin sesion: 401 NO_AUTENTICADO", async () => {
    const anon = supertest.agent(app.getHttpServer())
    const res = await anon.get("/api/v1/catalogo/areas")
    expect(res.status).toBe(401)
    expect((res.body as { code: string }).code).toBe("NO_AUTENTICADO")
  })

  it("GET /catalogo/areas: 200 con seed (>=2 areas) y meta paginada", async () => {
    const res = await agente.get("/api/v1/catalogo/areas")
    expect(res.status).toBe(200)
    const body = res.body as {
      data: readonly { id: string; nombre: string }[]
      meta: { page: number; pageSize: number; total: number; totalPages: number }
    }
    expect(body.data.length).toBeGreaterThanOrEqual(2)
    expect(body.meta.page).toBe(1)
    expect(body.meta.pageSize).toBe(20)
  })

  it("GET /catalogo/skills: 200 con seed (>=3 skills)", async () => {
    const res = await agente.get("/api/v1/catalogo/skills")
    expect(res.status).toBe(200)
    expect((res.body as { data: readonly unknown[] }).data.length).toBeGreaterThanOrEqual(3)
  })

  it("GET /catalogo/modulos: 200 con seed (>=2 modulos)", async () => {
    const res = await agente.get("/api/v1/catalogo/modulos")
    expect(res.status).toBe(200)
    expect((res.body as { data: readonly unknown[] }).data.length).toBeGreaterThanOrEqual(2)
  })

  it("GET /catalogo/secciones: 200 con seed (>=4 secciones)", async () => {
    const res = await agente.get("/api/v1/catalogo/secciones")
    expect(res.status).toBe(200)
    expect((res.body as { data: readonly unknown[] }).data.length).toBeGreaterThanOrEqual(4)
  })

  it("GET /catalogo/bloques: 200 con seed (>=4 bloques) sin `contenido` en listado", async () => {
    const res = await agente.get("/api/v1/catalogo/bloques")
    expect(res.status).toBe(200)
    const body = res.body as { data: readonly Record<string, unknown>[] }
    expect(body.data.length).toBeGreaterThanOrEqual(4)
    for (const b of body.data) {
      expect(b).not.toHaveProperty("contenido")
    }
  })

  it("GET /catalogo/clientes: 200 con seed (>=2 clientes) sin `datosContacto` en listado", async () => {
    const res = await agente.get("/api/v1/catalogo/clientes")
    expect(res.status).toBe(200)
    const body = res.body as { data: readonly Record<string, unknown>[] }
    expect(body.data.length).toBeGreaterThanOrEqual(2)
    for (const c of body.data) {
      expect(c).not.toHaveProperty("datosContacto")
    }
  })

  it("filtro skills?areaId=<id>: limita resultados a esa area", async () => {
    const areas = await agente.get("/api/v1/catalogo/areas")
    const backend = (areas.body as { data: readonly { id: string; nombre: string }[] }).data.find(
      (a) => a.nombre === "Backend",
    )
    expect(backend).toBeDefined()

    const res = await agente.get(`/api/v1/catalogo/skills?areaId=${backend?.id}`)
    expect(res.status).toBe(200)
    const body = res.body as { data: readonly { areaId: string }[] }
    expect(body.data.length).toBeGreaterThanOrEqual(1)
    for (const s of body.data) {
      expect(s.areaId).toBe(backend?.id)
    }
  })

  it("GET /catalogo/areas/<uuid-inexistente>: 404 AREA_NO_ENCONTRADA", async () => {
    const res = await agente.get("/api/v1/catalogo/areas/00000000-0000-0000-0000-000000000000")
    expect(res.status).toBe(404)
    expect((res.body as { code: string }).code).toBe("AREA_NO_ENCONTRADA")
  })

  it("validacion Zod: ?page=0 rechazado por el pipe (400 INVALID_BODY)", async () => {
    const res = await agente.get("/api/v1/catalogo/areas?page=0")
    // El ZodValidationPipe del proyecto siempre arroja BadRequestException con
    // code=INVALID_BODY, independientemente del origen (body vs query). Patron
    // existente; no es alcance de este slice cambiarlo.
    expect(res.status).toBe(400)
    expect((res.body as { code: string }).code).toBe("INVALID_BODY")
  })

  it("GET /catalogo/bloques/:id devuelve detalle CON `contenido`", async () => {
    const lista = await agente.get("/api/v1/catalogo/bloques")
    const primero = (lista.body as { data: readonly { id: string }[] }).data[0]
    expect(primero).toBeDefined()

    const detalle = await agente.get(`/api/v1/catalogo/bloques/${primero?.id}`)
    expect(detalle.status).toBe(200)
    expect(detalle.body).toHaveProperty("contenido")
  })
})
