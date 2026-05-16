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
  console.warn("asignaciones.e2e.spec: DATABASE_URL ausente — tests SKIP.")
}
if (HAS_DB_URL && !DIST_DISPONIBLE) {
  console.warn(
    "asignaciones.e2e.spec: dist/ no encontrado — ejecutar `pnpm --filter @nexott-learn/api build`. SKIP.",
  )
}

const RUN_E2E = HAS_DB_URL && DIST_DISPONIBLE

const ADMIN_EMAIL = "asig-admin-p6a@nttdata.test"
const PARTICIPANTE_EMAIL = "asig-part-p6a@nttdata.test"
const PARTICIPANTE2_EMAIL = "asig-part2-p6a@nttdata.test"
const COLAB_EXTRA_EMAIL = "asig-extra-p6a@nttdata.test"
const COLAB_EX_EMAIL = "asig-ex-p6a@nttdata.test"
const PASSWORD = "Asign1234!"
const CLIENTE_NOMBRE = "ACME P6a e2e"
const TITULO_PREFIX = "P6a-asig-"

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
    update: { nombre: `P6a ${rol}`, estadoEmpleado: "ACTIVO" },
    create: { email, nombre: `P6a ${rol}`, estadoEmpleado: "ACTIVO" },
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

describe.runIf(RUN_E2E)("asignaciones e2e (P6a)", () => {
  let app: INestApplication
  let agenteAdmin: Agent
  let agentePart: Agent
  let agentePart2: Agent
  let csrfAdmin: string
  let csrfPart2: string
  let prisma: PrismaClient
  let clienteId: string
  let colaboradorAdminId: string
  let colaboradorPartId: string
  let colaboradorPart2Id: string
  let colaboradorExtraId: string
  let colaboradorExId: string
  let cursoActivoId: string
  let cursoBorradorId: string
  let cursoSinVoluntariosId: string

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
    colaboradorPartId = await upsertUsuario(
      prisma,
      PARTICIPANTE_EMAIL,
      "PARTICIPANTE",
      passwordHash,
    )
    colaboradorPart2Id = await upsertUsuario(
      prisma,
      PARTICIPANTE2_EMAIL,
      "PARTICIPANTE",
      passwordHash,
    )

    const extra = await prisma.colaborador.upsert({
      where: { email: COLAB_EXTRA_EMAIL },
      update: { nombre: "P6a Extra", estadoEmpleado: "ACTIVO" },
      create: { email: COLAB_EXTRA_EMAIL, nombre: "P6a Extra", estadoEmpleado: "ACTIVO" },
      select: { id: true },
    })
    colaboradorExtraId = extra.id

    const ex = await prisma.colaborador.upsert({
      where: { email: COLAB_EX_EMAIL },
      update: { nombre: "P6a ExEmpleado", estadoEmpleado: "EX_EMPLEADO" },
      create: { email: COLAB_EX_EMAIL, nombre: "P6a ExEmpleado", estadoEmpleado: "EX_EMPLEADO" },
      select: { id: true },
    })
    colaboradorExId = ex.id

    const cliente = await prisma.cliente.upsert({
      where: { nombre: CLIENTE_NOMBRE },
      update: { activo: true, deletedAt: null },
      create: { nombre: CLIENTE_NOMBRE, activo: true },
      select: { id: true },
    })
    clienteId = cliente.id

    // Curso ACTIVO con toggleVoluntarios=true
    const cursoActivo = await prisma.curso.create({
      data: {
        titulo: `${TITULO_PREFIX}activo`,
        clienteId,
        estado: "ACTIVO",
        fechaInicio: new Date("2026-06-01"),
        fechaDeadline: new Date("2026-08-01"),
        toggleVoluntarios: true,
      },
      select: { id: true },
    })
    cursoActivoId = cursoActivo.id

    const cursoBorrador = await prisma.curso.create({
      data: {
        titulo: `${TITULO_PREFIX}borrador`,
        clienteId,
        estado: "BORRADOR",
        fechaInicio: new Date("2026-06-01"),
        fechaDeadline: new Date("2026-08-01"),
        toggleVoluntarios: true,
      },
      select: { id: true },
    })
    cursoBorradorId = cursoBorrador.id

    const cursoSinVol = await prisma.curso.create({
      data: {
        titulo: `${TITULO_PREFIX}sin-vol`,
        clienteId,
        estado: "ACTIVO",
        fechaInicio: new Date("2026-06-01"),
        fechaDeadline: new Date("2026-08-01"),
        toggleVoluntarios: false,
      },
      select: { id: true },
    })
    cursoSinVoluntariosId = cursoSinVol.id

    // Limpiar sesiones previas y asignaciones de cursos de prueba
    await prisma.$executeRaw`
      DELETE FROM sesiones
      WHERE (sess::jsonb->>'usuarioId') IN (
        SELECT id::text FROM usuarios WHERE colaborador_id IN (
          ${colaboradorAdminId}::uuid,
          ${colaboradorPartId}::uuid,
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
    agentePart = supertest.agent(app.getHttpServer())
    agentePart2 = supertest.agent(app.getHttpServer())
    csrfAdmin = await loginYObtenerCsrf(agenteAdmin, ADMIN_EMAIL)
    await loginYObtenerCsrf(agentePart, PARTICIPANTE_EMAIL)
    csrfPart2 = await loginYObtenerCsrf(agentePart2, PARTICIPANTE2_EMAIL)
  }, 60_000)

  afterAll(async () => {
    try {
      const cursoIds = [cursoActivoId, cursoBorradorId, cursoSinVoluntariosId].filter(Boolean)
      if (cursoIds.length > 0) {
        await prisma.historicoEstadoAsignacion.deleteMany({
          where: { asignacion: { cursoId: { in: cursoIds } } },
        })
        await prisma.asignacionCurso.deleteMany({ where: { cursoId: { in: cursoIds } } })
        await prisma.curso.deleteMany({ where: { id: { in: cursoIds } } })
      }
      await prisma.cliente.deleteMany({ where: { nombre: CLIENTE_NOMBRE } })

      const colaboradorIds = [
        colaboradorAdminId,
        colaboradorPartId,
        colaboradorPart2Id,
        colaboradorExtraId,
        colaboradorExId,
      ].filter(Boolean)
      if (colaboradorIds.length > 0) {
        await prisma.$executeRaw`
          DELETE FROM sesiones
          WHERE (sess::jsonb->>'usuarioId') IN (
            SELECT id::text FROM usuarios WHERE colaborador_id = ANY(${colaboradorIds}::uuid[])
          )
        `
        await prisma.usuario.deleteMany({ where: { colaboradorId: { in: colaboradorIds } } })
        await prisma.colaborador.deleteMany({ where: { id: { in: colaboradorIds } } })
      }
    } catch (error) {
      const detalle = error instanceof Error ? error.message : String(error)
      console.warn(`asignaciones.e2e cleanup fallo (no rompe teardown): ${detalle}`)
    }
    if (app) {
      await app.close()
    }
    if (prisma) {
      await prisma.$disconnect()
    }
  })

  // ===== Alta admin batch =====

  it("POST /cursos/:id/asignaciones (curso CERRADO): 409 conflictCursoNoActivo", async () => {
    // Marca el curso BORRADOR como CERRADO temporalmente
    await prisma.curso.update({ where: { id: cursoBorradorId }, data: { estado: "CERRADO" } })
    const res = await agenteAdmin
      .post(`/api/v1/cursos/${cursoBorradorId}/asignaciones`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .send({ colaboradorIds: [colaboradorExtraId] })
    expect(res.status).toBe(409)
    expect((res.body as { code: string }).code).toBe("CONFLICT_CURSO_NO_ACTIVO")
    await prisma.curso.update({ where: { id: cursoBorradorId }, data: { estado: "BORRADOR" } })
  })

  it("POST /cursos/:id/asignaciones con OK + EX_EMPLEADO: 201 con creadas=1, rechazadas=1", async () => {
    const res = await agenteAdmin
      .post(`/api/v1/cursos/${cursoActivoId}/asignaciones`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .send({ colaboradorIds: [colaboradorPartId, colaboradorExId] })
    expect(res.status).toBe(201)
    const body = res.body as {
      creadas: Array<{ colaboradorId: string; rol: string; estadoAsignado: string }>
      rechazadas: Array<{ colaboradorId: string; motivo: string }>
    }
    expect(body.creadas).toHaveLength(1)
    expect(body.creadas[0]?.colaboradorId).toBe(colaboradorPartId)
    expect(body.creadas[0]?.rol).toBe("ASIGNADO")
    expect(body.creadas[0]?.estadoAsignado).toBe("ASIGNADO")
    expect(body.rechazadas).toEqual([{ colaboradorId: colaboradorExId, motivo: "EX_EMPLEADO" }])
  })

  // ===== Listados =====

  it("GET /cursos/:id/asignaciones (admin): lista las asignaciones del curso", async () => {
    const res = await agenteAdmin.get(`/api/v1/cursos/${cursoActivoId}/asignaciones`)
    expect(res.status).toBe(200)
    const body = res.body as { data: unknown[]; meta: { total: number } }
    expect(body.meta.total).toBeGreaterThanOrEqual(1)
  })

  it("GET /cursos/:id/asignaciones (PARTICIPANTE inscrito): devuelve UNA asignacion (la suya)", async () => {
    const res = await agentePart.get(`/api/v1/cursos/${cursoActivoId}/asignaciones`)
    expect(res.status).toBe(200)
    const body = res.body as {
      data: Array<{ colaboradorId: string }>
      meta: { total: number }
    }
    expect(body.meta.total).toBe(1)
    expect(body.data[0]?.colaboradorId).toBe(colaboradorPartId)
  })

  it("GET /cursos/:id/asignaciones (PARTICIPANTE no inscrito): 200 Paginated vacio", async () => {
    const res = await agentePart2.get(`/api/v1/cursos/${cursoActivoId}/asignaciones`)
    expect(res.status).toBe(200)
    const body = res.body as { data: unknown[]; meta: { total: number } }
    expect(body.data).toHaveLength(0)
    expect(body.meta.total).toBe(0)
  })

  it("GET /asignaciones/:id ajeno por PARTICIPANTE: 404 asignacionNoEncontrada", async () => {
    const propia = await prisma.asignacionCurso.findFirst({
      where: { cursoId: cursoActivoId, colaboradorId: colaboradorPartId },
      select: { id: true },
    })
    if (!propia) {
      throw new Error("Setup: no se encontro la asignacion previa")
    }
    const res = await agentePart2.get(`/api/v1/asignaciones/${propia.id}`)
    expect(res.status).toBe(404)
    expect((res.body as { code: string }).code).toBe("ASIGNACION_NO_ENCONTRADA")
  })

  // ===== Convertir voluntario→asignado =====

  it("POST /asignaciones/:id/convertir-a-asignado sin X-Motivo: 422 motivoRequerido", async () => {
    // crea un voluntario primero (colaboradorExtra se inscribe via Prisma directo)
    const vol = await prisma.asignacionCurso.create({
      data: {
        cursoId: cursoActivoId,
        colaboradorId: colaboradorExtraId,
        rol: "VOLUNTARIO",
        estadoVoluntario: "INSCRITO",
        origenVoluntario: "INICIATIVA",
        // CHECK chk_asig_resultado_solo_asignado prohibe valores no nulos en VOLUNTARIO.
        resultadoEntrevistaCliente: null,
      },
      select: { id: true },
    })
    const res = await agenteAdmin
      .post(`/api/v1/asignaciones/${vol.id}/convertir-a-asignado`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .send({})
    expect(res.status).toBe(422)
    expect((res.body as { code: string }).code).toBe("MOTIVO_REQUERIDO")
  })

  it("POST /asignaciones/:id/convertir-a-asignado sobre ASIGNADO: 409 conflictAsignacionNoVoluntario", async () => {
    const asig = await prisma.asignacionCurso.findFirst({
      where: { cursoId: cursoActivoId, colaboradorId: colaboradorPartId, rol: "ASIGNADO" },
      select: { id: true },
    })
    if (!asig) {
      throw new Error("Setup: no se encontro la asignacion previa")
    }
    const res = await agenteAdmin
      .post(`/api/v1/asignaciones/${asig.id}/convertir-a-asignado`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .set("X-Motivo", "Promovido por necesidad de cliente")
      .send({})
    expect(res.status).toBe(409)
    expect((res.body as { code: string }).code).toBe("CONFLICT_ASIGNACION_NO_VOLUNTARIO")
  })

  it("POST /asignaciones/:id/convertir-a-asignado happy path: 200 + historico nuevo", async () => {
    const vol = await prisma.asignacionCurso.findFirst({
      where: {
        cursoId: cursoActivoId,
        colaboradorId: colaboradorExtraId,
        rol: "VOLUNTARIO",
      },
      select: { id: true },
    })
    if (!vol) {
      throw new Error("Setup: voluntario no encontrado")
    }
    const historicoAntes = await prisma.historicoEstadoAsignacion.count({
      where: { asignacionId: vol.id },
    })
    const res = await agenteAdmin
      .post(`/api/v1/asignaciones/${vol.id}/convertir-a-asignado`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .set("X-Motivo", "Cliente requirio asignacion firme")
      .send({})
    expect(res.status).toBe(200)
    const body = res.body as { rol: string; estadoAsignado: string }
    expect(body.rol).toBe("ASIGNADO")
    expect(body.estadoAsignado).toBe("ASIGNADO")
    const historicoDespues = await prisma.historicoEstadoAsignacion.count({
      where: { asignacionId: vol.id },
    })
    expect(historicoDespues).toBe(historicoAntes + 1)
  })

  // ===== Bandeja del voluntario =====

  it("GET /cursos/disponibles-voluntario (PARTICIPANTE): lista cursos elegibles con voluntariosInscritos", async () => {
    // Part2 no esta inscrito en cursoActivo, asi que aparece en su bandeja
    const res = await agentePart2.get("/api/v1/cursos/disponibles-voluntario")
    expect(res.status).toBe(200)
    const body = res.body as {
      data: Array<{ cursoId: string; voluntariosInscritos: number }>
    }
    const item = body.data.find((c) => c.cursoId === cursoActivoId)
    expect(item).toBeDefined()
    expect(typeof item?.voluntariosInscritos).toBe("number")
  })

  // ===== Auto-inscripcion =====

  it("POST /cursos/:id/auto-inscripcion con toggleVoluntarios=false: 403 conflictAutoInscripcionDeshabilitada", async () => {
    const res = await agentePart2
      .post(`/api/v1/cursos/${cursoSinVoluntariosId}/auto-inscripcion`)
      .set("X-XSRF-TOKEN", csrfPart2)
      .send({ origenVoluntario: "INICIATIVA" })
    expect(res.status).toBe(403)
    expect((res.body as { code: string }).code).toBe("CONFLICT_AUTOINSCRIPCION_DESHABILITADA")
  })

  it("POST /cursos/:id/auto-inscripcion happy path: 201 rol=VOLUNTARIO estado=INSCRITO", async () => {
    const res = await agentePart2
      .post(`/api/v1/cursos/${cursoActivoId}/auto-inscripcion`)
      .set("X-XSRF-TOKEN", csrfPart2)
      .send({ origenVoluntario: "REUTILIZACION" })
    expect(res.status).toBe(201)
    const body = res.body as { rol: string; estadoVoluntario: string; origenVoluntario: string }
    expect(body.rol).toBe("VOLUNTARIO")
    expect(body.estadoVoluntario).toBe("INSCRITO")
    expect(body.origenVoluntario).toBe("REUTILIZACION")
  })

  it("POST /cursos/:id/auto-inscripcion repetido: 409 conflictAsignacionDuplicada", async () => {
    const res = await agentePart2
      .post(`/api/v1/cursos/${cursoActivoId}/auto-inscripcion`)
      .set("X-XSRF-TOKEN", csrfPart2)
      .send({ origenVoluntario: "INICIATIVA" })
    expect(res.status).toBe(409)
    expect((res.body as { code: string }).code).toBe("CONFLICT_ASIGNACION_DUPLICADA")
  })

  // ===== CHECK constraint en BD =====

  it("CHECK chk_asig_rol_estado: insert directo con rol=ASIGNADO + origenVoluntario falla", async () => {
    // Defensa en profundidad (D-AS-3): verifica que el constraint esta aplicado.
    await expect(
      prisma.$executeRaw`
        INSERT INTO asignaciones_curso (
          id, curso_id, colaborador_id, rol, estado_asignado, origen_voluntario,
          resultado_entrevista_cliente, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), ${cursoActivoId}::uuid, ${colaboradorAdminId}::uuid,
          'ASIGNADO', 'ASIGNADO', 'INICIATIVA', NULL, NOW(), NOW()
        )
      `,
    ).rejects.toThrow()
  })
})
