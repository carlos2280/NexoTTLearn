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

const ADMIN_EMAIL = "notif-eia-disp-admin@nttdata.test"
const PART_EMAIL = "notif-eia-disp-part@nttdata.test"
const PASSWORD = "NotifEia1234!"
const CLIENTE_NOMBRE = "Cliente Notif Eia Disp"
const PREFIX = "P11.5a-eia-"

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
  "notificaciones ENTREVISTA_IA_DISPONIBLE e2e (P11.5a — D-S11.5-A4, D42)",
  () => {
    let app: INestApplication
    let prisma: PrismaClient
    let agentePart: Agent
    let csrfPart: string
    let usuarioPartId: string
    let asignacionPartId: string
    let cursoId: string
    let entrevistaIaId: string

    beforeAll(async () => {
      prisma = new PrismaClient()
      const passwordHash = await bcrypt.hash(PASSWORD, 12)
      await upsertUsuario(prisma, ADMIN_EMAIL, "ADMIN", passwordHash, "Eia Disp Admin")
      const part = await upsertUsuario(
        prisma,
        PART_EMAIL,
        "PARTICIPANTE",
        passwordHash,
        "Eia Disp Part",
      )
      usuarioPartId = part.usuarioId
      const colabPartId = part.colaboradorId

      const cliente = await prisma.cliente.upsert({
        where: { nombre: CLIENTE_NOMBRE },
        update: { activo: true, deletedAt: null },
        create: { nombre: CLIENTE_NOMBRE, activo: true },
        select: { id: true },
      })

      // Limpieza preventiva.
      const cursosPrev = await prisma.curso.findMany({
        where: { titulo: { contains: PREFIX } },
        select: { id: true, entrevistaIaId: true },
      })
      for (const c of cursosPrev) {
        if (c.entrevistaIaId !== null) {
          await prisma.intentoEntrevistaIA.deleteMany({
            where: { entrevistaIaId: c.entrevistaIaId },
          })
        }
      }
      const cursoIdsPrev = cursosPrev.map((c) => c.id)
      if (cursoIdsPrev.length > 0) {
        await prisma.aperturaSeccion.deleteMany({
          where: { asignacion: { cursoId: { in: cursoIdsPrev } } },
        })
        await prisma.itemPlan.deleteMany({
          where: { plan: { asignacion: { cursoId: { in: cursoIdsPrev } } } },
        })
        await prisma.planEstudio.deleteMany({
          where: { asignacion: { cursoId: { in: cursoIdsPrev } } },
        })
        await prisma.asignacionCurso.deleteMany({ where: { cursoId: { in: cursoIdsPrev } } })
        await prisma.cursoAreaExigida.deleteMany({ where: { cursoId: { in: cursoIdsPrev } } })
        await prisma.logCambioCurso.deleteMany({ where: { cursoId: { in: cursoIdsPrev } } })
        for (const c of cursosPrev) {
          if (c.entrevistaIaId !== null) {
            await prisma.curso.update({
              where: { id: c.id },
              data: { entrevistaIaId: null },
            })
            await prisma.rubricaEntrevistaIA.deleteMany({
              where: { entrevistaIaId: c.entrevistaIaId },
            })
            await prisma.entrevistaIA.deleteMany({ where: { id: c.entrevistaIaId } })
          }
        }
        await prisma.curso.deleteMany({ where: { id: { in: cursoIdsPrev } } })
      }
      await prisma.bloque.deleteMany({
        where: { seccion: { modulo: { titulo: { contains: PREFIX } } } },
      })
      await prisma.seccionSkill.deleteMany({
        where: { seccion: { modulo: { titulo: { contains: PREFIX } } } },
      })
      await prisma.seccion.deleteMany({ where: { modulo: { titulo: { contains: PREFIX } } } })
      await prisma.modulo.deleteMany({ where: { titulo: { contains: PREFIX } } })
      const skillsPrev = await prisma.skill.findMany({
        where: { etiquetaVisible: { contains: PREFIX } },
        select: { id: true },
      })
      const skillIdsPrev = skillsPrev.map((s) => s.id)
      if (skillIdsPrev.length > 0) {
        await prisma.historicoNotaSkill.deleteMany({
          where: { notaSkill: { skillId: { in: skillIdsPrev } } },
        })
        await prisma.notaSkill.deleteMany({ where: { skillId: { in: skillIdsPrev } } })
      }
      await prisma.skill.deleteMany({ where: { etiquetaVisible: { contains: PREFIX } } })
      await prisma.area.deleteMany({ where: { nombre: { contains: PREFIX } } })
      await prisma.notificacionCanal.deleteMany({
        where: { notificacion: { usuarioId: usuarioPartId } },
      })
      await prisma.notificacion.deleteMany({ where: { usuarioId: usuarioPartId } })

      const area = await prisma.area.create({
        data: { nombre: `${PREFIX}area`, descripcion: "Area entrevista P11.5a" },
        select: { id: true },
      })
      const skill = await prisma.skill.create({
        data: { etiquetaVisible: `${PREFIX}skill`, areaId: area.id, estado: "ACTIVA" },
        select: { id: true },
      })
      const modulo = await prisma.modulo.create({
        data: { titulo: `${PREFIX}modulo`, estado: "ACTIVO" },
        select: { id: true },
      })
      const seccion = await prisma.seccion.create({
        data: {
          moduloId: modulo.id,
          titulo: "Seccion P11.5a",
          orden: 1,
          skills: { create: [{ skillId: skill.id }] },
        },
        select: { id: true },
      })
      await prisma.bloque.create({
        data: {
          seccionId: seccion.id,
          orden: 1,
          tipo: "PARRAFO",
          esEvaluable: false,
          contenido: { titulo: "B1", resumen: "B1 resumen" },
          estado: "ACTIVO",
        },
      })

      const curso = await prisma.curso.create({
        data: {
          titulo: `${PREFIX}curso-disp`,
          clienteId: cliente.id,
          estado: "ACTIVO",
          fechaInicio: new Date("2026-04-01"),
          fechaDeadline: new Date("2026-08-01"),
          toggleVoluntarios: false,
          desbloqueo: "SIEMPRE",
          areasExigidas: { create: [{ areaId: area.id, peso: 100, puntajeObjetivo: 70 }] },
        },
        select: { id: true },
      })
      cursoId = curso.id

      const entrevista = await prisma.entrevistaIA.create({
        data: {
          cursoId,
          umbralAprobacion: 70,
          filosofia: "PREPARACION",
          profundidad: "SEMI_SENIOR",
          duracionMinutos: 30,
          tono: "CONVERSACIONAL",
          rubrica: { create: [{ areaId: area.id, peso: 100 }] },
        },
        select: { id: true },
      })
      entrevistaIaId = entrevista.id
      await prisma.curso.update({ where: { id: cursoId }, data: { entrevistaIaId } })

      const a1 = await prisma.asignacionCurso.create({
        data: {
          colaboradorId: colabPartId,
          cursoId,
          rol: "ASIGNADO",
          estadoAsignado: "EN_PROGRESO",
          fechaInicio: new Date(),
        },
        select: { id: true },
      })
      asignacionPartId = a1.id
      // Plan con item opcional + apertura (planCompleto vacuamente true).
      const plan = await prisma.planEstudio.create({
        data: { asignacionId: asignacionPartId },
        select: { id: true },
      })
      await prisma.itemPlan.create({
        data: {
          planId: plan.id,
          moduloId: modulo.id,
          seccionId: seccion.id,
          caracter: "OPCIONAL",
          razon: "SKILL_FALTANTE",
        },
      })
      await prisma.aperturaSeccion.create({
        data: { asignacionId: asignacionPartId, seccionId: seccion.id },
      })

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
        if (entrevistaIaId) {
          await prisma.intentoEntrevistaIA.deleteMany({ where: { entrevistaIaId } })
        }
        await prisma.aperturaSeccion.deleteMany({
          where: { asignacionId: asignacionPartId },
        })
        await prisma.itemPlan.deleteMany({
          where: { plan: { asignacionId: asignacionPartId } },
        })
        await prisma.planEstudio.deleteMany({ where: { asignacionId: asignacionPartId } })
        await prisma.asignacionCurso.deleteMany({ where: { cursoId } })
        await prisma.cursoAreaExigida.deleteMany({ where: { cursoId } })
        await prisma.logCambioCurso.deleteMany({ where: { cursoId } })
        if (entrevistaIaId) {
          await prisma.curso.update({ where: { id: cursoId }, data: { entrevistaIaId: null } })
          await prisma.rubricaEntrevistaIA.deleteMany({ where: { entrevistaIaId } })
          await prisma.entrevistaIA.deleteMany({ where: { id: entrevistaIaId } })
        }
        await prisma.curso.deleteMany({ where: { id: cursoId } })
        await prisma.bloque.deleteMany({
          where: { seccion: { modulo: { titulo: { contains: PREFIX } } } },
        })
        await prisma.seccionSkill.deleteMany({
          where: { seccion: { modulo: { titulo: { contains: PREFIX } } } },
        })
        await prisma.seccion.deleteMany({
          where: { modulo: { titulo: { contains: PREFIX } } },
        })
        await prisma.modulo.deleteMany({ where: { titulo: { contains: PREFIX } } })
        const skillsCleanup = await prisma.skill.findMany({
          where: { etiquetaVisible: { contains: PREFIX } },
          select: { id: true },
        })
        const skillIds = skillsCleanup.map((s) => s.id)
        if (skillIds.length > 0) {
          await prisma.historicoNotaSkill.deleteMany({
            where: { notaSkill: { skillId: { in: skillIds } } },
          })
          await prisma.notaSkill.deleteMany({ where: { skillId: { in: skillIds } } })
        }
        await prisma.skill.deleteMany({ where: { etiquetaVisible: { contains: PREFIX } } })
        await prisma.area.deleteMany({ where: { nombre: { contains: PREFIX } } })
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

    it("primer intento de entrevista IA emite ENTREVISTA_IA_DISPONIBLE (silenciable)", async () => {
      const key = randomUUID()
      const res = await agentePart
        .post(`/api/v1/asignaciones/${asignacionPartId}/intentos-entrevista-ia`)
        .set("X-XSRF-TOKEN", csrfPart)
        .set("Idempotency-Key", key)
        .send({})
      expect(res.status).toBe(201)
      const intentoId = (res.body as { intentoId: string }).intentoId

      const notif = await prisma.notificacion.findFirst({
        where: { usuarioId: usuarioPartId, tipoEvento: "ENTREVISTA_IA_DISPONIBLE" },
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
        intentoEntrevistaIaId: intentoId,
      })
      const canales = (notif?.canales ?? []).map((c) => c.canal).sort()
      expect(canales).toContain("IN_APP")
    })

    it("segundo intento NO re-emite ENTREVISTA_IA_DISPONIBLE (idempotencia inter-intentos)", async () => {
      // Marcamos el intento previo como FINALIZADO para poder crear uno nuevo
      // sin chocar con la regla "INTENTO_EN_CURSO".
      await prisma.intentoEntrevistaIA.updateMany({
        where: { entrevistaIaId },
        data: { estado: "FINALIZADO" },
      })
      const key = randomUUID()
      await agentePart
        .post(`/api/v1/asignaciones/${asignacionPartId}/intentos-entrevista-ia`)
        .set("X-XSRF-TOKEN", csrfPart)
        .set("Idempotency-Key", key)
        .send({})
        .expect(201)

      const total = await prisma.notificacion.count({
        where: { usuarioId: usuarioPartId, tipoEvento: "ENTREVISTA_IA_DISPONIBLE" },
      })
      // Tras el primer test sigue siendo 1 (no se duplica con el segundo intento).
      expect(total).toBe(1)
    })
  },
)
