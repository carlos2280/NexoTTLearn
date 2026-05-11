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
import { afterAll, beforeAll, describe, expect, it } from "vitest"

const HAS_DB_URL = Boolean(process.env.DATABASE_URL)
const DIST_DIR = resolve(__dirname, "..", "dist")
const DIST_DISPONIBLE = existsSync(join(DIST_DIR, "app.module.js"))

if (!HAS_DB_URL) {
  console.warn("asignaciones-transiciones.e2e: DATABASE_URL ausente — tests SKIP.")
}
if (HAS_DB_URL && !DIST_DISPONIBLE) {
  console.warn(
    "asignaciones-transiciones.e2e: dist/ no encontrado — ejecutar `pnpm --filter @nexott-learn/api build`. SKIP.",
  )
}

const RUN_E2E = HAS_DB_URL && DIST_DISPONIBLE

const ADMIN_EMAIL = "asig-tr-admin@nttdata.test"
const PART1_EMAIL = "asig-tr-part1@nttdata.test"
const PART2_EMAIL = "asig-tr-part2@nttdata.test"
const PASSWORD = "AsignTr1234!"
const CLIENTE_NOMBRE = "ACME P6b e2e"
const TITULO_PREFIX = "P6b-tr-"

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
    update: { nombre: `P6b ${rol}`, estadoEmpleado: "ACTIVO" },
    create: { email, nombre: `P6b ${rol}`, estadoEmpleado: "ACTIVO" },
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

describe.runIf(RUN_E2E)("asignaciones transiciones e2e (P6b)", () => {
  let app: INestApplication
  let agenteAdmin: Agent
  let agentePart1: Agent
  let agentePart2: Agent
  let csrfAdmin: string
  let csrfPart1: string
  let csrfPart2: string
  let prisma: PrismaClient
  let clienteId: string
  let colaboradorAdminId: string
  let colaboradorPart1Id: string
  let colaboradorPart2Id: string
  let cursoSimpleId: string
  let cursoConTransversalId: string
  let transversalId: string

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
    colaboradorPart1Id = await upsertUsuario(prisma, PART1_EMAIL, "PARTICIPANTE", passwordHash)
    colaboradorPart2Id = await upsertUsuario(prisma, PART2_EMAIL, "PARTICIPANTE", passwordHash)

    const cliente = await prisma.cliente.upsert({
      where: { nombre: CLIENTE_NOMBRE },
      update: { activo: true, deletedAt: null },
      create: { nombre: CLIENTE_NOMBRE, activo: true },
      select: { id: true },
    })
    clienteId = cliente.id

    const cursoSimple = await prisma.curso.create({
      data: {
        titulo: `${TITULO_PREFIX}simple`,
        clienteId,
        estado: "ACTIVO",
        fechaInicio: new Date("2026-06-01"),
        fechaDeadline: new Date("2026-08-01"),
        toggleVoluntarios: true,
      },
      select: { id: true },
    })
    cursoSimpleId = cursoSimple.id

    // Curso con transversal: para probar 422 condicionesListoNoCumplidas
    const cursoConTrans = await prisma.curso.create({
      data: {
        titulo: `${TITULO_PREFIX}con-trans`,
        clienteId,
        estado: "ACTIVO",
        fechaInicio: new Date("2026-06-01"),
        fechaDeadline: new Date("2026-08-01"),
        toggleVoluntarios: false,
      },
      select: { id: true },
    })
    cursoConTransversalId = cursoConTrans.id

    const transversal = await prisma.proyectoTransversal.create({
      data: {
        cursoId: cursoConTransversalId,
        descripcion: "Transversal demo P6b",
      },
      select: { id: true },
    })
    transversalId = transversal.id
    await prisma.curso.update({
      where: { id: cursoConTransversalId },
      data: { transversalId },
    })

    await prisma.$executeRaw`
      DELETE FROM sesiones
      WHERE (sess::jsonb->>'usuarioId') IN (
        SELECT id::text FROM usuarios WHERE colaborador_id IN (
          ${colaboradorAdminId}::uuid,
          ${colaboradorPart1Id}::uuid,
          ${colaboradorPart2Id}::uuid
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
    agentePart1 = supertest.agent(app.getHttpServer())
    agentePart2 = supertest.agent(app.getHttpServer())
    csrfAdmin = await loginYObtenerCsrf(agenteAdmin, ADMIN_EMAIL)
    csrfPart1 = await loginYObtenerCsrf(agentePart1, PART1_EMAIL)
    csrfPart2 = await loginYObtenerCsrf(agentePart2, PART2_EMAIL)
  }, 60_000)

  afterAll(async () => {
    try {
      const cursoIds = [cursoSimpleId, cursoConTransversalId].filter(Boolean)
      if (cursoIds.length > 0) {
        await prisma.historicoEstadoAsignacion.deleteMany({
          where: { asignacion: { cursoId: { in: cursoIds } } },
        })
        await prisma.asignacionCurso.deleteMany({ where: { cursoId: { in: cursoIds } } })
        if (transversalId) {
          await prisma.curso.update({
            where: { id: cursoConTransversalId },
            data: { transversalId: null },
          })
          await prisma.proyectoTransversal.deleteMany({ where: { id: transversalId } })
        }
        await prisma.curso.deleteMany({ where: { id: { in: cursoIds } } })
      }
      await prisma.cliente.deleteMany({ where: { nombre: CLIENTE_NOMBRE } })

      const colaboradorIds = [colaboradorAdminId, colaboradorPart1Id, colaboradorPart2Id].filter(
        Boolean,
      )
      if (colaboradorIds.length > 0) {
        await prisma.$executeRaw`
          DELETE FROM sesiones
          WHERE (sess::jsonb->>'usuarioId') IN (
            SELECT id::text FROM usuarios WHERE colaborador_id = ANY(${colaboradorIds}::uuid[])
          )
        `
        await prisma.idempotencyKey.deleteMany({
          where: {
            usuario: { colaboradorId: { in: colaboradorIds } },
          },
        })
        await prisma.usuario.deleteMany({ where: { colaboradorId: { in: colaboradorIds } } })
        await prisma.colaborador.deleteMany({ where: { id: { in: colaboradorIds } } })
      }
    } catch (error) {
      const detalle = error instanceof Error ? error.message : String(error)
      console.warn(`asignaciones-transiciones.e2e cleanup fallo: ${detalle}`)
    }
    if (app) {
      await app.close()
    }
    if (prisma) {
      await prisma.$disconnect()
    }
  })

  async function seedAsignado(colaboradorId: string, cursoId: string): Promise<string> {
    const row = await prisma.asignacionCurso.create({
      data: {
        cursoId,
        colaboradorId,
        rol: "ASIGNADO",
        estadoAsignado: "ASIGNADO",
      },
      select: { id: true },
    })
    return row.id
  }

  async function seedVoluntario(colaboradorId: string, cursoId: string): Promise<string> {
    const row = await prisma.asignacionCurso.create({
      data: {
        cursoId,
        colaboradorId,
        rol: "VOLUNTARIO",
        estadoVoluntario: "INSCRITO",
        origenVoluntario: "INICIATIVA",
        resultadoEntrevistaCliente: null,
      },
      select: { id: true },
    })
    return row.id
  }

  async function limpiarAsignacionesDelCurso(cursoId: string): Promise<void> {
    await prisma.historicoEstadoAsignacion.deleteMany({
      where: { asignacion: { cursoId } },
    })
    await prisma.asignacionCurso.deleteMany({ where: { cursoId } })
  }

  // ===== Flujo completo asignado =====

  it("flujo completo asignado: iniciar -> listo -> cerrar(APTO) -> reabrir -> cerrar(NO_APTO)", async () => {
    await limpiarAsignacionesDelCurso(cursoSimpleId)
    const asignacionId = await seedAsignado(colaboradorPart1Id, cursoSimpleId)

    // iniciar-progreso
    const r1 = await agenteAdmin
      .post(`/api/v1/asignaciones/${asignacionId}/iniciar-progreso`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .send({})
    expect(r1.status).toBe(200)
    expect((r1.body as { estadoAsignado: string }).estadoAsignado).toBe("EN_PROGRESO")

    // marcar-listo
    const r2 = await agenteAdmin
      .post(`/api/v1/asignaciones/${asignacionId}/marcar-listo`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .send({})
    expect(r2.status).toBe(200)
    expect((r2.body as { estadoAsignado: string }).estadoAsignado).toBe("LISTO")

    // cerrar-caso APTO
    const r3 = await agenteAdmin
      .post(`/api/v1/asignaciones/${asignacionId}/cerrar-caso`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .set("Idempotency-Key", randomUUID())
      .send({ resultado: "APTO" })
    expect(r3.status).toBe(200)
    expect((r3.body as { estadoAsignado: string }).estadoAsignado).toBe("APTO")
    // Por default schema, resultadoEntrevistaCliente=PENDIENTE en ASIGNADO.
    expect((r3.body as { resultadoEntrevistaCliente: string }).resultadoEntrevistaCliente).toBe(
      "PENDIENTE",
    )

    // reabrir-caso
    const r4 = await agenteAdmin
      .post(`/api/v1/asignaciones/${asignacionId}/reabrir-caso`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .set("X-Motivo", "Cliente solicito revisar")
      .set("Idempotency-Key", randomUUID())
      .send({})
    expect(r4.status).toBe(200)
    expect((r4.body as { estadoAsignado: string }).estadoAsignado).toBe("EN_PROGRESO")

    // cerrar-caso NO_APTO
    const r5 = await agenteAdmin
      .post(`/api/v1/asignaciones/${asignacionId}/cerrar-caso`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .set("Idempotency-Key", randomUUID())
      .send({ resultado: "NO_APTO" })
    expect(r5.status).toBe(200)
    expect((r5.body as { estadoAsignado: string }).estadoAsignado).toBe("NO_APTO")

    const historico = await prisma.historicoEstadoAsignacion.count({ where: { asignacionId } })
    expect(historico).toBeGreaterThanOrEqual(4)
  })

  // ===== Flujo voluntario =====

  it("flujo voluntario: iniciar -> listo -> cerrar (sin resultado) -> COMPLETADO, resultadoEntrevistaCliente null", async () => {
    await limpiarAsignacionesDelCurso(cursoSimpleId)
    const asignacionId = await seedVoluntario(colaboradorPart2Id, cursoSimpleId)

    const r1 = await agenteAdmin
      .post(`/api/v1/asignaciones/${asignacionId}/iniciar-progreso`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .send({})
    expect(r1.status).toBe(200)

    const r2 = await agenteAdmin
      .post(`/api/v1/asignaciones/${asignacionId}/marcar-listo`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .send({})
    expect(r2.status).toBe(200)

    const r3 = await agenteAdmin
      .post(`/api/v1/asignaciones/${asignacionId}/cerrar-caso`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .set("Idempotency-Key", randomUUID())
      .send({})
    expect(r3.status).toBe(200)
    const body = r3.body as {
      estadoVoluntario: string
      resultadoEntrevistaCliente: string | null
    }
    expect(body.estadoVoluntario).toBe("COMPLETADO")
    // CHECK chk_asig_resultado_solo_asignado obliga a null para voluntarios.
    expect(body.resultadoEntrevistaCliente).toBeNull()
  })

  // ===== Scope PARTICIPANTE =====

  it("iniciar-progreso por el propio PARTICIPANTE: 200", async () => {
    await limpiarAsignacionesDelCurso(cursoSimpleId)
    const asignacionId = await seedAsignado(colaboradorPart1Id, cursoSimpleId)
    const res = await agentePart1
      .post(`/api/v1/asignaciones/${asignacionId}/iniciar-progreso`)
      .set("X-XSRF-TOKEN", csrfPart1)
      .send({})
    expect(res.status).toBe(200)
    expect((res.body as { estadoAsignado: string }).estadoAsignado).toBe("EN_PROGRESO")
  })

  it("iniciar-progreso por PARTICIPANTE ajeno: 404 asignacionNoEncontrada", async () => {
    await limpiarAsignacionesDelCurso(cursoSimpleId)
    const asignacionId = await seedAsignado(colaboradorPart1Id, cursoSimpleId)
    const res = await agentePart2
      .post(`/api/v1/asignaciones/${asignacionId}/iniciar-progreso`)
      .set("X-XSRF-TOKEN", csrfPart2)
      .send({})
    expect(res.status).toBe(404)
    expect((res.body as { code: string }).code).toBe("ASIGNACION_NO_ENCONTRADA")
  })

  // ===== marcar-listo: 422 con transversal pendiente =====

  it("marcar-listo con curso con transversal: 422 condicionesListoNoCumplidas", async () => {
    await limpiarAsignacionesDelCurso(cursoConTransversalId)
    const asignacionId = await seedAsignado(colaboradorPart1Id, cursoConTransversalId)
    await prisma.asignacionCurso.update({
      where: { id: asignacionId },
      data: { estadoAsignado: "EN_PROGRESO" },
    })

    const res = await agenteAdmin
      .post(`/api/v1/asignaciones/${asignacionId}/marcar-listo`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .send({})
    expect(res.status).toBe(422)
    const body = res.body as {
      code: string
      details: { faltantes: Array<{ codigo: string }> }
    }
    expect(body.code).toBe("CONDICIONES_LISTO_NO_CUMPLIDAS")
    expect(body.details.faltantes.map((f) => f.codigo)).toContain("TRANSVERSAL_PENDIENTE")
  })

  // ===== Validacion de body discriminado por rol =====

  it("cerrar-caso ASIGNADO sin resultado en body: 400 invalidBody", async () => {
    await limpiarAsignacionesDelCurso(cursoSimpleId)
    const asignacionId = await seedAsignado(colaboradorPart1Id, cursoSimpleId)
    await prisma.asignacionCurso.update({
      where: { id: asignacionId },
      data: { estadoAsignado: "LISTO" },
    })

    const res = await agenteAdmin
      .post(`/api/v1/asignaciones/${asignacionId}/cerrar-caso`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .set("Idempotency-Key", randomUUID())
      .send({})
    expect(res.status).toBe(400)
    expect((res.body as { code: string }).code).toBe("INVALID_BODY")
  })

  it("cerrar-caso VOLUNTARIO con resultado en body: 400 invalidBody (strict)", async () => {
    await limpiarAsignacionesDelCurso(cursoSimpleId)
    const asignacionId = await seedVoluntario(colaboradorPart2Id, cursoSimpleId)
    await prisma.asignacionCurso.update({
      where: { id: asignacionId },
      data: { estadoVoluntario: "LISTO" },
    })

    const res = await agenteAdmin
      .post(`/api/v1/asignaciones/${asignacionId}/cerrar-caso`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .set("Idempotency-Key", randomUUID())
      .send({ resultado: "APTO" })
    expect(res.status).toBe(400)
    expect((res.body as { code: string }).code).toBe("INVALID_BODY")
  })

  it("cerrar-caso sin Idempotency-Key: 400 idempotencyKeyRequerida", async () => {
    await limpiarAsignacionesDelCurso(cursoSimpleId)
    const asignacionId = await seedAsignado(colaboradorPart1Id, cursoSimpleId)
    await prisma.asignacionCurso.update({
      where: { id: asignacionId },
      data: { estadoAsignado: "LISTO" },
    })
    const res = await agenteAdmin
      .post(`/api/v1/asignaciones/${asignacionId}/cerrar-caso`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .send({ resultado: "APTO" })
    expect(res.status).toBe(400)
    expect((res.body as { code: string }).code).toBe("IDEMPOTENCY_KEY_REQUERIDA")
  })

  it("cerrar-caso replay con misma Idempotency-Key y mismo body: 200 con response identico", async () => {
    await limpiarAsignacionesDelCurso(cursoSimpleId)
    const asignacionId = await seedAsignado(colaboradorPart1Id, cursoSimpleId)
    await prisma.asignacionCurso.update({
      where: { id: asignacionId },
      data: { estadoAsignado: "LISTO" },
    })
    const key = randomUUID()
    const r1 = await agenteAdmin
      .post(`/api/v1/asignaciones/${asignacionId}/cerrar-caso`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .set("Idempotency-Key", key)
      .send({ resultado: "APTO" })
    expect(r1.status).toBe(200)
    const r2 = await agenteAdmin
      .post(`/api/v1/asignaciones/${asignacionId}/cerrar-caso`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .set("Idempotency-Key", key)
      .send({ resultado: "APTO" })
    expect(r2.status).toBe(200)
    expect((r2.body as { id: string }).id).toBe((r1.body as { id: string }).id)
  })

  it("cerrar-caso con misma Idempotency-Key y body distinto: 409", async () => {
    await limpiarAsignacionesDelCurso(cursoSimpleId)
    const asignacionId = await seedAsignado(colaboradorPart1Id, cursoSimpleId)
    await prisma.asignacionCurso.update({
      where: { id: asignacionId },
      data: { estadoAsignado: "LISTO" },
    })
    const key = randomUUID()
    const r1 = await agenteAdmin
      .post(`/api/v1/asignaciones/${asignacionId}/cerrar-caso`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .set("Idempotency-Key", key)
      .send({ resultado: "APTO" })
    expect(r1.status).toBe(200)

    // Necesitamos otra asignacion en LISTO para que la unica diferencia sea el body.
    await limpiarAsignacionesDelCurso(cursoSimpleId)
    const otraId = await seedAsignado(colaboradorPart1Id, cursoSimpleId)
    await prisma.asignacionCurso.update({
      where: { id: otraId },
      data: { estadoAsignado: "LISTO" },
    })

    const r2 = await agenteAdmin
      .post(`/api/v1/asignaciones/${otraId}/cerrar-caso`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .set("Idempotency-Key", key)
      .send({ resultado: "NO_APTO" })
    expect(r2.status).toBe(409)
    expect((r2.body as { code: string }).code).toBe(
      "CONFLICT_IDEMPOTENCY_KEY_REUSADA_CON_BODY_DISTINTO",
    )
  })

  // ===== reabrir-caso =====

  it("reabrir-caso sin X-Motivo: 422 motivoRequerido", async () => {
    await limpiarAsignacionesDelCurso(cursoSimpleId)
    const asignacionId = await seedAsignado(colaboradorPart1Id, cursoSimpleId)
    await prisma.asignacionCurso.update({
      where: { id: asignacionId },
      data: { estadoAsignado: "APTO", fechaCierre: new Date() },
    })
    const res = await agenteAdmin
      .post(`/api/v1/asignaciones/${asignacionId}/reabrir-caso`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .set("Idempotency-Key", randomUUID())
      .send({})
    expect(res.status).toBe(422)
    expect((res.body as { code: string }).code).toBe("MOTIVO_REQUERIDO")
  })

  it("reabrir-caso sobre EN_PROGRESO: 409 conflictAsignacionNoCerrada", async () => {
    await limpiarAsignacionesDelCurso(cursoSimpleId)
    const asignacionId = await seedAsignado(colaboradorPart1Id, cursoSimpleId)
    await prisma.asignacionCurso.update({
      where: { id: asignacionId },
      data: { estadoAsignado: "EN_PROGRESO" },
    })
    const res = await agenteAdmin
      .post(`/api/v1/asignaciones/${asignacionId}/reabrir-caso`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .set("X-Motivo", "intento invalido")
      .set("Idempotency-Key", randomUUID())
      .send({})
    expect(res.status).toBe(409)
    expect((res.body as { code: string }).code).toBe("CONFLICT_ASIGNACION_NO_CERRADA")
  })

  // ===== retirar =====

  it("retirar con X-Motivo: 200 estadoAsignado=RETIRADO", async () => {
    await limpiarAsignacionesDelCurso(cursoSimpleId)
    const asignacionId = await seedAsignado(colaboradorPart1Id, cursoSimpleId)
    const res = await agenteAdmin
      .post(`/api/v1/asignaciones/${asignacionId}/retirar`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .set("X-Motivo", "Renuncia voluntaria del colaborador")
      .send({})
    expect(res.status).toBe(200)
    expect((res.body as { estadoAsignado: string }).estadoAsignado).toBe("RETIRADO")
  })

  it("retirar sin X-Motivo: 422 motivoRequerido", async () => {
    await limpiarAsignacionesDelCurso(cursoSimpleId)
    const asignacionId = await seedAsignado(colaboradorPart1Id, cursoSimpleId)
    const res = await agenteAdmin
      .post(`/api/v1/asignaciones/${asignacionId}/retirar`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .send({})
    expect(res.status).toBe(422)
    expect((res.body as { code: string }).code).toBe("MOTIVO_REQUERIDO")
  })

  it("retirar ya RETIRADA: 409 conflictAsignacionEstado", async () => {
    await limpiarAsignacionesDelCurso(cursoSimpleId)
    const asignacionId = await seedAsignado(colaboradorPart1Id, cursoSimpleId)
    await prisma.asignacionCurso.update({
      where: { id: asignacionId },
      data: { estadoAsignado: "RETIRADO", fechaCierre: new Date() },
    })
    const res = await agenteAdmin
      .post(`/api/v1/asignaciones/${asignacionId}/retirar`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .set("X-Motivo", "duplicado")
      .send({})
    expect(res.status).toBe(409)
    expect((res.body as { code: string }).code).toBe("CONFLICT_ASIGNACION_ESTADO")
  })

  // ===== Race real con dos peticiones simultaneas =====

  it("race real: dos cerrar-caso concurrentes con keys distintas -> 1 OK, 1 con 409", async () => {
    await limpiarAsignacionesDelCurso(cursoSimpleId)
    const asignacionId = await seedAsignado(colaboradorPart1Id, cursoSimpleId)
    await prisma.asignacionCurso.update({
      where: { id: asignacionId },
      data: { estadoAsignado: "LISTO" },
    })

    const req1 = agenteAdmin
      .post(`/api/v1/asignaciones/${asignacionId}/cerrar-caso`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .set("Idempotency-Key", randomUUID())
      .send({ resultado: "APTO" })
    const req2 = agenteAdmin
      .post(`/api/v1/asignaciones/${asignacionId}/cerrar-caso`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .set("Idempotency-Key", randomUUID())
      .send({ resultado: "NO_APTO" })

    const [r1, r2] = await Promise.all([req1, req2])
    const statuses = [r1.status, r2.status].sort()
    // Uno tiene exito, el otro recibe 409 conflictAsignacionNoListoNiEnProgreso.
    expect(statuses).toEqual([200, 409])
    const conflict = r1.status === 409 ? r1 : r2
    expect((conflict.body as { code: string }).code).toBe(
      "CONFLICT_ASIGNACION_NO_LISTO_NI_EN_PROGRESO",
    )
  })
})
