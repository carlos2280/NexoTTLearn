// biome-ignore lint/correctness/noNodejsModules: crypto.randomUUID para generar Idempotency-Key en tests.
import { randomUUID } from "node:crypto"
// biome-ignore lint/correctness/noNodejsModules: el harness e2e necesita filesystem para detectar dist/.
import { existsSync } from "node:fs"
// biome-ignore lint/correctness/noNodejsModules: idem.
import { join, resolve } from "node:path"
import type { INestApplication, Type } from "@nestjs/common"
import { type Prisma, PrismaClient } from "@prisma/client"
import bcrypt from "bcrypt"
import supertest, { type Agent, type Response } from "supertest"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

const HAS_DB_URL = Boolean(process.env.DATABASE_URL)
const DIST_DIR = resolve(__dirname, "..", "dist")
const DIST_DISPONIBLE = existsSync(join(DIST_DIR, "app.module.js"))

if (!HAS_DB_URL) {
  console.warn("evaluacion-inicial-aplicar.e2e: DATABASE_URL ausente — tests SKIP.")
}
if (HAS_DB_URL && !DIST_DISPONIBLE) {
  console.warn(
    "evaluacion-inicial-aplicar.e2e: dist/ no encontrado — ejecutar `pnpm --filter @nexott-learn/api build`. SKIP.",
  )
}
const RUN_E2E = HAS_DB_URL && DIST_DISPONIBLE

const ADMIN_EMAIL = "evalini-admin-p5c@nttdata.test"
const PARTICIPANTE_EMAIL = "evalini-part-p5c@nttdata.test"
const PARTICIPANTE_2_EMAIL = "evalini-part2-p5c@nttdata.test"
const PASSWORD = "Evalini1234!"
const PREFIX = "P5c-eval-"
const CLIENTE_NOMBRE = "ACME P5c eval"
const MIME_XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

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

describe.runIf(RUN_E2E)("evaluacion-inicial e2e (P5c — aplicar + PATCH ficha + historial)", () => {
  let app: INestApplication
  let prisma: PrismaClient
  let agenteAdmin: Agent
  let agentePart: Agent
  let cursoId: string
  let cursoOtroId: string
  let adminUsuarioId: string
  let participanteColabId: string
  let participante2ColabId: string
  let skillId: string
  let archivoId: string
  let csrfAdmin: string
  let csrfPart: string
  // ThrottlerStorageFake con .reset() (FIX-P5-cierre §5.69) — se inicializa
  // en beforeAll y se reasigna a esta variable de scope describe.
  let throttlerStorageFake: { reset: () => void }

  async function nuevoArchivoSemilla(): Promise<string> {
    const archivo = await prisma.archivo.create({
      data: {
        tipo: "EVALUACION_INICIAL_EXCEL",
        path: `EVALUACION_INICIAL_EXCEL/p5c/${randomUUID()}.xlsx`,
        mimeType: MIME_XLSX,
        tamanioBytes: 1,
        subidoPorUsuarioId: adminUsuarioId,
        metadata: { nombreOriginal: "carga-test.xlsx" },
      },
      select: { id: true },
    })
    return archivo.id
  }

  async function nuevoPreviewSemilla(opts?: {
    cursoIdOverride?: string
    cambios?: ReadonlyArray<{ colaboradorId: string; skillId: string; valorNuevo: number }>
    rechazos?: Prisma.InputJsonValue[]
    expirado?: boolean
  }): Promise<{ previewId: string; archivoId: string }> {
    const archId = await nuevoArchivoSemilla()
    const cambios: Prisma.InputJsonValue[] = (opts?.cambios ?? []).map((c) => ({
      colaboradorId: c.colaboradorId,
      email: "x@y.test",
      nombreColaborador: "X",
      skillId: c.skillId,
      etiquetaSkill: "skill",
      valorAnterior: null,
      valorNuevo: c.valorNuevo,
      fuente: "SKILL_DIRECTA",
    }))
    const skillIds = (opts?.cambios ?? []).map((c) => c.skillId)
    const colabIds = (opts?.cambios ?? []).map((c) => c.colaboradorId)
    const expiraEn = opts?.expirado
      ? new Date(Date.now() - 60 * 1000)
      : new Date(Date.now() + 30 * 60 * 1000)
    const preview = await prisma.previewEvaluacionInicial.create({
      data: {
        cursoId: opts?.cursoIdOverride ?? cursoId,
        archivoId: archId,
        creadoPorUsuarioId: adminUsuarioId,
        expiraEn,
        resumen: {
          filasTotales: cambios.length,
          filasValidas: cambios.length,
          filasRechazadas: opts?.rechazos?.length ?? 0,
          skillsAfectadas: new Set(skillIds).size,
          colaboradoresAfectados: new Set(colabIds).size,
        },
        cambios,
        rechazos: opts?.rechazos ?? [],
      },
      select: { id: true, archivoId: true },
    })
    return { previewId: preview.id, archivoId: preview.archivoId }
  }

  beforeAll(async () => {
    prisma = new PrismaClient()
    try {
      await prisma.$queryRaw`SELECT 1`
    } catch (error) {
      const detalle = error instanceof Error ? error.message : String(error)
      throw new Error(`No se pudo conectar a la BD para los e2e: ${detalle}`)
    }

    const passwordHash = await bcrypt.hash(PASSWORD, 12)
    const colAdmin = await prisma.colaborador.upsert({
      where: { email: ADMIN_EMAIL },
      update: { nombre: "P5c Admin", estadoEmpleado: "ACTIVO" },
      create: { email: ADMIN_EMAIL, nombre: "P5c Admin", estadoEmpleado: "ACTIVO" },
      select: { id: true },
    })
    const usrAdmin = await prisma.usuario.upsert({
      where: { colaboradorId: colAdmin.id },
      update: {
        passwordHash,
        rol: "ADMIN",
        requiereCambioPassword: false,
        passwordInicialCaduca: null,
        bloqueado: false,
        intentosFallidos: 0,
        mfaHabilitado: false,
        requiereSetupMfa: false,
      },
      create: {
        colaboradorId: colAdmin.id,
        rol: "ADMIN",
        passwordHash,
        requiereCambioPassword: false,
        bloqueado: false,
        intentosFallidos: 0,
        mfaHabilitado: false,
      },
      select: { id: true },
    })
    adminUsuarioId = usrAdmin.id

    const colPart = await prisma.colaborador.upsert({
      where: { email: PARTICIPANTE_EMAIL },
      update: { nombre: "P5c Part", estadoEmpleado: "ACTIVO" },
      create: { email: PARTICIPANTE_EMAIL, nombre: "P5c Part", estadoEmpleado: "ACTIVO" },
      select: { id: true },
    })
    participanteColabId = colPart.id
    await prisma.usuario.upsert({
      where: { colaboradorId: colPart.id },
      update: {
        passwordHash,
        rol: "PARTICIPANTE",
        requiereCambioPassword: false,
        passwordInicialCaduca: null,
        bloqueado: false,
        intentosFallidos: 0,
        mfaHabilitado: false,
        requiereSetupMfa: false,
      },
      create: {
        colaboradorId: colPart.id,
        rol: "PARTICIPANTE",
        passwordHash,
        requiereCambioPassword: false,
        bloqueado: false,
        intentosFallidos: 0,
        mfaHabilitado: false,
      },
    })

    const colPart2 = await prisma.colaborador.upsert({
      where: { email: PARTICIPANTE_2_EMAIL },
      update: { nombre: "P5c Part 2", estadoEmpleado: "ACTIVO" },
      create: { email: PARTICIPANTE_2_EMAIL, nombre: "P5c Part 2", estadoEmpleado: "ACTIVO" },
      select: { id: true },
    })
    participante2ColabId = colPart2.id

    const cliente = await prisma.cliente.upsert({
      where: { nombre: CLIENTE_NOMBRE },
      update: { activo: true, deletedAt: null },
      create: { nombre: CLIENTE_NOMBRE, activo: true },
      select: { id: true },
    })

    // Limpieza defensiva por si una corrida anterior dejo leftovers. Orden
    // critico: previews -> cargas -> asignaciones -> curso (FKs encadenadas).
    const cursosPrev = await prisma.curso.findMany({
      where: { titulo: { contains: PREFIX } },
      select: { id: true },
    })
    const cursoIdsPrev = cursosPrev.map((c) => c.id)
    if (cursoIdsPrev.length > 0) {
      await prisma.$executeRaw`DELETE FROM previews_evaluacion_inicial WHERE curso_id = ANY(${cursoIdsPrev}::uuid[])`
      await prisma.$executeRaw`DELETE FROM cargas_evaluacion_inicial WHERE curso_id = ANY(${cursoIdsPrev}::uuid[])`
      await prisma.asignacionCurso.deleteMany({ where: { cursoId: { in: cursoIdsPrev } } })
      await prisma.curso.deleteMany({ where: { id: { in: cursoIdsPrev } } })
    }
    await prisma.skill.deleteMany({ where: { etiquetaVisible: { contains: PREFIX } } })
    await prisma.area.deleteMany({ where: { nombre: { contains: PREFIX } } })

    const area = await prisma.area.create({
      data: { nombre: `${PREFIX}backend`, descripcion: "Area P5c" },
      select: { id: true },
    })
    const skill = await prisma.skill.create({
      data: { etiquetaVisible: `${PREFIX}python.fastapi`, areaId: area.id, estado: "ACTIVA" },
      select: { id: true },
    })
    skillId = skill.id

    const cursoListo = await prisma.curso.create({
      data: {
        titulo: `${PREFIX}listo`,
        clienteId: cliente.id,
        estado: "BORRADOR",
        fechaInicio: new Date("2026-04-01T00:00:00Z"),
        fechaDeadline: new Date("2026-06-30T00:00:00Z"),
        areasExigidas: { create: [{ areaId: area.id, peso: 100, puntajeObjetivo: 80 }] },
        skillsExigidas: { create: [{ skillId: skill.id, notaMinima: 70 }] },
      },
      select: { id: true },
    })
    cursoId = cursoListo.id

    const cursoOtro = await prisma.curso.create({
      data: {
        titulo: `${PREFIX}otro`,
        clienteId: cliente.id,
        estado: "BORRADOR",
        fechaInicio: new Date("2026-04-01T00:00:00Z"),
        fechaDeadline: new Date("2026-06-30T00:00:00Z"),
      },
      select: { id: true },
    })
    cursoOtroId = cursoOtro.id

    await prisma.asignacionCurso.createMany({
      data: [
        {
          colaboradorId: colPart.id,
          cursoId: cursoListo.id,
          rol: "ASIGNADO",
          estadoAsignado: "ASIGNADO",
        },
        {
          colaboradorId: colPart2.id,
          cursoId: cursoListo.id,
          rol: "ASIGNADO",
          estadoAsignado: "EN_PROGRESO",
        },
      ],
    })

    archivoId = await nuevoArchivoSemilla()

    await prisma.$executeRaw`
      DELETE FROM sesiones
      WHERE (sess::jsonb->>'usuarioId') IN (
        SELECT id::text FROM usuarios WHERE colaborador_id IN (${colAdmin.id}::uuid, ${colPart.id}::uuid)
      )
    `

    const moduleApp = (await import(join(DIST_DIR, "app.module.js"))) as ModuloApp
    const moduleHttp = (await import(join(DIST_DIR, "bootstrap-http.js"))) as ModuloHttp
    const { Test } = await import("@nestjs/testing")
    const { ThrottlerGuard, ThrottlerStorage } = await import("@nestjs/throttler")
    const { ThrottlerStorageFake } = await import("./throttler-storage-fake.js")
    throttlerStorageFake = new ThrottlerStorageFake()
    const throttlerSiempreOk = { canActivate: (): boolean => true }
    const moduleRef = await Test.createTestingModule({ imports: [moduleApp.AppModule] })
      .overrideGuard(ThrottlerGuard)
      .useValue(throttlerSiempreOk)
      .overrideProvider(ThrottlerStorage)
      .useValue(throttlerStorageFake)
      .compile()
    app = moduleRef.createNestApplication()
    moduleHttp.configurarHttp(app)
    await app.init()
    agenteAdmin = supertest.agent(app.getHttpServer())
    agentePart = supertest.agent(app.getHttpServer())
    csrfAdmin = await loginYObtenerCsrf(agenteAdmin, ADMIN_EMAIL)
    csrfPart = await loginYObtenerCsrf(agentePart, PARTICIPANTE_EMAIL)
  }, 60_000)

  afterAll(async () => {
    try {
      const cursosBorrar = await prisma.curso.findMany({
        where: { titulo: { contains: PREFIX } },
        select: { id: true },
      })
      const ids = cursosBorrar.map((c) => c.id)
      if (ids.length > 0) {
        // Orden de borrado: primero previews (cuyo `aplicado_por_carga_id` apunta
        // a cargas), luego cargas, luego asignaciones, luego curso.
        await prisma.$executeRaw`DELETE FROM previews_evaluacion_inicial WHERE curso_id = ANY(${ids}::uuid[])`
        await prisma.$executeRaw`DELETE FROM cargas_evaluacion_inicial WHERE curso_id = ANY(${ids}::uuid[])`
        await prisma.asignacionCurso.deleteMany({ where: { cursoId: { in: ids } } })
        await prisma.curso.deleteMany({ where: { id: { in: ids } } })
      }
      const colIds = [participanteColabId, participante2ColabId]
      await prisma.notaSkill.deleteMany({ where: { colaboradorId: { in: colIds } } })
      await prisma.idempotencyKey.deleteMany({
        where: { scope: "evaluacion-inicial.aplicar" },
      })
      await prisma.$executeRaw`
        DELETE FROM archivos
        WHERE subido_por_usuario_id = ${adminUsuarioId}::uuid
      `
      await prisma.skill.deleteMany({
        where: { etiquetaVisible: { contains: PREFIX } },
      })
      await prisma.area.deleteMany({ where: { nombre: { contains: PREFIX } } })
      const cli = await prisma.cliente.findUnique({
        where: { nombre: CLIENTE_NOMBRE },
        select: { id: true },
      })
      if (cli) {
        await prisma.cliente.delete({ where: { id: cli.id } })
      }
      const cols = await prisma.colaborador.findMany({
        where: { email: { in: [ADMIN_EMAIL, PARTICIPANTE_EMAIL, PARTICIPANTE_2_EMAIL] } },
        select: { id: true },
      })
      const allColIds = cols.map((c) => c.id)
      if (allColIds.length > 0) {
        await prisma.$executeRaw`
          DELETE FROM sesiones
          WHERE (sess::jsonb->>'usuarioId') IN (
            SELECT id::text FROM usuarios WHERE colaborador_id = ANY(${allColIds}::uuid[])
          )
        `
        await prisma.usuario.deleteMany({ where: { colaboradorId: { in: allColIds } } })
        await prisma.colaborador.deleteMany({ where: { id: { in: allColIds } } })
      }
    } catch (error) {
      const detalle = error instanceof Error ? error.message : String(error)
      console.warn(`evaluacion-inicial-aplicar e2e cleanup fallo: ${detalle}`)
    }
    if (app) {
      await app.close()
    }
    if (prisma) {
      await prisma.$disconnect()
    }
  })

  // =============================================================================
  // POST /aplicar
  // =============================================================================

  it("ADMIN POST aplicar happy path: 200, notas + historico + carga persistidos", async () => {
    const { previewId } = await nuevoPreviewSemilla({
      cambios: [{ colaboradorId: participanteColabId, skillId, valorNuevo: 85 }],
    })
    const key = randomUUID()
    const res = await agenteAdmin
      .post(`/api/v1/cursos/${cursoId}/evaluacion-inicial/${previewId}/aplicar`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .set("Idempotency-Key", key)
      .send({ recalcularPlanes: false })
    expect(res.status).toBe(200)
    const body = res.body as {
      aplicado: boolean
      skillsActualizadas: number
      colaboradoresActualizados: number
      planesRecalculados: number
      cargaId: string
    }
    expect(body.aplicado).toBe(true)
    expect(body.skillsActualizadas).toBe(1)
    expect(body.colaboradoresActualizados).toBe(1)
    expect(body.planesRecalculados).toBe(0)
    expect(body.cargaId).toBeTruthy()

    const nota = await prisma.notaSkill.findUnique({
      where: {
        // biome-ignore lint/style/useNamingConvention: clave compuesta generada por Prisma.
        colaboradorId_skillId: { colaboradorId: participanteColabId, skillId },
      },
      select: { notaActual: true, origenActual: true },
    })
    expect(nota?.notaActual?.toString()).toBe("85")
    expect(nota?.origenActual).toMatchObject({ origen: "ENTREVISTA_INICIAL" })

    const carga = await prisma.cargaEvaluacionInicial.findUnique({
      where: { id: body.cargaId },
      select: { previewId: true, skillsActualizadas: true },
    })
    expect(carga?.previewId).toBe(previewId)
    expect(carga?.skillsActualizadas).toBe(1)

    const historico = await prisma.historicoNotaSkill.findMany({
      where: { autorUsuarioId: adminUsuarioId, origen: "ENTREVISTA_INICIAL" },
      select: { valor: true, origen: true },
    })
    expect(historico.length).toBeGreaterThan(0)

    const log = await prisma.activityLog.findFirst({
      where: { accion: "EVALUACION_APLICADA", recursoId: cursoId },
      orderBy: { createdAt: "desc" },
      select: { metadata: true },
    })
    expect(log?.metadata).toMatchObject({ previewId, cargaId: body.cargaId })
  })

  it("ADMIN POST aplicar idempotency replay: misma key + mismo body devuelve mismo response sin alterar BD", async () => {
    const { previewId } = await nuevoPreviewSemilla({
      cambios: [{ colaboradorId: participante2ColabId, skillId, valorNuevo: 60 }],
    })
    const key = randomUUID()
    const body = { recalcularPlanes: false }
    const primero = await agenteAdmin
      .post(`/api/v1/cursos/${cursoId}/evaluacion-inicial/${previewId}/aplicar`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .set("Idempotency-Key", key)
      .send(body)
    expect(primero.status).toBe(200)
    const cargasAntes = await prisma.cargaEvaluacionInicial.count({ where: { previewId } })

    const segundo = await agenteAdmin
      .post(`/api/v1/cursos/${cursoId}/evaluacion-inicial/${previewId}/aplicar`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .set("Idempotency-Key", key)
      .send(body)
    expect(segundo.status).toBe(200)
    expect(segundo.body).toEqual(primero.body)
    const cargasDespues = await prisma.cargaEvaluacionInicial.count({ where: { previewId } })
    expect(cargasDespues).toBe(cargasAntes)
  })

  it("ADMIN POST aplicar idempotency conflict: misma key + body distinto -> 409", async () => {
    const { previewId } = await nuevoPreviewSemilla({
      cambios: [{ colaboradorId: participanteColabId, skillId, valorNuevo: 77 }],
    })
    const key = randomUUID()
    const primero = await agenteAdmin
      .post(`/api/v1/cursos/${cursoId}/evaluacion-inicial/${previewId}/aplicar`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .set("Idempotency-Key", key)
      .send({ recalcularPlanes: false })
    expect(primero.status).toBe(200)
    const segundo = await agenteAdmin
      .post(`/api/v1/cursos/${cursoId}/evaluacion-inicial/${previewId}/aplicar`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .set("Idempotency-Key", key)
      .send({ recalcularPlanes: true })
    expect(segundo.status).toBe(409)
    expect((segundo.body as { code: string }).code).toBe(
      "CONFLICT_IDEMPOTENCY_KEY_REUSADA_CON_BODY_DISTINTO",
    )
  })

  it("ADMIN POST aplicar preview con rechazos: 422 sin escribir nada", async () => {
    // Los 3 tests anteriores consumieron los 5 tokens del bucket `short`.
    // ThrottlerStorageFake nos permite resetear el bucket sin esperar 60s
    // (FIX-P5-cierre §5.69; antes habia un setTimeout(61_000)).
    throttlerStorageFake.reset()
    const { previewId } = await nuevoPreviewSemilla({
      cambios: [],
      rechazos: [
        { fila: 2, email: "x@y.test", errores: [{ celda: "B2", codigo: "X", mensaje: "x" }] },
      ],
    })
    const res = await agenteAdmin
      .post(`/api/v1/cursos/${cursoId}/evaluacion-inicial/${previewId}/aplicar`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .set("Idempotency-Key", randomUUID())
      .send({})
    expect(res.status).toBe(422)
    expect((res.body as { code: string }).code).toBe("VALIDACION_PREVIEW_CON_RECHAZOS")
    const previewRow = await prisma.previewEvaluacionInicial.findUnique({
      where: { id: previewId },
      select: { aplicadoEn: true },
    })
    expect(previewRow?.aplicadoEn).toBeNull()
  }, 90_000)

  it("ADMIN POST aplicar cross-curso: preview de curso A aplicado desde curso B -> 404", async () => {
    const { previewId } = await nuevoPreviewSemilla({ cambios: [] })
    const res = await agenteAdmin
      .post(`/api/v1/cursos/${cursoOtroId}/evaluacion-inicial/${previewId}/aplicar`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .set("Idempotency-Key", randomUUID())
      .send({})
    expect(res.status).toBe(404)
    expect((res.body as { code: string }).code).toBe("PREVIEW_NO_ENCONTRADO")
  })

  it("ADMIN POST aplicar sin Idempotency-Key: 400 IDEMPOTENCY_KEY_REQUERIDA", async () => {
    const { previewId } = await nuevoPreviewSemilla({ cambios: [] })
    const res = await agenteAdmin
      .post(`/api/v1/cursos/${cursoId}/evaluacion-inicial/${previewId}/aplicar`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .send({})
    expect(res.status).toBe(400)
    expect((res.body as { code: string }).code).toBe("IDEMPOTENCY_KEY_REQUERIDA")
  })

  // =============================================================================
  // PATCH /colaboradores/:id/ficha/skills/:skillId
  // =============================================================================

  it("ADMIN PATCH ficha skill happy path: 200 con response y audit log", async () => {
    const res = await agenteAdmin
      .patch(`/api/v1/colaboradores/${participanteColabId}/ficha/skills/${skillId}`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .set("X-Motivo", "Correccion tras revision con el cliente")
      .send({ valor: 92 })
    expect(res.status).toBe(200)
    const body = res.body as {
      colaboradorId: string
      skillId: string
      notaActual: number
      origenActual: string
    }
    expect(body.colaboradorId).toBe(participanteColabId)
    expect(body.notaActual).toBe(92)
    expect(body.origenActual).toBe("MANUAL")

    const nota = await prisma.notaSkill.findUnique({
      where: {
        // biome-ignore lint/style/useNamingConvention: clave compuesta generada por Prisma.
        colaboradorId_skillId: { colaboradorId: participanteColabId, skillId },
      },
      select: { notaActual: true, origenActual: true },
    })
    expect(nota?.notaActual?.toString()).toBe("92")
    expect(nota?.origenActual).toMatchObject({ origen: "MANUAL" })

    const log = await prisma.activityLog.findFirst({
      where: { accion: "NOTA_SKILL_EDITADA_MANUALMENTE", recursoId: participanteColabId },
      orderBy: { createdAt: "desc" },
      select: { metadata: true },
    })
    expect(log?.metadata).toMatchObject({ skillId, valorNuevo: 92 })
  })

  it("PARTICIPANTE PATCH ficha skill: 403", async () => {
    const res = await agentePart
      .patch(`/api/v1/colaboradores/${participanteColabId}/ficha/skills/${skillId}`)
      .set("X-XSRF-TOKEN", csrfPart)
      .set("X-Motivo", "intento")
      .send({ valor: 50 })
    expect(res.status).toBe(403)
  })

  it("ADMIN PATCH ficha skill sin X-Motivo: 422 MOTIVO_REQUERIDO", async () => {
    const res = await agenteAdmin
      .patch(`/api/v1/colaboradores/${participanteColabId}/ficha/skills/${skillId}`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .send({ valor: 30 })
    expect(res.status).toBe(422)
    expect((res.body as { code: string }).code).toBe("MOTIVO_REQUERIDO")
  })

  // =============================================================================
  // GET /historial
  // =============================================================================

  it("ADMIN GET historial: lista paginada ordenada por createdAt DESC", async () => {
    const res = await agenteAdmin
      .get(`/api/v1/cursos/${cursoId}/evaluacion-inicial/historial?page=1&pageSize=10`)
      .set("X-XSRF-TOKEN", csrfAdmin)
    expect(res.status).toBe(200)
    const body = res.body as {
      data: { cargaId: string; previewId: string; aplicadoPor: { nombre: string } }[]
      meta: { total: number; page: number; pageSize: number }
    }
    expect(body.meta.page).toBe(1)
    expect(body.meta.pageSize).toBe(10)
    // Las cargas previas fueron creadas en los tests de aplicar. Debe haber >=1.
    expect(body.meta.total).toBeGreaterThanOrEqual(1)
    expect(body.data[0]?.aplicadoPor.nombre).toBe("P5c Admin")
  })

  it("ADMIN GET historial: curso sin cargas devuelve data vacio y total 0", async () => {
    const res = await agenteAdmin
      .get(`/api/v1/cursos/${cursoOtroId}/evaluacion-inicial/historial?page=1&pageSize=20`)
      .set("X-XSRF-TOKEN", csrfAdmin)
    expect(res.status).toBe(200)
    const body = res.body as {
      data: unknown[]
      meta: { total: number; totalPages: number }
    }
    expect(body.data).toEqual([])
    expect(body.meta.total).toBe(0)
    expect(body.meta.totalPages).toBe(0)
    // Silenciar warning sobre archivoId no usado en este test.
    expect(archivoId).toBeTruthy()
  })
})
