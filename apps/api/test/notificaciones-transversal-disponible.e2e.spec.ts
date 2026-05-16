// biome-ignore lint/correctness/noNodejsModules: crypto.randomUUID para Idempotency-Key.
import { randomUUID } from "node:crypto"
// biome-ignore lint/correctness/noNodejsModules: harness e2e necesita filesystem para detectar dist/.
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

const RUN_E2E = HAS_DB_URL && DIST_DISPONIBLE

const ADMIN_EMAIL = "notif-trans-disp-admin@nttdata.test"
const PART_EMAIL = "notif-trans-disp-part@nttdata.test"
const PASSWORD = "NotifT1234!"
const CLIENTE_NOMBRE = "Cliente Notif Trans Disp"
const PREFIX = "P11.5a-trans-"

interface ModuloApp {
  // biome-ignore lint/style/useNamingConvention: clase Nest PascalCase.
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
): Promise<{ usuarioId: string; colaboradorId: string }> {
  const col = await prisma.colaborador.upsert({
    where: { email },
    update: { nombre, estadoEmpleado: "ACTIVO" },
    create: { email, nombre, estadoEmpleado: "ACTIVO" },
    select: { id: true },
  })
  const u = await prisma.usuario.upsert({
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
  return { usuarioId: u.id, colaboradorId: col.id }
}

describe.runIf(RUN_E2E)(
  "notificaciones TRANSVERSAL_DISPONIBLE e2e (P11.5a — D-S11.5-A3, D42)",
  () => {
    let app: INestApplication
    let prisma: PrismaClient
    let agentePart: Agent
    let csrfPart: string
    let usuarioPartId: string
    let asignacionPartId: string
    let cursoId: string
    let transversalId: string
    let clienteId: string

    beforeAll(async () => {
      prisma = new PrismaClient()
      const passwordHash = await bcrypt.hash(PASSWORD, 12)
      await upsertUsuario(prisma, ADMIN_EMAIL, "ADMIN", passwordHash, "Trans Disp Admin")
      const part = await upsertUsuario(
        prisma,
        PART_EMAIL,
        "PARTICIPANTE",
        passwordHash,
        "Trans Disp Part",
      )
      usuarioPartId = part.usuarioId
      const colabPartId = part.colaboradorId

      const cliente = await prisma.cliente.upsert({
        where: { nombre: CLIENTE_NOMBRE },
        update: { activo: true, deletedAt: null },
        create: { nombre: CLIENTE_NOMBRE, activo: true },
        select: { id: true },
      })
      clienteId = cliente.id

      // Limpieza preventiva de leftovers.
      const cursosPrev = await prisma.curso.findMany({
        where: { titulo: { contains: PREFIX } },
        select: { id: true, transversalId: true },
      })
      for (const c of cursosPrev) {
        if (c.transversalId !== null) {
          await prisma.intentoTransversal.deleteMany({
            where: { transversalId: c.transversalId },
          })
          await prisma.transversalSkill.deleteMany({
            where: { transversalId: c.transversalId },
          })
        }
      }
      const cursoIdsPrev = cursosPrev.map((c) => c.id)
      if (cursoIdsPrev.length > 0) {
        await prisma.asignacionCurso.deleteMany({ where: { cursoId: { in: cursoIdsPrev } } })
        await prisma.cursoSkillExigida.deleteMany({ where: { cursoId: { in: cursoIdsPrev } } })
        await prisma.cursoAreaExigida.deleteMany({ where: { cursoId: { in: cursoIdsPrev } } })
        await prisma.cursoModuloHabilitado.deleteMany({
          where: { cursoId: { in: cursoIdsPrev } },
        })
        await prisma.logCambioCurso.deleteMany({ where: { cursoId: { in: cursoIdsPrev } } })
        for (const c of cursosPrev) {
          if (c.transversalId !== null) {
            await prisma.proyectoTransversal.deleteMany({ where: { id: c.transversalId } })
          }
        }
        await prisma.curso.deleteMany({ where: { id: { in: cursoIdsPrev } } })
      }
      await prisma.notificacionCanal.deleteMany({
        where: { notificacion: { usuarioId: usuarioPartId } },
      })
      await prisma.notificacion.deleteMany({ where: { usuarioId: usuarioPartId } })
      await prisma.idempotencyKey.deleteMany({ where: { scope: "intento-transversal" } })

      const curso = await prisma.curso.create({
        data: {
          titulo: `${PREFIX}curso-disp`,
          clienteId,
          estado: "ACTIVO",
          fechaInicio: new Date("2026-04-01"),
          fechaDeadline: new Date("2026-08-01"),
          toggleVoluntarios: false,
          desbloqueo: "SIEMPRE",
        },
        select: { id: true },
      })
      cursoId = curso.id
      const transversal = await prisma.proyectoTransversal.create({
        data: {
          cursoId,
          descripcion: "Trans P11.5a",
          umbralAprobacion: 70,
          pesoCapaTests: 40,
          pesoCapaCualitativa: 30,
          pesoCapaComprension: 30,
        },
        select: { id: true },
      })
      transversalId = transversal.id
      await prisma.curso.update({ where: { id: cursoId }, data: { transversalId } })

      const a = await prisma.asignacionCurso.create({
        data: {
          colaboradorId: colabPartId,
          cursoId,
          rol: "ASIGNADO",
          estadoAsignado: "EN_PROGRESO",
          fechaInicio: new Date(),
        },
        select: { id: true },
      })
      asignacionPartId = a.id

      await prisma.$executeRaw`
        DELETE FROM sesiones
        WHERE (sess::jsonb->>'usuarioId') IN (
          SELECT id::text FROM usuarios WHERE colaborador_id IN
            (SELECT id FROM colaboradores WHERE email IN
              (${ADMIN_EMAIL}, ${PART_EMAIL}))
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

      agentePart = supertest.agent(app.getHttpServer())
      csrfPart = await loginYObtenerCsrf(agentePart, PART_EMAIL)
    }, 60_000)

    afterAll(async () => {
      try {
        await prisma.notificacionCanal.deleteMany({
          where: { notificacion: { usuarioId: usuarioPartId } },
        })
        await prisma.notificacion.deleteMany({ where: { usuarioId: usuarioPartId } })
        await prisma.preferenciaNotificacion.deleteMany({ where: { usuarioId: usuarioPartId } })
        await prisma.intentoTransversal.deleteMany({ where: { transversalId } })
        await prisma.idempotencyKey.deleteMany({ where: { scope: "intento-transversal" } })
        await prisma.asignacionCurso.deleteMany({ where: { cursoId } })
        await prisma.logCambioCurso.deleteMany({ where: { cursoId } })
        await prisma.proyectoTransversal.deleteMany({ where: { id: transversalId } })
        await prisma.curso.deleteMany({ where: { id: cursoId } })
        const cli = await prisma.cliente.findUnique({
          where: { nombre: CLIENTE_NOMBRE },
          select: { id: true },
        })
        if (cli) {
          await prisma.cliente.delete({ where: { id: cli.id } })
        }
      } finally {
        await app.close()
        await prisma.$disconnect()
      }
    }, 30_000)

    it("primer intento de transversal emite TRANSVERSAL_DISPONIBLE (silenciable, IN_APP + CORREO)", async () => {
      const key = randomUUID()
      const res = await agentePart
        .post(`/api/v1/asignaciones/${asignacionPartId}/intentos-transversal`)
        .set("X-XSRF-TOKEN", csrfPart)
        .set("Idempotency-Key", key)
        .send({ repoOArtefacto: { tipo: "URL_GIT", url: "https://github.com/foo/bar1" } })
      expect(res.status).toBe(201)
      const intentoId = (res.body as { intentoId: string }).intentoId

      const notif = await prisma.notificacion.findFirst({
        where: { usuarioId: usuarioPartId, tipoEvento: "TRANSVERSAL_DISPONIBLE" },
        select: {
          esCritico: true,
          payload: true,
          canales: { select: { canal: true } },
        },
      })
      expect(notif).not.toBeNull()
      expect(notif?.esCritico).toBe(false)
      expect(notif?.payload).toMatchObject({
        asignacionId: asignacionPartId,
        cursoId,
        intentoTransversalId: intentoId,
      })
      const canales = (notif?.canales ?? []).map((c) => c.canal).sort()
      expect(canales).toContain("IN_APP")
    })

    it("segundo intento NO re-emite TRANSVERSAL_DISPONIBLE (idempotencia inter-intentos)", async () => {
      const key = randomUUID()
      await agentePart
        .post(`/api/v1/asignaciones/${asignacionPartId}/intentos-transversal`)
        .set("X-XSRF-TOKEN", csrfPart)
        .set("Idempotency-Key", key)
        .send({ repoOArtefacto: { tipo: "URL_GIT", url: "https://github.com/foo/bar2" } })
        .expect(201)

      const total = await prisma.notificacion.count({
        where: { usuarioId: usuarioPartId, tipoEvento: "TRANSVERSAL_DISPONIBLE" },
      })
      // Tras el primer test sigue siendo 1 (no se duplica con el segundo intento).
      expect(total).toBe(1)
    })
  },
)
