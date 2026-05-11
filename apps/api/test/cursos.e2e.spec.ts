// biome-ignore lint/correctness/noNodejsModules: el harness e2e necesita filesystem para detectar dist/.
import { existsSync } from "node:fs"
// biome-ignore lint/correctness/noNodejsModules: idem.
import { join, resolve } from "node:path"
import type { INestApplication, Type } from "@nestjs/common"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcrypt"
import supertest, { type Agent, type Response } from "supertest"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

const HAS_DB_URL = Boolean(process.env.DATABASE_URL)
const DIST_DIR = resolve(__dirname, "..", "dist")
const DIST_DISPONIBLE = existsSync(join(DIST_DIR, "app.module.js"))

if (!HAS_DB_URL) {
  console.warn("cursos.e2e.spec: DATABASE_URL ausente — tests SKIP.")
}
if (HAS_DB_URL && !DIST_DISPONIBLE) {
  console.warn(
    "cursos.e2e.spec: dist/ no encontrado — ejecutar `pnpm --filter @nexott-learn/api build`. SKIP.",
  )
}

const RUN_E2E = HAS_DB_URL && DIST_DISPONIBLE

const ADMIN_EMAIL = "cursos-admin-p4a@nttdata.test"
const PARTICIPANTE_EMAIL = "cursos-part-p4a@nttdata.test"
const PASSWORD = "Cursos1234!"
const CLIENTE_NOMBRE = "ACME P4a e2e"
const TITULO_PREFIX = "P4a-e2e-"

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

describe.runIf(RUN_E2E)("cursos e2e (P4a)", () => {
  let app: INestApplication
  let agenteAdmin: Agent
  let agentePart: Agent
  let csrfAdmin: string
  let csrfPart: string
  let prisma: PrismaClient
  let clienteId: string

  beforeAll(async () => {
    prisma = new PrismaClient()
    try {
      await prisma.$queryRaw`SELECT 1`
    } catch (error) {
      const detalle = error instanceof Error ? error.message : String(error)
      throw new Error(`No se pudo conectar a la BD para los e2e: ${detalle}`)
    }

    const passwordHash = await bcrypt.hash(PASSWORD, 12)
    const colAdmin = await prisma.colaborador.upsert({
      where: { email: ADMIN_EMAIL },
      update: { nombre: "P4a Admin", estadoEmpleado: "ACTIVO" },
      create: { email: ADMIN_EMAIL, nombre: "P4a Admin", estadoEmpleado: "ACTIVO" },
      select: { id: true },
    })
    await prisma.usuario.upsert({
      where: { colaboradorId: colAdmin.id },
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
        colaboradorId: colAdmin.id,
        rol: "ADMIN",
        passwordHash,
        requiereCambioPassword: false,
        intentosFallidos: 0,
        bloqueado: false,
        mfaHabilitado: false,
      },
    })

    const colPart = await prisma.colaborador.upsert({
      where: { email: PARTICIPANTE_EMAIL },
      update: { nombre: "P4a Part", estadoEmpleado: "ACTIVO" },
      create: { email: PARTICIPANTE_EMAIL, nombre: "P4a Part", estadoEmpleado: "ACTIVO" },
      select: { id: true },
    })
    await prisma.usuario.upsert({
      where: { colaboradorId: colPart.id },
      update: {
        passwordHash,
        requiereCambioPassword: false,
        passwordInicialCaduca: null,
        intentosFallidos: 0,
        bloqueado: false,
        rol: "PARTICIPANTE",
        mfaHabilitado: false,
        requiereSetupMfa: false,
      },
      create: {
        colaboradorId: colPart.id,
        rol: "PARTICIPANTE",
        passwordHash,
        requiereCambioPassword: false,
        intentosFallidos: 0,
        bloqueado: false,
        mfaHabilitado: false,
      },
    })

    const cliente = await prisma.cliente.upsert({
      where: { nombre: CLIENTE_NOMBRE },
      update: { activo: true, deletedAt: null },
      create: { nombre: CLIENTE_NOMBRE, activo: true },
      select: { id: true },
    })
    clienteId = cliente.id

    await prisma.$executeRaw`
      DELETE FROM sesiones
      WHERE (sess::jsonb->>'usuarioId') IN (
        SELECT id::text FROM usuarios WHERE colaborador_id IN (${colAdmin.id}::uuid, ${colPart.id}::uuid)
      )
    `

    const moduleApp = (await import(join(DIST_DIR, "app.module.js"))) as ModuloApp
    const moduleHttp = (await import(join(DIST_DIR, "bootstrap-http.js"))) as ModuloHttp
    const { Test } = await import("@nestjs/testing")
    const { ThrottlerGuard } = await import("@nestjs/throttler")
    const throttlerSiempreOk = { canActivate: (): boolean => true }
    const moduleRef = await Test.createTestingModule({
      imports: [moduleApp.AppModule],
    })
      .overrideGuard(ThrottlerGuard)
      .useValue(throttlerSiempreOk)
      .compile()
    app = moduleRef.createNestApplication()
    moduleHttp.configurarHttp(app)
    await app.init()
    agenteAdmin = supertest.agent(app.getHttpServer())
    agentePart = supertest.agent(app.getHttpServer())
    csrfAdmin = await loginYObtenerCsrf(agenteAdmin, ADMIN_EMAIL)
    csrfPart = await loginYObtenerCsrf(agentePart, PARTICIPANTE_EMAIL)
  }, 60_000)

  afterAll(async () => {
    try {
      const colAdmin = await prisma.colaborador.findUnique({
        where: { email: ADMIN_EMAIL },
        select: { id: true },
      })
      const colPart = await prisma.colaborador.findUnique({
        where: { email: PARTICIPANTE_EMAIL },
        select: { id: true },
      })
      const tituloLike = `%${TITULO_PREFIX}%`
      await prisma.$executeRaw`
        DELETE FROM log_cambios_curso WHERE curso_id IN (
          SELECT id FROM cursos WHERE titulo LIKE ${tituloLike}
        )
      `
      await prisma.curso.deleteMany({ where: { titulo: { contains: TITULO_PREFIX } } })
      const cli = await prisma.cliente.findUnique({
        where: { nombre: CLIENTE_NOMBRE },
        select: { id: true },
      })
      if (cli) {
        await prisma.cliente.delete({ where: { id: cli.id } })
      }
      const ids = [colAdmin?.id, colPart?.id].filter((v): v is string => Boolean(v))
      if (ids.length > 0) {
        await prisma.$executeRaw`
          DELETE FROM sesiones
          WHERE (sess::jsonb->>'usuarioId') IN (
            SELECT id::text FROM usuarios WHERE colaborador_id = ANY(${ids}::uuid[])
          )
        `
        await prisma.usuario.deleteMany({ where: { colaboradorId: { in: ids } } })
        await prisma.colaborador.deleteMany({ where: { id: { in: ids } } })
      }
    } catch (error) {
      const detalle = error instanceof Error ? error.message : String(error)
      console.warn(`cursos.e2e cleanup fallo (no rompe teardown): ${detalle}`)
    }
    if (app) {
      await app.close()
    }
    if (prisma) {
      await prisma.$disconnect()
    }
  })

  it("POST /cursos sin sesión: 401", async () => {
    const anon = supertest.agent(app.getHttpServer())
    const res = await anon.post("/api/v1/cursos").send({
      titulo: `${TITULO_PREFIX}anon`,
      clienteId,
      fechaInicio: "2026-04-01",
      fechaDeadline: "2026-06-30",
    })
    expect(res.status).toBe(401)
  })

  it("POST /cursos (ADMIN): 201 con curso en BORRADOR", async () => {
    const titulo = `${TITULO_PREFIX}crear`
    const res = await agenteAdmin.post("/api/v1/cursos").set("X-XSRF-TOKEN", csrfAdmin).send({
      titulo,
      clienteId,
      fechaInicio: "2026-04-01",
      fechaDeadline: "2026-06-30",
    })
    expect(res.status).toBe(201)
    const body = res.body as { id: string; estado: string; titulo: string }
    expect(body.estado).toBe("BORRADOR")
    expect(body.titulo).toBe(titulo)
  })

  it("POST /cursos (PARTICIPANTE): 403", async () => {
    const res = await agentePart
      .post("/api/v1/cursos")
      .set("X-XSRF-TOKEN", csrfPart)
      .send({
        titulo: `${TITULO_PREFIX}part`,
        clienteId,
        fechaInicio: "2026-04-01",
        fechaDeadline: "2026-06-30",
      })
    expect(res.status).toBe(403)
  })

  it("POST /cursos: 422 si fechas inválidas", async () => {
    const res = await agenteAdmin
      .post("/api/v1/cursos")
      .set("X-XSRF-TOKEN", csrfAdmin)
      .send({
        titulo: `${TITULO_PREFIX}fechas`,
        clienteId,
        fechaInicio: "2026-06-30",
        fechaDeadline: "2026-04-01",
      })
    expect(res.status).toBe(422)
    expect((res.body as { code: string }).code).toBe("VALIDACION_CURSO_FECHAS")
  })

  it("GET /cursos/:id (PARTICIPANTE sin asignación): 404 si curso BORRADOR", async () => {
    const create = await agenteAdmin
      .post("/api/v1/cursos")
      .set("X-XSRF-TOKEN", csrfAdmin)
      .send({
        titulo: `${TITULO_PREFIX}part-no-ve`,
        clienteId,
        fechaInicio: "2026-04-01",
        fechaDeadline: "2026-06-30",
      })
    const cursoId = (create.body as { id: string }).id
    const res = await agentePart.get(`/api/v1/cursos/${cursoId}`)
    expect(res.status).toBe(404)
  })

  it("PATCH /cursos/:id en BORRADOR: 200; DELETE en BORRADOR: 204", async () => {
    const create = await agenteAdmin
      .post("/api/v1/cursos")
      .set("X-XSRF-TOKEN", csrfAdmin)
      .send({
        titulo: `${TITULO_PREFIX}patch-delete`,
        clienteId,
        fechaInicio: "2026-04-01",
        fechaDeadline: "2026-06-30",
      })
    const cursoId = (create.body as { id: string }).id
    const patch = await agenteAdmin
      .patch(`/api/v1/cursos/${cursoId}`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .send({ titulo: `${TITULO_PREFIX}patch-delete-updated` })
    expect(patch.status).toBe(200)
    expect((patch.body as { titulo: string }).titulo).toBe(`${TITULO_PREFIX}patch-delete-updated`)
    const del = await agenteAdmin.delete(`/api/v1/cursos/${cursoId}`).set("X-XSRF-TOKEN", csrfAdmin)
    expect(del.status).toBe(204)
    const after = await agenteAdmin.get(`/api/v1/cursos/${cursoId}`)
    expect(after.status).toBe(404)
  })

  it("POST /cursos/:id/archivar: 409 si curso BORRADOR", async () => {
    const create = await agenteAdmin
      .post("/api/v1/cursos")
      .set("X-XSRF-TOKEN", csrfAdmin)
      .send({
        titulo: `${TITULO_PREFIX}archivar`,
        clienteId,
        fechaInicio: "2026-04-01",
        fechaDeadline: "2026-06-30",
      })
    const cursoId = (create.body as { id: string }).id
    const res = await agenteAdmin
      .post(`/api/v1/cursos/${cursoId}/archivar`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .set("X-Motivo", "Cerrando")
    expect(res.status).toBe(409)
    expect((res.body as { code: string }).code).toBe("CONFLICT_CURSO_NO_CERRADO")
  })

  it("POST /cursos/:id/duplicar: 201 con curso BORRADOR y modulosExcluidos=[]", async () => {
    const create = await agenteAdmin
      .post("/api/v1/cursos")
      .set("X-XSRF-TOKEN", csrfAdmin)
      .send({
        titulo: `${TITULO_PREFIX}fuente`,
        clienteId,
        fechaInicio: "2026-04-01",
        fechaDeadline: "2026-06-30",
      })
    const cursoFuenteId = (create.body as { id: string }).id
    const res = await agenteAdmin
      .post(`/api/v1/cursos/${cursoFuenteId}/duplicar`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .set("X-Motivo", "Plantilla nueva")
      .send({ tituloNuevo: `${TITULO_PREFIX}duplicado` })
    expect(res.status).toBe(201)
    const body = res.body as {
      curso: { estado: string; titulo: string }
      modulosExcluidos: unknown[]
    }
    expect(body.curso.estado).toBe("BORRADOR")
    expect(body.curso.titulo).toBe(`${TITULO_PREFIX}duplicado`)
    expect(body.modulosExcluidos).toEqual([])
  })

  it("GET /cursos/:id/log-cambios: 200 con paginado y al menos 1 entrada (Creación)", async () => {
    const create = await agenteAdmin
      .post("/api/v1/cursos")
      .set("X-XSRF-TOKEN", csrfAdmin)
      .send({
        titulo: `${TITULO_PREFIX}log`,
        clienteId,
        fechaInicio: "2026-04-01",
        fechaDeadline: "2026-06-30",
      })
    const cursoId = (create.body as { id: string }).id
    const res = await agenteAdmin.get(`/api/v1/cursos/${cursoId}/log-cambios`)
    expect(res.status).toBe(200)
    const body = res.body as {
      data: readonly { accion: string; motivo: string }[]
      meta: { total: number }
    }
    expect(body.meta.total).toBeGreaterThanOrEqual(1)
    expect(body.data[0]?.motivo).toBe("Creación")
  })

  it("GET /cursos (PARTICIPANTE): solo ve cursos asignados o ACTIVO+toggleVoluntarios", async () => {
    const res = await agentePart.get("/api/v1/cursos")
    expect(res.status).toBe(200)
    const body = res.body as { data: readonly { titulo: string }[] }
    for (const c of body.data) {
      expect(c.titulo).not.toMatch(/^P4a-e2e-/u)
    }
  })
})
