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

if (!HAS_DB_URL) {
  console.warn("transversal.e2e.spec: DATABASE_URL ausente — tests SKIP.")
}
if (HAS_DB_URL && !DIST_DISPONIBLE) {
  console.warn(
    "transversal.e2e.spec: dist/ no encontrado — ejecutar `pnpm --filter @nexott-learn/api build`. SKIP.",
  )
}

const RUN_E2E = HAS_DB_URL && DIST_DISPONIBLE

const ADMIN_EMAIL = "trans-admin-p8a@nttdata.test"
const PARTICIPANTE_EMAIL = "trans-part-p8a@nttdata.test"
const PARTICIPANTE2_EMAIL = "trans-part2-p8a@nttdata.test"
const PASSWORD = "Transv1234!"
const CLIENTE_NOMBRE = "ACME P8a transversal e2e"
const PREFIX = "P8a-trans-"

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
): Promise<string> {
  const col = await prisma.colaborador.upsert({
    where: { email },
    update: { nombre, estadoEmpleado: "ACTIVO" },
    create: { email, nombre, estadoEmpleado: "ACTIVO" },
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

describe.runIf(RUN_E2E)("transversal e2e (Slice 8 P8a)", () => {
  let app: INestApplication
  let prisma: PrismaClient
  let agenteAdmin: Agent
  let agentePart: Agent
  let agentePart2: Agent
  let csrfAdmin: string
  let csrfPart: string
  let csrfPart2: string
  let clienteId: string
  let cursoId: string
  let transversalId: string
  let asignacionPartId: string
  let asignacionPart2Id: string
  let skillId: string

  beforeAll(async () => {
    prisma = new PrismaClient()
    try {
      await prisma.$queryRaw`SELECT 1`
    } catch (error) {
      const detalle = error instanceof Error ? error.message : String(error)
      throw new Error(`No se pudo conectar a la BD para los e2e: ${detalle}`)
    }

    const passwordHash = await bcrypt.hash(PASSWORD, 12)
    await upsertUsuario(prisma, ADMIN_EMAIL, "ADMIN", passwordHash, "P8a Trans Admin")
    const colabPartId = await upsertUsuario(
      prisma,
      PARTICIPANTE_EMAIL,
      "PARTICIPANTE",
      passwordHash,
      "P8a Trans Part",
    )
    const colabPart2Id = await upsertUsuario(
      prisma,
      PARTICIPANTE2_EMAIL,
      "PARTICIPANTE",
      passwordHash,
      "P8a Trans Part 2",
    )

    const cliente = await prisma.cliente.upsert({
      where: { nombre: CLIENTE_NOMBRE },
      update: { activo: true, deletedAt: null },
      create: { nombre: CLIENTE_NOMBRE, activo: true },
      select: { id: true },
    })
    clienteId = cliente.id

    // Limpieza defensiva.
    const cursosPrev = await prisma.curso.findMany({
      where: { titulo: { contains: PREFIX } },
      select: { id: true, transversalId: true },
    })
    for (const c of cursosPrev) {
      if (c.transversalId !== null) {
        await prisma.intentoTransversal.deleteMany({ where: { transversalId: c.transversalId } })
        await prisma.transversalSkill.deleteMany({ where: { transversalId: c.transversalId } })
      }
    }
    const cursoIdsPrev = cursosPrev.map((c) => c.id)
    if (cursoIdsPrev.length > 0) {
      await prisma.asignacionCurso.deleteMany({ where: { cursoId: { in: cursoIdsPrev } } })
      await prisma.cursoSkillExigida.deleteMany({ where: { cursoId: { in: cursoIdsPrev } } })
      await prisma.cursoAreaExigida.deleteMany({ where: { cursoId: { in: cursoIdsPrev } } })
      await prisma.cursoModuloHabilitado.deleteMany({ where: { cursoId: { in: cursoIdsPrev } } })
      await prisma.curso.deleteMany({ where: { id: { in: cursoIdsPrev } } })
    }
    for (const c of cursosPrev) {
      if (c.transversalId !== null) {
        await prisma.proyectoTransversal.deleteMany({ where: { id: c.transversalId } })
      }
    }
    await prisma.skill.deleteMany({ where: { etiquetaVisible: { contains: PREFIX } } })
    await prisma.area.deleteMany({ where: { nombre: { contains: PREFIX } } })
    await prisma.idempotencyKey.deleteMany({ where: { scope: "intento-transversal" } })
    await prisma.activityLog.deleteMany({
      where: {
        accion: {
          in: ["INTENTO_TRANSVERSAL_CREADO", "TRANSVERSAL_SKILLS_ACTUALIZADAS"],
        },
      },
    })

    const area = await prisma.area.create({
      data: { nombre: `${PREFIX}area`, descripcion: "Area transversal" },
      select: { id: true },
    })
    const skill = await prisma.skill.create({
      data: { etiquetaVisible: `${PREFIX}skill`, areaId: area.id, estado: "ACTIVA" },
      select: { id: true },
    })
    skillId = skill.id

    // ProyectoTransversal requiere cursoId (FK), pero Curso a su vez tiene
    // transversalId @unique (double-side legacy del schema). Lo resolvemos en
    // tres pasos: curso sin transversal -> transversal con cursoId -> update
    // curso.transversalId.
    const curso = await prisma.curso.create({
      data: {
        titulo: `${PREFIX}curso`,
        clienteId,
        estado: "ACTIVO",
        fechaInicio: new Date("2026-04-01"),
        fechaDeadline: new Date("2026-08-01"),
        toggleVoluntarios: false,
        desbloqueo: "SIEMPRE",
        areasExigidas: { create: [{ areaId: area.id, peso: 100, puntajeObjetivo: 70 }] },
        skillsExigidas: { create: [{ skillId: skill.id, notaMinima: 70 }] },
      },
      select: { id: true },
    })
    cursoId = curso.id

    const transversal = await prisma.proyectoTransversal.create({
      data: {
        cursoId,
        descripcion: "Transversal P8a e2e",
        umbralAprobacion: 70,
        pesoCapaTests: 40,
        pesoCapaCualitativa: 30,
        pesoCapaComprension: 30,
      },
      select: { id: true },
    })
    transversalId = transversal.id

    await prisma.curso.update({
      where: { id: cursoId },
      data: { transversalId },
    })

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
    const a2 = await prisma.asignacionCurso.create({
      data: {
        colaboradorId: colabPart2Id,
        cursoId,
        rol: "ASIGNADO",
        estadoAsignado: "ASIGNADO",
      },
      select: { id: true },
    })
    asignacionPart2Id = a2.id

    await prisma.$executeRaw`
      DELETE FROM sesiones
      WHERE (sess::jsonb->>'usuarioId') IN (
        SELECT id::text FROM usuarios WHERE colaborador_id IN
          (SELECT id FROM colaboradores WHERE email IN
            (${ADMIN_EMAIL}, ${PARTICIPANTE_EMAIL}, ${PARTICIPANTE2_EMAIL}))
      )
    `

    const moduleApp = (await import(join(DIST_DIR, "app.module.js"))) as ModuloApp
    const moduleHttp = (await import(join(DIST_DIR, "bootstrap-http.js"))) as ModuloHttp
    const { Test } = await import("@nestjs/testing")
    const { ThrottlerGuard, ThrottlerStorage } = await import("@nestjs/throttler")
    const { ThrottlerStorageFake } = await import("./throttler-storage-fake.js")
    const throttlerStorageFake = new ThrottlerStorageFake()
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
    agentePart2 = supertest.agent(app.getHttpServer())
    csrfAdmin = await loginYObtenerCsrf(agenteAdmin, ADMIN_EMAIL)
    csrfPart = await loginYObtenerCsrf(agentePart, PARTICIPANTE_EMAIL)
    csrfPart2 = await loginYObtenerCsrf(agentePart2, PARTICIPANTE2_EMAIL)
  }, 60_000)

  afterAll(async () => {
    try {
      await prisma.intentoTransversal.deleteMany({ where: { transversalId } })
      await prisma.transversalSkill.deleteMany({ where: { transversalId } })
      await prisma.idempotencyKey.deleteMany({ where: { scope: "intento-transversal" } })
      await prisma.activityLog.deleteMany({
        where: {
          accion: {
            in: ["INTENTO_TRANSVERSAL_CREADO", "TRANSVERSAL_SKILLS_ACTUALIZADAS"],
          },
        },
      })
      await prisma.asignacionCurso.deleteMany({ where: { cursoId } })
      await prisma.cursoSkillExigida.deleteMany({ where: { cursoId } })
      await prisma.cursoAreaExigida.deleteMany({ where: { cursoId } })
      await prisma.cursoModuloHabilitado.deleteMany({ where: { cursoId } })
      await prisma.curso.deleteMany({ where: { id: cursoId } })
      await prisma.proyectoTransversal.deleteMany({ where: { id: transversalId } })
      await prisma.skill.deleteMany({ where: { etiquetaVisible: { contains: PREFIX } } })
      await prisma.area.deleteMany({ where: { nombre: { contains: PREFIX } } })

      const cli = await prisma.cliente.findUnique({
        where: { nombre: CLIENTE_NOMBRE },
        select: { id: true },
      })
      if (cli) {
        await prisma.cliente.delete({ where: { id: cli.id } })
      }

      const cols = await prisma.colaborador.findMany({
        where: { email: { in: [ADMIN_EMAIL, PARTICIPANTE_EMAIL, PARTICIPANTE2_EMAIL] } },
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
      console.warn(`transversal.e2e cleanup fallo (no rompe teardown): ${detalle}`)
    }
    if (app) {
      await app.close()
    }
    if (prisma) {
      await prisma.$disconnect()
    }
  })

  // ===========================================================================
  // E1 + E2 — transversal del curso + skills
  // ===========================================================================

  it("GET /cursos/:id/transversal — admin recibe pesos y capas activas", async () => {
    const res = await agenteAdmin.get(`/api/v1/cursos/${cursoId}/transversal`)
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({
      transversalId,
      cursoId,
      pesosCapas: { tests: 40, cualitativa: 30, comprension: 30 },
    })
  })

  it("POST /cursos/:id/transversal/skills — admin con X-Motivo en curso ACTIVO funciona", async () => {
    const res = await agenteAdmin
      .post(`/api/v1/cursos/${cursoId}/transversal/skills`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .set("X-Motivo", "Configurando skills del transversal")
      .send({ skillIds: [skillId] })
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ transversalId, skillsActualizadas: [skillId] })

    const audit = await prisma.activityLog.findFirst({
      where: { accion: "TRANSVERSAL_SKILLS_ACTUALIZADAS", recursoId: transversalId },
      select: { id: true },
    })
    expect(audit).not.toBeNull()
  })

  it("POST skills sin X-Motivo en curso ACTIVO -> 500/400/422 segun guard inline", async () => {
    const res = await agenteAdmin
      .post(`/api/v1/cursos/${cursoId}/transversal/skills`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .send({ skillIds: [skillId] })
    // El controller lanza MOTIVO_REQUERIDO. Aceptamos 4xx/5xx pero el body
    // debe traer el code.
    expect(res.status).toBeGreaterThanOrEqual(400)
    const body = res.body as { code?: string }
    expect(body.code).toBe("MOTIVO_REQUERIDO")
  })

  it("POST skills con skillId fuera del catalogo de cobertura -> 422", async () => {
    const res = await agenteAdmin
      .post(`/api/v1/cursos/${cursoId}/transversal/skills`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .set("X-Motivo", "test")
      .send({ skillIds: [randomUUID()] })
    expect(res.status).toBe(422)
    const body = res.body as { code?: string }
    expect(body.code).toBe("CONFLICT_SKILLS_TRANSVERSAL_INVALIDAS")
  })

  // ===========================================================================
  // E3 — disponibilidad
  // ===========================================================================

  it("GET disponibilidad ajena -> 404 (D-AS-9) para PARTICIPANTE", async () => {
    const res = await agentePart.get(
      `/api/v1/asignaciones/${asignacionPart2Id}/transversal/disponibilidad`,
    )
    expect(res.status).toBe(404)
  })

  it("GET disponibilidad (SIEMPRE) -> disponible=true", async () => {
    const res = await agentePart.get(
      `/api/v1/asignaciones/${asignacionPartId}/transversal/disponibilidad`,
    )
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ disponible: true, razon: "SIEMPRE" })
  })

  // ===========================================================================
  // E4 — POST intento (Idempotency-Key obligatoria, throttle, audit)
  // ===========================================================================

  it("POST intento sin Idempotency-Key -> 400 IDEMPOTENCY_KEY_REQUERIDA", async () => {
    const res = await agentePart
      .post(`/api/v1/asignaciones/${asignacionPartId}/intentos-transversal`)
      .set("X-XSRF-TOKEN", csrfPart)
      .send({ repoOArtefacto: { tipo: "URL_GIT", url: "https://github.com/foo/bar" } })
    expect(res.status).toBe(400)
    expect((res.body as { code?: string }).code).toBe("IDEMPOTENCY_KEY_REQUERIDA")
  })

  it("POST intento happy path -> 201 EN_EVALUACION + audit", async () => {
    const key = randomUUID()
    const res = await agentePart
      .post(`/api/v1/asignaciones/${asignacionPartId}/intentos-transversal`)
      .set("X-XSRF-TOKEN", csrfPart)
      .set("Idempotency-Key", key)
      .send({
        repoOArtefacto: { tipo: "URL_GIT", url: "https://github.com/foo/bar" },
        comentarioColaborador: "primera entrega",
      })
    expect(res.status).toBe(201)
    const body = res.body as { intentoId: string; estado: string }
    expect(body.estado).toBe("EN_EVALUACION")
    const audit = await prisma.activityLog.findFirst({
      where: { accion: "INTENTO_TRANSVERSAL_CREADO", recursoId: body.intentoId },
      select: { id: true },
    })
    expect(audit).not.toBeNull()
  })

  it("POST intento replay (misma Idempotency-Key, mismo body) -> 201 estable", async () => {
    const key = randomUUID()
    const body = {
      repoOArtefacto: { tipo: "URL_GIT", url: "https://github.com/foo/replay" },
    }
    const r1 = await agentePart
      .post(`/api/v1/asignaciones/${asignacionPartId}/intentos-transversal`)
      .set("X-XSRF-TOKEN", csrfPart)
      .set("Idempotency-Key", key)
      .send(body)
    const r2 = await agentePart
      .post(`/api/v1/asignaciones/${asignacionPartId}/intentos-transversal`)
      .set("X-XSRF-TOKEN", csrfPart)
      .set("Idempotency-Key", key)
      .send(body)
    expect(r1.status).toBe(201)
    expect(r2.status).toBe(201)
    expect((r1.body as { intentoId: string }).intentoId).toBe(
      (r2.body as { intentoId: string }).intentoId,
    )
  })

  it("POST intento desde asignacion ASIGNADO (no EN_PROGRESO) -> 422", async () => {
    const key = randomUUID()
    const res = await agentePart2
      .post(`/api/v1/asignaciones/${asignacionPart2Id}/intentos-transversal`)
      .set("X-XSRF-TOKEN", csrfPart2)
      .set("Idempotency-Key", key)
      .send({ repoOArtefacto: { tipo: "URL_GIT", url: "https://github.com/foo/bar" } })
    expect(res.status).toBe(422)
    expect((res.body as { code?: string }).code).toBe("CONFLICT_ASIGNACION_ESTADO_INVALIDO")
  })

  // ===========================================================================
  // E5 + E6 — GET intentos
  // ===========================================================================

  it("GET intento — PARTICIPANTE propio EN_EVALUACION NO recibe detalleCapas", async () => {
    const intento = await prisma.intentoTransversal.findFirst({
      where: { transversalId, estado: "EN_EVALUACION", anulado: false },
      select: { id: true },
    })
    if (!intento) {
      throw new Error("Setup roto: no hay intento EN_EVALUACION")
    }
    const res = await agentePart.get(`/api/v1/intentos-transversal/${intento.id}`)
    expect(res.status).toBe(200)
    const body = res.body as Record<string, unknown>
    expect("notaCapaTests" in body).toBe(false)
    expect(body.notaGlobal).toBeNull()
  })

  it("GET intento — ADMIN ve campos completos (anulado, motivoAnulacion, notas)", async () => {
    const intento = await prisma.intentoTransversal.findFirst({
      where: { transversalId },
      select: { id: true },
    })
    if (!intento) {
      throw new Error("Setup roto: no hay intento")
    }
    const res = await agenteAdmin.get(`/api/v1/intentos-transversal/${intento.id}`)
    expect(res.status).toBe(200)
    const body = res.body as Record<string, unknown>
    expect("anulado" in body).toBe(true)
    expect("motivoAnulacion" in body).toBe(true)
  })

  it("GET listado de intentos por asignacion — paginado DESC", async () => {
    const res = await agentePart.get(
      `/api/v1/asignaciones/${asignacionPartId}/intentos-transversal`,
    )
    expect(res.status).toBe(200)
    const body = res.body as { data: unknown[]; meta: { total: number } }
    expect(body.meta.total).toBeGreaterThanOrEqual(1)
  })
})
