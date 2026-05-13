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

const ADMIN_EMAIL = "notif-listo-admin@nttdata.test"
const ADMIN2_EMAIL = "notif-listo-admin2@nttdata.test"
const PART_EMAIL = "notif-listo-part@nttdata.test"
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

async function upsertAdmin(
  prisma: PrismaClient,
  email: string,
  nombre: string,
  passwordHash: string,
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
    where: { nombre: "Cliente Notif Listo" },
    update: {},
    create: { nombre: "Cliente Notif Listo" },
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
      toggleVoluntarios: false,
    },
    select: { id: true },
  })
  return curso.id
}

describe.runIf(RUN_E2E)("notificaciones COLABORADOR_LISTO e2e (P11.5b — D-S11.5-B1)", () => {
  let app: INestApplication
  let prisma: PrismaClient
  let agenteAdmin: Agent
  let csrfAdmin: string
  let adminId: string
  let admin2Id: string
  let colaboradorPartId: string

  beforeAll(async () => {
    prisma = new PrismaClient()
    const passwordHash = await bcrypt.hash(PASSWORD, 12)
    adminId = await upsertAdmin(prisma, ADMIN_EMAIL, "Notif Listo Admin", passwordHash)
    admin2Id = await upsertAdmin(prisma, ADMIN2_EMAIL, "Notif Listo Admin 2", passwordHash)
    const p = await upsertParticipante(prisma, PART_EMAIL, passwordHash, "Notif Listo Part")
    colaboradorPartId = p.colaboradorId

    await prisma.$executeRaw`
      DELETE FROM sesiones
      WHERE (sess::jsonb->>'usuarioId') IN (
        SELECT id::text FROM usuarios WHERE colaborador_id IN
          (SELECT id FROM colaboradores WHERE email IN
            (${ADMIN_EMAIL}, ${ADMIN2_EMAIL}, ${PART_EMAIL}))
      )
    `
    await prisma.asignacionCurso.deleteMany({ where: { colaboradorId: colaboradorPartId } })
    await prisma.curso.deleteMany({ where: { cliente: { nombre: "Cliente Notif Listo" } } })
    await prisma.cliente.deleteMany({ where: { nombre: "Cliente Notif Listo" } })

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
  }, 60_000)

  afterAll(async () => {
    try {
      await prisma.notificacionCanal.deleteMany({
        where: { notificacion: { usuarioId: { in: [adminId, admin2Id] } } },
      })
      await prisma.notificacion.deleteMany({
        where: { usuarioId: { in: [adminId, admin2Id] } },
      })
      await prisma.asignacionCurso.deleteMany({ where: { colaboradorId: colaboradorPartId } })
      await prisma.curso.deleteMany({ where: { cliente: { nombre: "Cliente Notif Listo" } } })
      await prisma.cliente.deleteMany({ where: { nombre: "Cliente Notif Listo" } })
    } finally {
      await app.close()
      await prisma.$disconnect()
    }
  }, 30_000)

  beforeEach(async () => {
    await prisma.notificacionCanal.deleteMany({
      where: { notificacion: { usuarioId: { in: [adminId, admin2Id] } } },
    })
    await prisma.notificacion.deleteMany({
      where: { usuarioId: { in: [adminId, admin2Id] } },
    })
    await prisma.asignacionCurso.deleteMany({ where: { colaboradorId: colaboradorPartId } })
    await prisma.curso.deleteMany({ where: { cliente: { nombre: "Cliente Notif Listo" } } })
  })

  it("marcar-listo emite COLABORADOR_LISTO broadcast a admins activos", async () => {
    const cursoId = await crearCursoBase(prisma, "Curso COL_LISTO")
    const asignacion = await prisma.asignacionCurso.create({
      data: {
        cursoId,
        colaboradorId: colaboradorPartId,
        rol: "ASIGNADO",
        estadoAsignado: "EN_PROGRESO",
      },
      select: { id: true },
    })
    // Plan vacio sin items obligatorios — `evaluarCondicionesListo` lo considera
    // completo vacuamente y permite la transicion a LISTO (curso sin
    // transversal ni IA).
    await prisma.planEstudio.create({
      data: { asignacionId: asignacion.id, estaDesactualizado: false },
    })

    const res = await agenteAdmin
      .post(`/api/v1/asignaciones/${asignacion.id}/marcar-listo`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .send({})
    expect(res.status).toBe(200)

    const notifs = await prisma.notificacion.findMany({
      where: {
        usuarioId: { in: [adminId, admin2Id] },
        tipoEvento: "COLABORADOR_LISTO",
      },
      select: { usuarioId: true, esCritico: true, payload: true },
    })
    const usuariosIds = notifs.map((n) => n.usuarioId).sort()
    expect(usuariosIds).toEqual([adminId, admin2Id].sort())
    expect(notifs[0]?.esCritico).toBe(false)
    expect(notifs[0]?.payload).toMatchObject({
      asignacionId: asignacion.id,
      cursoId,
      cursoTitulo: "Curso COL_LISTO",
      colaboradorId: colaboradorPartId,
      colaboradorNombre: "Notif Listo Part",
    })
  })

  it("admin EX_EMPLEADO no recibe la notificacion broadcast", async () => {
    await prisma.colaborador.update({
      where: { email: ADMIN2_EMAIL },
      data: { estadoEmpleado: "EX_EMPLEADO" },
    })
    try {
      const cursoId = await crearCursoBase(prisma, "Curso COL_LISTO_EX")
      const asignacion = await prisma.asignacionCurso.create({
        data: {
          cursoId,
          colaboradorId: colaboradorPartId,
          rol: "ASIGNADO",
          estadoAsignado: "EN_PROGRESO",
        },
        select: { id: true },
      })
      await prisma.planEstudio.create({
        data: { asignacionId: asignacion.id, estaDesactualizado: false },
      })
      await agenteAdmin
        .post(`/api/v1/asignaciones/${asignacion.id}/marcar-listo`)
        .set("X-XSRF-TOKEN", csrfAdmin)
        .send({})
        .expect(200)

      const recibidasAdmin2 = await prisma.notificacion.count({
        where: { usuarioId: admin2Id, tipoEvento: "COLABORADOR_LISTO" },
      })
      expect(recibidasAdmin2).toBe(0)
      const recibidasAdmin1 = await prisma.notificacion.count({
        where: { usuarioId: adminId, tipoEvento: "COLABORADOR_LISTO" },
      })
      expect(recibidasAdmin1).toBe(1)
    } finally {
      await prisma.colaborador.update({
        where: { email: ADMIN2_EMAIL },
        data: { estadoEmpleado: "ACTIVO" },
      })
    }
  })
})
