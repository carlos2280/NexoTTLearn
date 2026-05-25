// biome-ignore lint/correctness/noNodejsModules: el harness e2e usa crypto nativo para Idempotency-Key UUID v4.
import { randomUUID } from "node:crypto"
// biome-ignore lint/correctness/noNodejsModules: el harness e2e necesita filesystem para detectar dist/.
import { existsSync } from "node:fs"
// biome-ignore lint/correctness/noNodejsModules: el harness e2e necesita resolver dist/ por path absoluto.
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
  console.warn("cursos-cierre.e2e: DATABASE_URL ausente — tests SKIP.")
}
if (HAS_DB_URL && !DIST_DISPONIBLE) {
  console.warn(
    "cursos-cierre.e2e: dist/ no encontrado — ejecutar `pnpm --filter @nexott-learn/api build`. SKIP.",
  )
}

const RUN_E2E = HAS_DB_URL && DIST_DISPONIBLE

const ADMIN_EMAIL = "cursos-cierre-admin@nttdata.test"
const PART_EMAIL = "cursos-cierre-part@nttdata.test"
const PASSWORD = "CierreP11a1234!"
const CLIENTE_NOMBRE = "ACME P11a cierre e2e"
const SKILL_ETIQUETA = "P11a-cierre-skill"
const TITULO_PREFIX = "P11a-cierre-"

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
): Promise<string> {
  const col = await prisma.colaborador.upsert({
    where: { email },
    update: { nombre: `P11a ${rol}`, estadoEmpleado: "ACTIVO" },
    create: { email, nombre: `P11a ${rol}`, estadoEmpleado: "ACTIVO" },
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
  })
  return col.id
}

async function esperar(ms: number): Promise<void> {
  await new Promise((r) => setTimeout(r, ms))
}

describe.runIf(RUN_E2E)("cursos cierre e2e (P11a — FIX-P11a-tests §5.127)", () => {
  let app: INestApplication
  let agenteAdmin: Agent
  let csrfAdmin: string
  let prisma: PrismaClient
  let clienteId: string
  let skillId: string
  let colaboradorAdminId: string
  let colaboradorPartId: string
  let usuarioPartId: string

  beforeAll(async () => {
    prisma = new PrismaClient()
    try {
      await prisma.$queryRaw`SELECT 1`
    } catch (error) {
      const detalle = error instanceof Error ? error.message : String(error)
      throw new Error(`No se pudo conectar a la BD para los e2e: ${detalle}`)
    }

    const passwordHash = await bcrypt.hash(PASSWORD, 12)
    colaboradorAdminId = await upsertUsuario(prisma, ADMIN_EMAIL, "ADMIN", passwordHash)
    colaboradorPartId = await upsertUsuario(prisma, PART_EMAIL, "PARTICIPANTE", passwordHash)
    const usuarioPart = await prisma.usuario.findUniqueOrThrow({
      where: { colaboradorId: colaboradorPartId },
      select: { id: true },
    })
    usuarioPartId = usuarioPart.id

    const cliente = await prisma.cliente.upsert({
      where: { nombre: CLIENTE_NOMBRE },
      update: { activo: true, deletedAt: null },
      create: { nombre: CLIENTE_NOMBRE, activo: true },
      select: { id: true },
    })
    clienteId = cliente.id

    const area = await prisma.area.upsert({
      where: { nombre: `${SKILL_ETIQUETA}-area` },
      update: {},
      create: { nombre: `${SKILL_ETIQUETA}-area` },
      select: { id: true },
    })
    const skill = await prisma.skill.upsert({
      where: { etiquetaVisible: SKILL_ETIQUETA },
      update: {},
      create: {
        etiquetaVisible: SKILL_ETIQUETA,
        areaId: area.id,
      },
      select: { id: true },
    })
    skillId = skill.id

    await prisma.$executeRaw`
      DELETE FROM sesiones
      WHERE (sess::jsonb->>'usuarioId') IN (
        SELECT id::text FROM usuarios WHERE colaborador_id IN (
          ${colaboradorAdminId}::uuid, ${colaboradorPartId}::uuid
        )
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
    csrfAdmin = await loginYObtenerCsrf(agenteAdmin, ADMIN_EMAIL)
  }, 60_000)

  afterAll(async () => {
    try {
      const cursosBorrar = await prisma.curso.findMany({
        where: { titulo: { startsWith: TITULO_PREFIX } },
        select: { id: true },
      })
      const cursoIds = cursosBorrar.map((c) => c.id)
      if (cursoIds.length > 0) {
        await prisma.notificacionCanal.deleteMany({
          where: { notificacion: { usuarioId: usuarioPartId } },
        })
        await prisma.notificacion.deleteMany({ where: { usuarioId: usuarioPartId } })
        await prisma.cursoFotografiaCierre.deleteMany({ where: { cursoId: { in: cursoIds } } })
        await prisma.historicoEstadoAsignacion.deleteMany({
          where: { asignacion: { cursoId: { in: cursoIds } } },
        })
        await prisma.planEstudio.deleteMany({
          where: { asignacion: { cursoId: { in: cursoIds } } },
        })
        await prisma.asignacionCurso.deleteMany({ where: { cursoId: { in: cursoIds } } })
        await prisma.logCambioCurso.deleteMany({ where: { cursoId: { in: cursoIds } } })
        await prisma.cursoSkillExigida.deleteMany({ where: { cursoId: { in: cursoIds } } })
        await prisma.curso.deleteMany({ where: { id: { in: cursoIds } } })
      }
      await prisma.notaSkill.deleteMany({ where: { colaboradorId: colaboradorPartId } })
      await prisma.skill.deleteMany({ where: { etiquetaVisible: SKILL_ETIQUETA } })
      await prisma.area.deleteMany({ where: { nombre: `${SKILL_ETIQUETA}-area` } })
      await prisma.cliente.deleteMany({ where: { nombre: CLIENTE_NOMBRE } })
      const ids = [colaboradorAdminId, colaboradorPartId].filter((v): v is string => Boolean(v))
      if (ids.length > 0) {
        await prisma.$executeRaw`
          DELETE FROM sesiones
          WHERE (sess::jsonb->>'usuarioId') IN (
            SELECT id::text FROM usuarios WHERE colaborador_id = ANY(${ids}::uuid[])
          )
        `
        await prisma.idempotencyKey.deleteMany({
          where: { usuario: { colaboradorId: { in: ids } } },
        })
        await prisma.activityLog.deleteMany({
          where: { usuario: { colaboradorId: { in: ids } } },
        })
        await prisma.usuario.deleteMany({ where: { colaboradorId: { in: ids } } })
        await prisma.colaborador.deleteMany({ where: { id: { in: ids } } })
      }
    } catch (error) {
      const detalle = error instanceof Error ? error.message : String(error)
      console.warn(`cursos-cierre.e2e cleanup fallo (no rompe teardown): ${detalle}`)
    }
    if (app) {
      await app.close()
    }
    if (prisma) {
      await prisma.$disconnect()
    }
  })

  async function crearCursoActivoConAsignacion(suffix: string): Promise<{
    cursoId: string
    asignacionId: string
  }> {
    const curso = await prisma.curso.create({
      data: {
        titulo: `${TITULO_PREFIX}${suffix}`,
        clienteId,
        estado: "ACTIVO",
        fechaInicio: new Date("2026-04-01"),
        fechaDeadline: new Date("2026-06-30"),
        toggleVoluntarios: true,
      },
      select: { id: true },
    })
    await prisma.cursoSkillExigida.create({
      data: { cursoId: curso.id, skillId, notaMinima: 60 },
    })
    const asignacion = await prisma.asignacionCurso.create({
      data: {
        cursoId: curso.id,
        colaboradorId: colaboradorPartId,
        rol: "ASIGNADO",
        estadoAsignado: "EN_PROGRESO",
      },
      select: { id: true },
    })
    await prisma.planEstudio.create({
      data: { asignacionId: asignacion.id, estaDesactualizado: false },
    })
    await prisma.notaSkill.upsert({
      where: {
        // biome-ignore lint/style/useNamingConvention: clave compuesta Prisma.
        colaboradorId_skillId: { colaboradorId: colaboradorPartId, skillId },
      },
      update: { notaActual: 80 },
      create: { colaboradorId: colaboradorPartId, skillId, notaActual: 80 },
    })
    return { cursoId: curso.id, asignacionId: asignacion.id }
  }

  beforeEach(async () => {
    // Limpieza idempotente entre escenarios: cada test usa titulos distintos
    // pero comparten colaborador/skill. Las notificaciones generadas por A
    // afectarian a aserciones de otros tests si no se purgan.
    await prisma.notificacionCanal.deleteMany({
      where: { notificacion: { usuarioId: usuarioPartId } },
    })
    await prisma.notificacion.deleteMany({ where: { usuarioId: usuarioPartId } })
    await prisma.activityLog.deleteMany({
      where: { usuario: { colaboradorId: colaboradorAdminId } },
    })
    await prisma.idempotencyKey.deleteMany({
      where: { usuario: { colaboradorId: colaboradorAdminId } },
    })
  })

  it("A: cerrar happy path persiste fotografia + historico + notificacion + audit", async () => {
    const { cursoId, asignacionId } = await crearCursoActivoConAsignacion("happy")
    const idempKey = randomUUID()

    const res = await agenteAdmin
      .post(`/api/v1/cursos/${cursoId}/cerrar`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .set("X-Motivo", "Cierre administrativo")
      .set("Idempotency-Key", idempKey)
      .send({
        decisionPorAsignacion: [{ asignacionId, accion: "CERRAR_APTO" }],
      })

    expect(res.status).toBe(200)
    const body = res.body as { estado: string; fechaCierre: string | null }
    expect(body.estado).toBe("CERRADO")
    expect(body.fechaCierre).toBeTruthy()

    const fotografia = await prisma.cursoFotografiaCierre.findUnique({ where: { cursoId } })
    expect(fotografia).not.toBeNull()
    expect(fotografia?.descartada).toBe(false)
    expect(fotografia?.versionSnapshot).toBe(1)
    const snapshot = fotografia?.snapshot as { curso: { id: string } } | null
    expect(snapshot?.curso.id).toBe(cursoId)

    const logCierre = await prisma.logCambioCurso.findFirst({
      where: { cursoId, accion: "CIERRE" },
      select: { id: true },
    })
    expect(logCierre).not.toBeNull()
    const historico = await prisma.historicoEstadoAsignacion.findMany({
      where: { logCambioCursoId: logCierre?.id ?? "" },
      select: { asignacionId: true, estadoNuevo: true },
    })
    expect(historico).toHaveLength(1)
    expect(historico[0]?.estadoNuevo).toBe("APTO")

    await esperar(300)
    const notif = await prisma.notificacion.findFirst({
      where: { usuarioId: usuarioPartId, tipoEvento: "RESULTADO_CIERRE" },
    })
    expect(notif).not.toBeNull()

    const audit = await prisma.activityLog.findFirst({
      where: {
        accion: "CURSO_CERRADO",
        recursoId: cursoId,
      },
    })
    expect(audit).not.toBeNull()
  }, 30_000)

  it("B: cerrar + deshacer dentro de ventana revierte estado y descarta fotografia", async () => {
    const { cursoId, asignacionId } = await crearCursoActivoConAsignacion("undo")

    const cerrar = await agenteAdmin
      .post(`/api/v1/cursos/${cursoId}/cerrar`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .set("X-Motivo", "Cierre administrativo")
      .set("Idempotency-Key", randomUUID())
      .send({
        decisionPorAsignacion: [{ asignacionId, accion: "CERRAR_APTO" }],
      })
    expect(cerrar.status).toBe(200)

    const deshacer = await agenteAdmin
      .post(`/api/v1/cursos/${cursoId}/deshacer-cierre`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .set("X-Motivo", "Reapertura por error")
      .set("Idempotency-Key", randomUUID())
      .send({})
    expect(deshacer.status).toBe(200)
    const body = deshacer.body as { estado: string; fechaCierre: string | null }
    expect(body.estado).toBe("ACTIVO")
    expect(body.fechaCierre).toBeNull()

    const fotografia = await prisma.cursoFotografiaCierre.findUnique({ where: { cursoId } })
    expect(fotografia?.descartada).toBe(true)
    expect(fotografia?.descartadaAt).not.toBeNull()

    const logDeshacer = await prisma.logCambioCurso.findFirst({
      where: { cursoId, accion: "DESHACER_CIERRE" },
      select: { previewImpacto: true },
    })
    expect(logDeshacer).not.toBeNull()
    const preview = logDeshacer?.previewImpacto as {
      logCambioCursoCierreId: string
      asignacionesRevertidas: number
    } | null
    expect(preview?.asignacionesRevertidas).toBe(1)
    expect(typeof preview?.logCambioCursoCierreId).toBe("string")

    const audit = await prisma.activityLog.findFirst({
      where: { accion: "CURSO_CIERRE_DESHECHO", recursoId: cursoId },
    })
    expect(audit).not.toBeNull()
  }, 30_000)

  it("C: cerrar sin decision para asignacion EN_PROGRESO → 422 validacionDecisionFaltante", async () => {
    const { cursoId, asignacionId } = await crearCursoActivoConAsignacion("422")

    const res = await agenteAdmin
      .post(`/api/v1/cursos/${cursoId}/cerrar`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .set("X-Motivo", "Cierre sin decisiones")
      .set("Idempotency-Key", randomUUID())
      .send({ decisionPorAsignacion: [] })

    expect(res.status).toBe(422)
    const body = res.body as {
      code: string
      details: { asignacionesFaltantes: readonly string[] }
    }
    expect(body.code).toBe("VALIDACION_DECISION_FALTANTE")
    expect(body.details.asignacionesFaltantes).toContain(asignacionId)

    const cursoTrasError = await prisma.curso.findUnique({
      where: { id: cursoId },
      select: { estado: true },
    })
    expect(cursoTrasError?.estado).toBe("ACTIVO")
    const fotografia = await prisma.cursoFotografiaCierre.findUnique({ where: { cursoId } })
    expect(fotografia).toBeNull()
  }, 30_000)

  it("D: deshacer fuera de ventana (>7d) → 409 conflictCursoFueraVentana7Dias", async () => {
    const curso = await prisma.curso.create({
      data: {
        titulo: `${TITULO_PREFIX}fuera-ventana`,
        clienteId,
        estado: "CERRADO",
        fechaInicio: new Date("2026-04-01"),
        fechaDeadline: new Date("2026-06-30"),
        // Forzar fechaCierre 8 dias atras: no se puede esperar 8 dias en CI ni
        // simular con cron — set directo via Prisma es la unica opcion realista.
        fechaCierre: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      },
      select: { id: true },
    })
    await prisma.logCambioCurso.create({
      data: {
        cursoId: curso.id,
        autorUsuarioId: (
          await prisma.usuario.findUniqueOrThrow({
            where: { colaboradorId: colaboradorAdminId },
            select: { id: true },
          })
        ).id,
        accion: "CIERRE",
        motivo: "Cierre simulado fuera de ventana",
        previewImpacto: { fechaCierre: new Date().toISOString() },
      },
    })

    const res = await agenteAdmin
      .post(`/api/v1/cursos/${curso.id}/deshacer-cierre`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .set("X-Motivo", "Intentar reabrir tarde")
      .set("Idempotency-Key", randomUUID())
      .send({})

    expect(res.status).toBe(409)
    const body = res.body as { code: string }
    expect(body.code).toBe("CONFLICT_CURSO_FUERA_VENTANA_7_DIAS")

    const cursoTrasError = await prisma.curso.findUnique({
      where: { id: curso.id },
      select: { estado: true },
    })
    expect(cursoTrasError?.estado).toBe("CERRADO")
  }, 30_000)
})
