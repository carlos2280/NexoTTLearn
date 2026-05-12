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
  console.warn("notificaciones.e2e.spec: DATABASE_URL ausente — tests SKIP.")
}
if (HAS_DB_URL && !DIST_DISPONIBLE) {
  console.warn(
    "notificaciones.e2e.spec: dist/ no encontrado — ejecutar `pnpm --filter @nexott-learn/api build`. SKIP.",
  )
}

const RUN_E2E = HAS_DB_URL && DIST_DISPONIBLE

const ADMIN_EMAIL = "notif-admin-p10b@nttdata.test"
const PART_A_EMAIL = "notif-parta-p10b@nttdata.test"
const PART_B_EMAIL = "notif-partb-p10b@nttdata.test"
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

describe.runIf(RUN_E2E)("notificaciones e2e (P10b — inbox + preferencias)", () => {
  let app: INestApplication
  let prisma: PrismaClient
  let agenteAdmin: Agent
  let agentePartA: Agent
  let agentePartB: Agent
  let csrfAdmin: string
  let csrfPartA: string
  let csrfPartB: string
  let usuarioPartAId: string
  let usuarioPartBId: string

  beforeAll(async () => {
    prisma = new PrismaClient()
    try {
      await prisma.$queryRaw`SELECT 1`
    } catch (error) {
      const detalle = error instanceof Error ? error.message : String(error)
      throw new Error(`No se pudo conectar a la BD para los e2e: ${detalle}`)
    }

    const passwordHash = await bcrypt.hash(PASSWORD, 12)
    await upsertUsuario(prisma, ADMIN_EMAIL, "ADMIN", passwordHash, "Notif Admin")
    usuarioPartAId = await upsertUsuario(
      prisma,
      PART_A_EMAIL,
      "PARTICIPANTE",
      passwordHash,
      "Notif Part A",
    )
    usuarioPartBId = await upsertUsuario(
      prisma,
      PART_B_EMAIL,
      "PARTICIPANTE",
      passwordHash,
      "Notif Part B",
    )

    // Limpiar sesiones residuales antes de levantar la app.
    await prisma.$executeRaw`
      DELETE FROM sesiones
      WHERE (sess::jsonb->>'usuarioId') IN (
        SELECT id::text FROM usuarios WHERE colaborador_id IN
          (SELECT id FROM colaboradores WHERE email IN
            (${ADMIN_EMAIL}, ${PART_A_EMAIL}, ${PART_B_EMAIL}))
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
    agentePartA = supertest.agent(app.getHttpServer())
    agentePartB = supertest.agent(app.getHttpServer())
    csrfAdmin = await loginYObtenerCsrf(agenteAdmin, ADMIN_EMAIL)
    csrfPartA = await loginYObtenerCsrf(agentePartA, PART_A_EMAIL)
    csrfPartB = await loginYObtenerCsrf(agentePartB, PART_B_EMAIL)
  }, 60_000)

  afterAll(async () => {
    try {
      await prisma.notificacionCanal.deleteMany({
        where: { notificacion: { usuarioId: { in: [usuarioPartAId, usuarioPartBId] } } },
      })
      await prisma.notificacion.deleteMany({
        where: { usuarioId: { in: [usuarioPartAId, usuarioPartBId] } },
      })
      await prisma.preferenciaNotificacion.deleteMany({
        where: { usuarioId: { in: [usuarioPartAId, usuarioPartBId] } },
      })
      await prisma.activityLog.deleteMany({
        where: { usuarioId: { in: [usuarioPartAId, usuarioPartBId] } },
      })
      await prisma.$executeRaw`
        DELETE FROM sesiones
        WHERE (sess::jsonb->>'usuarioId') IN (
          SELECT id::text FROM usuarios WHERE colaborador_id IN
            (SELECT id FROM colaboradores WHERE email IN
              (${ADMIN_EMAIL}, ${PART_A_EMAIL}, ${PART_B_EMAIL}))
        )
      `
    } finally {
      await app.close()
      await prisma.$disconnect()
    }
  }, 30_000)

  beforeEach(async () => {
    // Limpieza entre escenarios — todas las notif del usuario A y B + preferencias + audit.
    await prisma.notificacionCanal.deleteMany({
      where: { notificacion: { usuarioId: { in: [usuarioPartAId, usuarioPartBId] } } },
    })
    await prisma.notificacion.deleteMany({
      where: { usuarioId: { in: [usuarioPartAId, usuarioPartBId] } },
    })
    await prisma.preferenciaNotificacion.deleteMany({
      where: { usuarioId: { in: [usuarioPartAId, usuarioPartBId] } },
    })
    await prisma.activityLog.deleteMany({
      where: {
        usuarioId: { in: [usuarioPartAId, usuarioPartBId] },
        accion: "PREFERENCIA_NOTIFICACION_ACTUALIZADA",
      },
    })
  })

  async function sembrarNotif(input: {
    usuarioId: string
    tipo: "PLAN_RECALCULADO" | "RESULTADO_CIERRE"
    leida?: boolean
    archivada?: boolean
    canales?: Array<"IN_APP" | "CORREO">
  }): Promise<string> {
    const notif = await prisma.notificacion.create({
      data: {
        usuarioId: input.usuarioId,
        tipoEvento: input.tipo,
        esCritico: input.tipo === "RESULTADO_CIERRE",
        payload:
          input.tipo === "PLAN_RECALCULADO"
            ? { planId: "p1", asignacionId: "a1", cursoTitulo: "Curso e2e" }
            : { asignacionId: "a1", cursoTitulo: "Curso e2e", resultado: "APTO" },
        leida: input.leida ?? false,
        fechaLeida: input.leida ? new Date() : null,
        archivada: input.archivada ?? false,
      },
      select: { id: true },
    })
    for (const c of input.canales ?? ["IN_APP"]) {
      await prisma.notificacionCanal.create({
        data: { notificacionId: notif.id, canal: c },
      })
    }
    return notif.id
  }

  it("Escenario A — flujo completo del participante (badge, listar, marcar, archivar)", async () => {
    const idPlan = await sembrarNotif({
      usuarioId: usuarioPartAId,
      tipo: "PLAN_RECALCULADO",
      leida: true,
    })
    const idCierre = await sembrarNotif({
      usuarioId: usuarioPartAId,
      tipo: "RESULTADO_CIERRE",
      leida: false,
    })
    const idArchivada = await sembrarNotif({
      usuarioId: usuarioPartAId,
      tipo: "PLAN_RECALCULADO",
      leida: true,
      archivada: true,
    })

    const badge1 = await agentePartA.get("/api/v1/notificaciones/badge").expect(200)
    expect(badge1.body).toEqual({ noLeidas: 1 })

    const listar1 = await agentePartA.get("/api/v1/notificaciones").expect(200)
    expect(listar1.body.data.map((n: { id: string }) => n.id)).toEqual(
      expect.arrayContaining([idPlan, idCierre]),
    )
    expect(listar1.body.data).toHaveLength(2)

    const listarArchivadas = await agentePartA
      .get("/api/v1/notificaciones?archivada=true")
      .expect(200)
    expect(listarArchivadas.body.data.map((n: { id: string }) => n.id)).toEqual([idArchivada])

    const detalle = await agentePartA.get(`/api/v1/notificaciones/${idCierre}`).expect(200)
    expect(detalle.body.payload).toMatchObject({ resultado: "APTO" })
    expect(detalle.body.canalesEnviados).toEqual(["IN_APP"])

    await agentePartA
      .post(`/api/v1/notificaciones/${idCierre}/marcar-leida`)
      .set("X-XSRF-TOKEN", csrfPartA)
      .expect(204)

    const badge2 = await agentePartA.get("/api/v1/notificaciones/badge").expect(200)
    expect(badge2.body).toEqual({ noLeidas: 0 })

    await agentePartA
      .post(`/api/v1/notificaciones/${idCierre}/archivar`)
      .set("X-XSRF-TOKEN", csrfPartA)
      .expect(204)

    const listar2 = await agentePartA.get("/api/v1/notificaciones").expect(200)
    expect(listar2.body.data.map((n: { id: string }) => n.id)).toEqual([idPlan])
  })

  it("Escenario B — visibilidad cross-user devuelve 404 sin revelar existencia", async () => {
    const idA = await sembrarNotif({
      usuarioId: usuarioPartAId,
      tipo: "PLAN_RECALCULADO",
    })

    const detalleB = await agentePartB.get(`/api/v1/notificaciones/${idA}`).expect(404)
    expect(detalleB.body).toMatchObject({ code: "NOTIFICACION_NO_ENCONTRADA" })

    const marcarB = await agentePartB
      .post(`/api/v1/notificaciones/${idA}/marcar-leida`)
      .set("X-XSRF-TOKEN", csrfPartB)
      .expect(404)
    expect(marcarB.body).toMatchObject({ code: "NOTIFICACION_NO_ENCONTRADA" })
  })

  it("Escenario C — POST /marcar-todas-leidas pone leida=true en todas las del usuario", async () => {
    for (let i = 0; i < 3; i++) {
      await sembrarNotif({ usuarioId: usuarioPartAId, tipo: "PLAN_RECALCULADO" })
    }
    await sembrarNotif({ usuarioId: usuarioPartAId, tipo: "RESULTADO_CIERRE", leida: true })

    await agentePartA
      .post("/api/v1/notificaciones/marcar-todas-leidas")
      .set("X-XSRF-TOKEN", csrfPartA)
      .expect(204)

    const badge = await agentePartA.get("/api/v1/notificaciones/badge").expect(200)
    expect(badge.body).toEqual({ noLeidas: 0 })
  })

  it("Escenario D — GET /preferencias inicial sin filas devuelve silenciados=[] + tiposCriticos", async () => {
    const res = await agentePartA.get("/api/v1/notificaciones/preferencias").expect(200)

    expect(res.body.silenciados).toEqual([])
    expect(res.body.tiposCriticos).toEqual(
      expect.arrayContaining([
        "ASIGNACION_CURSO",
        "CASO_REABIERTO",
        "RESULTADO_CIERRE",
        "EXCEL_CARGADO",
        "MODULO_HUERFANO_SKILL",
      ]),
    )
  })

  it("Escenario E — PATCH preferencias silenciar/desilenciar OK + audit registrado", async () => {
    const silenciar = await agentePartA
      .patch("/api/v1/notificaciones/preferencias")
      .set("X-XSRF-TOKEN", csrfPartA)
      .send({ silenciar: ["PLAN_RECALCULADO"], desilenciar: [] })
      .expect(200)
    expect(silenciar.body.silenciados).toEqual(["PLAN_RECALCULADO"])

    const desilenciar = await agentePartA
      .patch("/api/v1/notificaciones/preferencias")
      .set("X-XSRF-TOKEN", csrfPartA)
      .send({ silenciar: [], desilenciar: ["PLAN_RECALCULADO"] })
      .expect(200)
    expect(desilenciar.body.silenciados).toEqual([])

    const audits = await prisma.activityLog.findMany({
      where: {
        usuarioId: usuarioPartAId,
        accion: "PREFERENCIA_NOTIFICACION_ACTUALIZADA",
      },
      select: { metadata: true },
      orderBy: { createdAt: "asc" },
    })
    expect(audits).toHaveLength(2)
    expect(audits[0]?.metadata).toMatchObject({
      silenciadas: ["PLAN_RECALCULADO"],
      desilenciadas: [],
    })
    expect(audits[1]?.metadata).toMatchObject({
      silenciadas: [],
      desilenciadas: ["PLAN_RECALCULADO"],
    })
  })

  it("Escenario F — PATCH preferencias 422 cuando se intenta silenciar un tipo critico", async () => {
    const res = await agentePartA
      .patch("/api/v1/notificaciones/preferencias")
      .set("X-XSRF-TOKEN", csrfPartA)
      .send({ silenciar: ["RESULTADO_CIERRE"], desilenciar: [] })
      .expect(422)
    expect(res.body).toMatchObject({
      code: "VALIDACION_TIPO_CRITICO_NO_SILENCIABLE",
      details: { tiposCriticos: ["RESULTADO_CIERRE"] },
    })
  })

  it("Escenario G — PATCH preferencias 422 cuando un tipo aparece en silenciar y desilenciar", async () => {
    const res = await agentePartA
      .patch("/api/v1/notificaciones/preferencias")
      .set("X-XSRF-TOKEN", csrfPartA)
      .send({ silenciar: ["PLAN_RECALCULADO"], desilenciar: ["PLAN_RECALCULADO"] })
      .expect(422)
    expect(res.body).toMatchObject({
      code: "VALIDACION_TIPO_EN_SILENCIAR_Y_DESILENCIAR",
      details: { tipos: ["PLAN_RECALCULADO"] },
    })
  })

  it("Admin tambien puede consumir los endpoints (es endpoint generico, D-S10-C3)", async () => {
    await agenteAdmin.get("/api/v1/notificaciones/badge").expect(200)
    void csrfAdmin
  })
})
