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

const RUN_E2E = HAS_DB_URL && DIST_DISPONIBLE

const ADMIN_EMAIL = "notif-asig-admin@nttdata.test"
const PART_EMAIL = "notif-asig-part@nttdata.test"
const PART2_EMAIL = "notif-asig-part2@nttdata.test"
const PASSWORD = "Notif1234!"

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
  prisma: PrismaClient,
  email: string,
  passwordHash: string,
  nombre: string,
): Promise<{ usuarioId: string; colaboradorId: string }> {
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
      rol: "PARTICIPANTE",
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
  return { usuarioId: user.id, colaboradorId: col.id }
}

async function upsertAdmin(prisma: PrismaClient, passwordHash: string): Promise<string> {
  const col = await prisma.colaborador.upsert({
    where: { email: ADMIN_EMAIL },
    update: { nombre: "Notif Asig Admin", estadoEmpleado: "ACTIVO" },
    create: { email: ADMIN_EMAIL, nombre: "Notif Asig Admin", estadoEmpleado: "ACTIVO" },
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
    select: { id: true },
  })
  return user.id
}

async function crearCursoBase(prisma: PrismaClient, titulo: string): Promise<string> {
  const cliente = await prisma.cliente.upsert({
    where: { nombre: "Cliente Notif Asig" },
    update: {},
    create: { nombre: "Cliente Notif Asig" },
    select: { id: true },
  })
  const curso = await prisma.curso.create({
    data: {
      titulo,
      clienteId: cliente.id,
      estado: "ACTIVO",
      fechaInicio: new Date("2026-01-01"),
      fechaDeadline: new Date("2026-12-31"),
      umbralNoCumple: 10,
      toggleVoluntarios: true,
    },
    select: { id: true },
  })
  return curso.id
}

describe.runIf(RUN_E2E)("notificaciones ASIGNACION_CURSO e2e (P11.5a — D-S11.5-A1)", () => {
  let app: INestApplication
  let prisma: PrismaClient
  let agenteAdmin: Agent
  let csrfAdmin: string
  let agentePart: Agent
  let csrfPart: string
  let usuarioPartId: string
  let colaboradorPartId: string
  let colaboradorPart2Id: string

  beforeAll(async () => {
    prisma = new PrismaClient()
    const passwordHash = await bcrypt.hash(PASSWORD, 12)
    await upsertAdmin(prisma, passwordHash)
    const p1 = await upsertParticipante(prisma, PART_EMAIL, passwordHash, "Notif Asig Part")
    usuarioPartId = p1.usuarioId
    colaboradorPartId = p1.colaboradorId
    const p2 = await upsertParticipante(prisma, PART2_EMAIL, passwordHash, "Notif Asig Part2")
    colaboradorPart2Id = p2.colaboradorId

    await prisma.$executeRaw`
        DELETE FROM sesiones
        WHERE (sess::jsonb->>'usuarioId') IN (
          SELECT id::text FROM usuarios WHERE colaborador_id IN
            (SELECT id FROM colaboradores WHERE email IN
              (${ADMIN_EMAIL}, ${PART_EMAIL}, ${PART2_EMAIL}))
        )
      `

    await prisma.idempotencyKey.deleteMany({
      where: { usuarioId: { in: [usuarioPartId, p2.usuarioId] } },
    })
    await prisma.asignacionCurso.deleteMany({
      where: { colaboradorId: { in: [colaboradorPartId, colaboradorPart2Id] } },
    })
    await prisma.curso.deleteMany({ where: { cliente: { nombre: "Cliente Notif Asig" } } })
    await prisma.cliente.deleteMany({ where: { nombre: "Cliente Notif Asig" } })

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
    csrfAdmin = await loginYObtenerCsrf(agenteAdmin, ADMIN_EMAIL)
    agentePart = supertest.agent(app.getHttpServer())
    csrfPart = await loginYObtenerCsrf(agentePart, PART_EMAIL)
  }, 60_000)

  afterAll(async () => {
    try {
      const usuarios = [usuarioPartId]
      await prisma.notificacionCanal.deleteMany({
        where: { notificacion: { usuarioId: { in: usuarios } } },
      })
      await prisma.notificacion.deleteMany({ where: { usuarioId: { in: usuarios } } })
      await prisma.preferenciaNotificacion.deleteMany({
        where: { usuarioId: { in: usuarios } },
      })
      await prisma.idempotencyKey.deleteMany({ where: { usuarioId: { in: usuarios } } })
      await prisma.asignacionCurso.deleteMany({
        where: { curso: { cliente: { nombre: "Cliente Notif Asig" } } },
      })
      await prisma.curso.deleteMany({ where: { cliente: { nombre: "Cliente Notif Asig" } } })
      await prisma.cliente.deleteMany({ where: { nombre: "Cliente Notif Asig" } })
    } finally {
      await app.close()
      await prisma.$disconnect()
    }
  }, 30_000)

  beforeEach(async () => {
    await prisma.notificacionCanal.deleteMany({
      where: { notificacion: { usuarioId: usuarioPartId } },
    })
    await prisma.notificacion.deleteMany({ where: { usuarioId: usuarioPartId } })
    await prisma.preferenciaNotificacion.deleteMany({ where: { usuarioId: usuarioPartId } })
    await prisma.asignacionCurso.deleteMany({
      where: { colaboradorId: { in: [colaboradorPartId, colaboradorPart2Id] } },
    })
    await prisma.curso.deleteMany({ where: { cliente: { nombre: "Cliente Notif Asig" } } })
  })

  it("admin crearBatch -> emite ASIGNACION_CURSO con payload tipado y critico=true", async () => {
    const cursoId = await crearCursoBase(prisma, "Curso ASIG_BATCH")

    const res = await agenteAdmin
      .post(`/api/v1/cursos/${cursoId}/asignaciones`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .send({ colaboradorIds: [colaboradorPartId] })
    expect(res.status).toBe(201)

    const notif = await prisma.notificacion.findFirst({
      where: { usuarioId: usuarioPartId, tipoEvento: "ASIGNACION_CURSO" },
      select: {
        esCritico: true,
        payload: true,
        canales: { select: { canal: true } },
      },
    })
    expect(notif).not.toBeNull()
    expect(notif?.esCritico).toBe(true)
    expect(notif?.payload).toMatchObject({
      cursoId,
      cursoTitulo: "Curso ASIG_BATCH",
    })
    const canales = (notif?.canales ?? []).map((c) => c.canal).sort()
    expect(canales).toContain("IN_APP")
  })

  it("autoinscripcion VOLUNTARIO -> emite ASIGNACION_CURSO al propio participante", async () => {
    const cursoId = await crearCursoBase(prisma, "Curso ASIG_AUTO")

    const res = await agentePart
      .post(`/api/v1/cursos/${cursoId}/auto-inscripcion`)
      .set("X-XSRF-TOKEN", csrfPart)
      .send({ origenVoluntario: "INICIATIVA" })
    expect(res.status).toBe(201)

    const notif = await prisma.notificacion.findFirst({
      where: { usuarioId: usuarioPartId, tipoEvento: "ASIGNACION_CURSO" },
      select: { payload: true, esCritico: true },
    })
    expect(notif).not.toBeNull()
    expect(notif?.esCritico).toBe(true)
    expect(notif?.payload).toMatchObject({
      cursoId,
      cursoTitulo: "Curso ASIG_AUTO",
    })
  })

  it("crearBatch con colaborador ya inscrito (YA_INSCRITO) NO duplica notif", async () => {
    const cursoId = await crearCursoBase(prisma, "Curso ASIG_DUP")
    // Primera asignacion para producir el rebote en el segundo POST.
    await agenteAdmin
      .post(`/api/v1/cursos/${cursoId}/asignaciones`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .send({ colaboradorIds: [colaboradorPartId] })
      .expect(201)

    // Segunda invocacion: deberia rechazarse como YA_INSCRITO. La notif
    // del primer alta sigue siendo 1; el rebote NO emite una segunda.
    await agenteAdmin
      .post(`/api/v1/cursos/${cursoId}/asignaciones`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .send({ colaboradorIds: [colaboradorPartId] })
      .expect(201)

    const total = await prisma.notificacion.count({
      where: { usuarioId: usuarioPartId, tipoEvento: "ASIGNACION_CURSO" },
    })
    expect(total).toBe(1)
  })
})
