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
  console.warn("asignaciones-resultado-historico.e2e: DATABASE_URL ausente — tests SKIP.")
}
if (HAS_DB_URL && !DIST_DISPONIBLE) {
  console.warn(
    "asignaciones-resultado-historico.e2e: dist/ no encontrado — ejecutar `pnpm --filter @nexott-learn/api build`. SKIP.",
  )
}

const RUN_E2E = HAS_DB_URL && DIST_DISPONIBLE

const ADMIN_EMAIL = "asig-p6c-admin@nttdata.test"
const PART1_EMAIL = "asig-p6c-part1@nttdata.test"
const PART2_EMAIL = "asig-p6c-part2@nttdata.test"
const PASSWORD = "AsignP6c1234!"
const CLIENTE_NOMBRE = "ACME P6c e2e"
const TITULO_PREFIX = "P6c-rh-"

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
    update: { nombre: `P6c ${rol}`, estadoEmpleado: "ACTIVO" },
    create: { email, nombre: `P6c ${rol}`, estadoEmpleado: "ACTIVO" },
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

describe.runIf(RUN_E2E)("asignaciones resultado + historico e2e (P6c)", () => {
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
  let cursoId: string
  let adminUsuarioId: string

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

    const adminUsuario = await prisma.usuario.findUniqueOrThrow({
      where: { colaboradorId: colaboradorAdminId },
      select: { id: true },
    })
    adminUsuarioId = adminUsuario.id

    const cliente = await prisma.cliente.upsert({
      where: { nombre: CLIENTE_NOMBRE },
      update: { activo: true, deletedAt: null },
      create: { nombre: CLIENTE_NOMBRE, activo: true },
      select: { id: true },
    })
    clienteId = cliente.id

    const curso = await prisma.curso.create({
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
    cursoId = curso.id

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
      if (cursoId) {
        await prisma.historicoEstadoAsignacion.deleteMany({
          where: { asignacion: { cursoId } },
        })
        await prisma.asignacionCurso.deleteMany({ where: { cursoId } })
        await prisma.curso.deleteMany({ where: { id: cursoId } })
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
          where: { usuario: { colaboradorId: { in: colaboradorIds } } },
        })
        await prisma.usuario.deleteMany({ where: { colaboradorId: { in: colaboradorIds } } })
        await prisma.colaborador.deleteMany({ where: { id: { in: colaboradorIds } } })
      }
    } catch (error) {
      const detalle = error instanceof Error ? error.message : String(error)
      console.warn(`asignaciones-resultado-historico.e2e cleanup fallo: ${detalle}`)
    }
    if (app) {
      await app.close()
    }
    if (prisma) {
      await prisma.$disconnect()
    }
  })

  async function seedAsignadoEnEstado(
    colaboradorId: string,
    estado: "APTO" | "NO_APTO" | "EN_PROGRESO" | "ASIGNADO",
  ): Promise<string> {
    const row = await prisma.asignacionCurso.create({
      data: {
        cursoId,
        colaboradorId,
        rol: "ASIGNADO",
        estadoAsignado: estado,
        fechaCierre: estado === "APTO" || estado === "NO_APTO" ? new Date() : null,
      },
      select: { id: true },
    })
    return row.id
  }

  async function seedVoluntario(colaboradorId: string): Promise<string> {
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

  async function limpiar(): Promise<void> {
    await prisma.historicoEstadoAsignacion.deleteMany({
      where: { asignacion: { cursoId } },
    })
    await prisma.asignacionCurso.deleteMany({ where: { cursoId } })
  }

  // ===== PATCH resultado-entrevista-cliente =====

  it("PATCH happy path: ADMIN sobre APTO -> 200 PASO + audit log creado", async () => {
    await limpiar()
    const asignacionId = await seedAsignadoEnEstado(colaboradorPart1Id, "APTO")

    const res = await agenteAdmin
      .patch(`/api/v1/asignaciones/${asignacionId}/resultado-entrevista-cliente`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .send({ resultadoEntrevistaCliente: "PASO" })

    expect(res.status).toBe(200)
    const body = res.body as { resultadoEntrevistaCliente: string }
    expect(body.resultadoEntrevistaCliente).toBe("PASO")

    const audit = await prisma.activityLog.findFirst({
      where: {
        usuarioId: adminUsuarioId,
        accion: "RESULTADO_ENTREVISTA_CLIENTE_REGISTRADO",
        recursoId: asignacionId,
      },
      orderBy: { createdAt: "desc" },
    })
    expect(audit).not.toBeNull()
  })

  it("PATCH 422 VALIDACION_RESULTADO_SOLO_ASIGNADO sobre VOLUNTARIO", async () => {
    await limpiar()
    const asignacionId = await seedVoluntario(colaboradorPart2Id)

    const res = await agenteAdmin
      .patch(`/api/v1/asignaciones/${asignacionId}/resultado-entrevista-cliente`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .send({ resultadoEntrevistaCliente: "PASO" })

    expect(res.status).toBe(422)
    expect((res.body as { code: string }).code).toBe("VALIDACION_RESULTADO_SOLO_ASIGNADO")
  })

  it("PATCH 422 VALIDACION_ASIGNACION_NO_CERRADA sobre ASIGNADO en EN_PROGRESO", async () => {
    await limpiar()
    const asignacionId = await seedAsignadoEnEstado(colaboradorPart1Id, "EN_PROGRESO")

    const res = await agenteAdmin
      .patch(`/api/v1/asignaciones/${asignacionId}/resultado-entrevista-cliente`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .send({ resultadoEntrevistaCliente: "PASO" })

    expect(res.status).toBe(422)
    expect((res.body as { code: string }).code).toBe("VALIDACION_ASIGNACION_NO_CERRADA")
  })

  // ===== GET historico-estados =====

  it("GET historico admin: dos transiciones -> 2 entradas DESC", async () => {
    await limpiar()
    const asignacionId = await seedAsignadoEnEstado(colaboradorPart1Id, "ASIGNADO")

    // Transicion 1: iniciar-progreso
    const r1 = await agenteAdmin
      .post(`/api/v1/asignaciones/${asignacionId}/iniciar-progreso`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .send({})
    expect(r1.status).toBe(200)

    // Transicion 2: marcar-listo
    const r2 = await agenteAdmin
      .post(`/api/v1/asignaciones/${asignacionId}/marcar-listo`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .send({})
    expect(r2.status).toBe(200)

    const res = await agenteAdmin
      .get(`/api/v1/asignaciones/${asignacionId}/historico-estados`)
      .set("X-XSRF-TOKEN", csrfAdmin)

    expect(res.status).toBe(200)
    const body = res.body as {
      data: Array<{ estadoAnterior: string; estadoNuevo: string; fecha: string }>
      meta: { total: number }
    }
    expect(body.meta.total).toBe(2)
    expect(body.data).toHaveLength(2)
    // Ordenado DESC: la mas reciente primero (marcar-listo: EN_PROGRESO -> LISTO).
    expect(body.data[0]?.estadoNuevo).toBe("ASIGNADO:LISTO")
    expect(body.data[1]?.estadoNuevo).toBe("ASIGNADO:EN_PROGRESO")
  })

  it("GET historico participante propio: 200 con sus entradas", async () => {
    await limpiar()
    const asignacionId = await seedAsignadoEnEstado(colaboradorPart1Id, "ASIGNADO")

    // Una transicion para tener algo en el historico.
    await agenteAdmin
      .post(`/api/v1/asignaciones/${asignacionId}/iniciar-progreso`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .send({})

    const res = await agentePart1
      .get(`/api/v1/asignaciones/${asignacionId}/historico-estados`)
      .set("X-XSRF-TOKEN", csrfPart1)

    expect(res.status).toBe(200)
    const body = res.body as { meta: { total: number } }
    expect(body.meta.total).toBe(1)
  })

  it("GET historico participante ajeno: 404 ASIGNACION_NO_ENCONTRADA (D-AS-9, NO 403)", async () => {
    await limpiar()
    const asignacionId = await seedAsignadoEnEstado(colaboradorPart1Id, "ASIGNADO")

    const res = await agentePart2
      .get(`/api/v1/asignaciones/${asignacionId}/historico-estados`)
      .set("X-XSRF-TOKEN", csrfPart2)

    expect(res.status).toBe(404)
    expect((res.body as { code: string }).code).toBe("ASIGNACION_NO_ENCONTRADA")
  })
})
