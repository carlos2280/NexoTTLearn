// biome-ignore lint/correctness/noNodejsModules: idem (randomUUID para Idempotency-Key).
import { randomUUID } from "node:crypto"
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
  console.warn("notificaciones-triggers.e2e: DATABASE_URL ausente — tests SKIP.")
}
if (HAS_DB_URL && !DIST_DISPONIBLE) {
  console.warn(
    "notificaciones-triggers.e2e: dist/ no encontrado — ejecutar `pnpm --filter @nexott-learn/api build`. SKIP.",
  )
}

const RUN_E2E = HAS_DB_URL && DIST_DISPONIBLE

const ADMIN_EMAIL = "notif-trig-admin@nttdata.test"
const PART_EMAIL = "notif-trig-part@nttdata.test"
const PART_EX_EMAIL = "notif-trig-ex@nttdata.test"
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
  estadoEmpleado: "ACTIVO" | "EX_EMPLEADO" = "ACTIVO",
): Promise<{ usuarioId: string; colaboradorId: string }> {
  const col = await prisma.colaborador.upsert({
    where: { email },
    update: { nombre, estadoEmpleado },
    create: { email, nombre, estadoEmpleado },
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
    update: { nombre: "Notif Trig Admin", estadoEmpleado: "ACTIVO" },
    create: { email: ADMIN_EMAIL, nombre: "Notif Trig Admin", estadoEmpleado: "ACTIVO" },
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
    where: { nombre: "Cliente Notif Trig" },
    update: {},
    create: { nombre: "Cliente Notif Trig" },
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

describe.runIf(RUN_E2E)("notificaciones triggers e2e (P10c — RESULTADO_CIERRE end-to-end)", () => {
  let app: INestApplication
  let prisma: PrismaClient
  let agenteAdmin: Agent
  let csrfAdmin: string
  let usuarioPartId: string
  let colaboradorPartId: string
  let usuarioPartExId: string
  let colaboradorPartExId: string

  beforeAll(async () => {
    prisma = new PrismaClient()
    try {
      await prisma.$queryRaw`SELECT 1`
    } catch (error) {
      const detalle = error instanceof Error ? error.message : String(error)
      throw new Error(`No se pudo conectar a la BD para los e2e: ${detalle}`)
    }

    const passwordHash = await bcrypt.hash(PASSWORD, 12)
    await upsertAdmin(prisma, passwordHash)
    const part = await upsertParticipante(prisma, PART_EMAIL, passwordHash, "Notif Trig Part")
    usuarioPartId = part.usuarioId
    colaboradorPartId = part.colaboradorId
    const ex = await upsertParticipante(
      prisma,
      PART_EX_EMAIL,
      passwordHash,
      "Notif Trig Ex",
      "EX_EMPLEADO",
    )
    usuarioPartExId = ex.usuarioId
    colaboradorPartExId = ex.colaboradorId

    await prisma.$executeRaw`
        DELETE FROM sesiones
        WHERE (sess::jsonb->>'usuarioId') IN (
          SELECT id::text FROM usuarios WHERE colaborador_id IN
            (SELECT id FROM colaboradores WHERE email IN
              (${ADMIN_EMAIL}, ${PART_EMAIL}, ${PART_EX_EMAIL}))
        )
      `

    // Limpieza preventiva de leftovers de corridas previas (otros e2e pueden
    // dejar idempotency keys o asignaciones colgando que afectan estos tests).
    const usuariosLimpieza = [usuarioPartId, usuarioPartExId]
    await prisma.idempotencyKey.deleteMany({
      where: { usuarioId: { in: usuariosLimpieza } },
    })
    await prisma.asignacionCurso.deleteMany({
      where: { colaboradorId: { in: [colaboradorPartId, colaboradorPartExId] } },
    })
    await prisma.curso.deleteMany({ where: { cliente: { nombre: "Cliente Notif Trig" } } })
    await prisma.cliente.deleteMany({ where: { nombre: "Cliente Notif Trig" } })

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
      const usuarios = [usuarioPartId, usuarioPartExId]
      await prisma.notificacionCanal.deleteMany({
        where: { notificacion: { usuarioId: { in: usuarios } } },
      })
      await prisma.notificacion.deleteMany({ where: { usuarioId: { in: usuarios } } })
      await prisma.preferenciaNotificacion.deleteMany({ where: { usuarioId: { in: usuarios } } })
      await prisma.historicoEstadoAsignacion.deleteMany({
        where: { autorUsuarioId: { in: usuarios } },
      })
      await prisma.idempotencyKey.deleteMany({ where: { usuarioId: { in: usuarios } } })
      await prisma.asignacionCurso.deleteMany({
        where: { curso: { cliente: { nombre: "Cliente Notif Trig" } } },
      })
      await prisma.curso.deleteMany({ where: { cliente: { nombre: "Cliente Notif Trig" } } })
      await prisma.cliente.deleteMany({ where: { nombre: "Cliente Notif Trig" } })
      await prisma.$executeRaw`
          DELETE FROM sesiones
          WHERE (sess::jsonb->>'usuarioId') IN (
            SELECT id::text FROM usuarios WHERE colaborador_id IN
              (SELECT id FROM colaboradores WHERE email IN
                (${ADMIN_EMAIL}, ${PART_EMAIL}, ${PART_EX_EMAIL}))
          )
        `
    } finally {
      await app.close()
      await prisma.$disconnect()
    }
  }, 30_000)

  beforeEach(async () => {
    const usuarios = [usuarioPartId, usuarioPartExId]
    await prisma.notificacionCanal.deleteMany({
      where: { notificacion: { usuarioId: { in: usuarios } } },
    })
    await prisma.notificacion.deleteMany({ where: { usuarioId: { in: usuarios } } })
    await prisma.preferenciaNotificacion.deleteMany({ where: { usuarioId: { in: usuarios } } })
    await prisma.idempotencyKey.deleteMany({ where: { usuarioId: { in: usuarios } } })
    await prisma.asignacionCurso.deleteMany({
      where: { colaboradorId: { in: [colaboradorPartId, colaboradorPartExId] } },
    })
    await prisma.curso.deleteMany({ where: { cliente: { nombre: "Cliente Notif Trig" } } })
    await prisma.cliente.deleteMany({ where: { nombre: "Cliente Notif Trig" } })
  })

  it("E2E-B: cerrar-caso APTO crea notif RESULTADO_CIERRE in-app + canal CORREO + payload tipado", async () => {
    const cursoId = await crearCursoBase(prisma, "Curso E2E-B")
    const asignacion = await prisma.asignacionCurso.create({
      data: {
        cursoId,
        colaboradorId: colaboradorPartId,
        rol: "ASIGNADO",
        estadoAsignado: "EN_PROGRESO",
      },
      select: { id: true },
    })
    const idemKey = randomUUID()

    const res = await agenteAdmin
      .post(`/api/v1/asignaciones/${asignacion.id}/cerrar-caso`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .set("Idempotency-Key", idemKey)
      .send({ resultado: "APTO" })
    expect(res.status).toBe(200)

    const notif = await prisma.notificacion.findFirst({
      where: { usuarioId: usuarioPartId, tipoEvento: "RESULTADO_CIERRE" },
      select: {
        esCritico: true,
        payload: true,
        errorCorreo: true,
        canales: { select: { canal: true } },
      },
    })
    expect(notif).not.toBeNull()
    expect(notif?.esCritico).toBe(true)
    expect(notif?.payload).toMatchObject({
      resultado: "APTO",
      cursoTitulo: "Curso E2E-B",
      asignacionId: asignacion.id,
    })
    // MockEmailProvider responde enviado:true por default → canal CORREO presente.
    const canales = (notif?.canales ?? []).map((c) => c.canal).sort()
    expect(canales).toEqual(["CORREO", "IN_APP"])
    expect(notif?.errorCorreo).toBeNull()
  })

  it("E2E-B2: replay de cerrar-caso (misma idempotency-key) NO duplica la notif", async () => {
    const cursoId = await crearCursoBase(prisma, "Curso E2E-B2")
    const asignacion = await prisma.asignacionCurso.create({
      data: {
        cursoId,
        colaboradorId: colaboradorPartId,
        rol: "ASIGNADO",
        estadoAsignado: "EN_PROGRESO",
      },
      select: { id: true },
    })
    const idemKey = randomUUID()

    await agenteAdmin
      .post(`/api/v1/asignaciones/${asignacion.id}/cerrar-caso`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .set("Idempotency-Key", idemKey)
      .send({ resultado: "APTO" })
      .expect(200)
    await agenteAdmin
      .post(`/api/v1/asignaciones/${asignacion.id}/cerrar-caso`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .set("Idempotency-Key", idemKey)
      .send({ resultado: "APTO" })
      .expect(200)

    const total = await prisma.notificacion.count({
      where: { usuarioId: usuarioPartId, tipoEvento: "RESULTADO_CIERRE" },
    })
    expect(total).toBe(1)
  })

  it("E2E-C: cerrar-caso a participante EX_EMPLEADO no crea notif (count=0)", async () => {
    const cursoId = await crearCursoBase(prisma, "Curso E2E-C")
    const asignacion = await prisma.asignacionCurso.create({
      data: {
        cursoId,
        colaboradorId: colaboradorPartExId,
        rol: "ASIGNADO",
        estadoAsignado: "EN_PROGRESO",
      },
      select: { id: true },
    })
    const idemKey = randomUUID()

    await agenteAdmin
      .post(`/api/v1/asignaciones/${asignacion.id}/cerrar-caso`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .set("Idempotency-Key", idemKey)
      .send({ resultado: "APTO" })
      .expect(200)

    const total = await prisma.notificacion.count({ where: { usuarioId: usuarioPartExId } })
    expect(total).toBe(0)
  })

  it("E2E-D: silenciar RESULTADO_CIERRE (critico) en BD NO impide envio (§19.3 punto 1)", async () => {
    const cursoId = await crearCursoBase(prisma, "Curso E2E-D")
    // Insercion directa: la API rechaza con 422, pero un row legacy en BD no
    // debe poder bypassear el envio de un tipo critico.
    await prisma.preferenciaNotificacion.create({
      data: { usuarioId: usuarioPartId, tipoEvento: "RESULTADO_CIERRE", silenciado: true },
    })
    const asignacion = await prisma.asignacionCurso.create({
      data: {
        cursoId,
        colaboradorId: colaboradorPartId,
        rol: "ASIGNADO",
        estadoAsignado: "EN_PROGRESO",
      },
      select: { id: true },
    })
    const idemKey = randomUUID()

    await agenteAdmin
      .post(`/api/v1/asignaciones/${asignacion.id}/cerrar-caso`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .set("Idempotency-Key", idemKey)
      .send({ resultado: "NO_APTO" })
      .expect(200)

    const total = await prisma.notificacion.count({
      where: { usuarioId: usuarioPartId, tipoEvento: "RESULTADO_CIERRE" },
    })
    expect(total).toBe(1)
  })

  it("E2E-F: VOLUNTARIO -> notif RESULTADO_CIERRE con resultado=COMPLETADO", async () => {
    const cursoId = await crearCursoBase(prisma, "Curso E2E-F")
    const asignacion = await prisma.asignacionCurso.create({
      data: {
        cursoId,
        colaboradorId: colaboradorPartId,
        rol: "VOLUNTARIO",
        estadoVoluntario: "EN_PROGRESO",
        origenVoluntario: "INICIATIVA",
        // chk_asig_resultado_solo_asignado: VOLUNTARIO obliga NULL.
        resultadoEntrevistaCliente: null,
      },
      select: { id: true },
    })
    const idemKey = randomUUID()

    await agenteAdmin
      .post(`/api/v1/asignaciones/${asignacion.id}/cerrar-caso`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .set("Idempotency-Key", idemKey)
      .send({})
      .expect(200)

    const notif = await prisma.notificacion.findFirstOrThrow({
      where: { usuarioId: usuarioPartId, tipoEvento: "RESULTADO_CIERRE" },
      select: { payload: true },
    })
    expect(notif.payload).toMatchObject({ resultado: "COMPLETADO" })
  })
})
