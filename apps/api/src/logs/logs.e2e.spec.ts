import { existsSync } from "node:fs"
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
  console.warn("logs.e2e.spec: DATABASE_URL ausente — tests SKIP.")
}
if (HAS_DB_URL && !DIST_DISPONIBLE) {
  console.warn("logs.e2e.spec: dist/ no encontrado — SKIP.")
}

const RUN_E2E = HAS_DB_URL && DIST_DISPONIBLE

const ADMIN_EMAIL = "logs-admin-pba@nttdata.test"
const PART_EMAIL = "logs-part-pba@nttdata.test"
const PASSWORD = "LogsAudit1234!"

const MARKER_CURSO_TITULO = "Curso e2e logs PBa"
const MARKER_CLIENTE_NOMBRE = "Cliente e2e logs PBa"

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

describe.runIf(RUN_E2E)("Logs e2e (Slice futuro B foundation — /admin/logs)", () => {
  let app: INestApplication
  let prisma: PrismaClient
  let agenteAdmin: Agent
  let agentePart: Agent
  let adminUsuarioId: string
  let cursoId: string
  let asignacionId: string

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
    adminUsuarioId = await upsertUsuario(prisma, ADMIN_EMAIL, passwordHash, "ADMIN", "Admin PBa")
    const partUsuarioId = await upsertUsuario(
      prisma,
      PART_EMAIL,
      passwordHash,
      "PARTICIPANTE",
      "Part PBa",
    )

    // Cliente + curso + asignacion marker, idempotente por nombre/titulo.
    const cliente = await prisma.cliente.upsert({
      where: { nombre: MARKER_CLIENTE_NOMBRE },
      update: { activo: true, deletedAt: null },
      create: { nombre: MARKER_CLIENTE_NOMBRE, activo: true },
      select: { id: true },
    })
    const cursoExistente = await prisma.curso.findFirst({
      where: { titulo: MARKER_CURSO_TITULO, clienteId: cliente.id },
      select: { id: true },
    })
    cursoId =
      cursoExistente?.id ??
      (
        await prisma.curso.create({
          data: {
            titulo: MARKER_CURSO_TITULO,
            clienteId: cliente.id,
            fechaInicio: new Date("2026-05-01"),
            fechaDeadline: new Date("2026-08-31"),
          },
          select: { id: true },
        })
      ).id

    // Colaborador participante asignado al curso.
    const colaboradorPart = await prisma.usuario.findUniqueOrThrow({
      where: { id: partUsuarioId },
      select: { colaboradorId: true },
    })
    const asignacionExistente = await prisma.asignacionCurso.findUnique({
      where: {
        // biome-ignore lint/style/useNamingConvention: clave compuesta generada por Prisma.
        colaboradorId_cursoId: {
          colaboradorId: colaboradorPart.colaboradorId,
          cursoId,
        },
      },
      select: { id: true },
    })
    asignacionId =
      asignacionExistente?.id ??
      (
        await prisma.asignacionCurso.create({
          data: {
            colaboradorId: colaboradorPart.colaboradorId,
            cursoId,
            rol: "ASIGNADO",
            estadoAsignado: "ASIGNADO",
          },
          select: { id: true },
        })
      ).id

    // Limpiar markers previos.
    await prisma.historicoEstadoAsignacion.deleteMany({
      where: { asignacionId, motivo: "marker-e2e-pba" },
    })
    await prisma.logCambioCurso.deleteMany({
      where: { cursoId, motivo: "marker-e2e-pba" },
    })

    // 3 cambios de curso + 3 cambios de asignacion como markers.
    await prisma.logCambioCurso.createMany({
      data: [
        {
          cursoId,
          autorUsuarioId: adminUsuarioId,
          accion: "PUBLICACION",
          motivo: "marker-e2e-pba",
        },
        {
          cursoId,
          autorUsuarioId: adminUsuarioId,
          accion: "CAMBIO_PESOS",
          motivo: "marker-e2e-pba",
        },
        {
          cursoId,
          autorUsuarioId: adminUsuarioId,
          accion: "CAMBIO_MODULOS",
          motivo: "marker-e2e-pba",
        },
      ],
    })
    await prisma.historicoEstadoAsignacion.createMany({
      data: [
        {
          asignacionId,
          autorUsuarioId: adminUsuarioId,
          estadoAnterior: "ASIGNADO",
          estadoNuevo: "EN_PROGRESO",
          motivo: "marker-e2e-pba",
        },
        {
          asignacionId,
          autorUsuarioId: adminUsuarioId,
          estadoAnterior: "EN_PROGRESO",
          estadoNuevo: "LISTO",
          motivo: "marker-e2e-pba",
        },
        {
          asignacionId,
          autorUsuarioId: adminUsuarioId,
          estadoAnterior: "LISTO",
          estadoNuevo: "APTO",
          motivo: "marker-e2e-pba",
        },
      ],
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
    const { ThrottlerStorageFake } = await import("../../test/throttler-storage-fake.js")
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
      await prisma.historicoEstadoAsignacion.deleteMany({
        where: { asignacionId, motivo: "marker-e2e-pba" },
      })
      await prisma.logCambioCurso.deleteMany({
        where: { cursoId, motivo: "marker-e2e-pba" },
      })
      await prisma.consultaLog.deleteMany({
        where: { autorUsuarioId: adminUsuarioId, endpoint: { startsWith: "/admin/logs/" } },
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

  it("Sin sesion -> 401 en cursos", async () => {
    await supertest(app.getHttpServer()).get("/api/v1/admin/logs/cursos").expect(401)
  })

  it("PARTICIPANTE -> 403 en cursos", async () => {
    await agentePart.get("/api/v1/admin/logs/cursos").expect(403)
  })

  it("PARTICIPANTE -> 403 en asignaciones", async () => {
    await agentePart.get("/api/v1/admin/logs/asignaciones").expect(403)
  })

  it("ADMIN lista cursos filtrado -> 200 paginado", async () => {
    const res = await agenteAdmin.get(`/api/v1/admin/logs/cursos?cursoId=${cursoId}`).expect(200)
    expect(res.body.meta).toBeDefined()
    expect(res.body.meta.total).toBeGreaterThanOrEqual(3)
    expect(Array.isArray(res.body.data)).toBe(true)
    const fila = res.body.data[0]
    expect(fila).toHaveProperty("id")
    expect(fila).toHaveProperty("accion")
    expect(fila).toHaveProperty("cursoTitulo")
    expect(fila).toHaveProperty("autorEmail")
  })

  it("ADMIN lista asignaciones filtrado -> 200 paginado", async () => {
    const res = await agenteAdmin
      .get(`/api/v1/admin/logs/asignaciones?asignacionId=${asignacionId}`)
      .expect(200)
    expect(res.body.meta.total).toBeGreaterThanOrEqual(3)
    expect(res.body.data[0]).toHaveProperty("estadoAnterior")
    expect(res.body.data[0]).toHaveProperty("estadoNuevo")
    expect(res.body.data[0]).toHaveProperty("autorEmail")
  })

  it("accion invalida -> 400", async () => {
    await agenteAdmin.get("/api/v1/admin/logs/cursos?accion=BOGUS").expect(400)
  })

  it("cursoId no UUID -> 400", async () => {
    await agenteAdmin.get("/api/v1/admin/logs/cursos?cursoId=not-a-uuid").expect(400)
  })

  it("pageSize > 200 -> 400", async () => {
    await agenteAdmin.get("/api/v1/admin/logs/cursos?pageSize=500").expect(400)
  })

  it("cada consulta inserta fila en consultas_logs (meta-auditoria)", async () => {
    const antes = await prisma.consultaLog.count({
      where: { autorUsuarioId: adminUsuarioId, endpoint: "/admin/logs/cursos" },
    })
    await agenteAdmin.get(`/api/v1/admin/logs/cursos?cursoId=${cursoId}`).expect(200)
    const despues = await prisma.consultaLog.count({
      where: { autorUsuarioId: adminUsuarioId, endpoint: "/admin/logs/cursos" },
    })
    expect(despues).toBeGreaterThan(antes)

    const antesAs = await prisma.consultaLog.count({
      where: { autorUsuarioId: adminUsuarioId, endpoint: "/admin/logs/asignaciones" },
    })
    await agenteAdmin
      .get(`/api/v1/admin/logs/asignaciones?asignacionId=${asignacionId}`)
      .expect(200)
    const despuesAs = await prisma.consultaLog.count({
      where: { autorUsuarioId: adminUsuarioId, endpoint: "/admin/logs/asignaciones" },
    })
    expect(despuesAs).toBeGreaterThan(antesAs)
  })
})
