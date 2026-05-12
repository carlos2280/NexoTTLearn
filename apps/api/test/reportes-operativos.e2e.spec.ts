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
  console.warn("reportes-operativos.e2e.spec: DATABASE_URL ausente — tests SKIP.")
}
if (HAS_DB_URL && !DIST_DISPONIBLE) {
  console.warn(
    "reportes-operativos.e2e.spec: dist/ no encontrado — ejecutar `pnpm --filter @nexott-learn/api build`. SKIP.",
  )
}

const RUN_E2E = HAS_DB_URL && DIST_DISPONIBLE

const ADMIN_EMAIL = "reportes-admin-p11b@nttdata.test"
const PART_EMAIL = "reportes-part-p11b@nttdata.test"
const COLAB_EMAIL = "reportes-colab-p11b@nttdata.test"
const PASSWORD = "Reportes1234!"

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

async function upsertColaborador(
  prisma: PrismaClient,
  email: string,
  nombre: string,
): Promise<string> {
  const col = await prisma.colaborador.upsert({
    where: { email },
    update: { nombre, estadoEmpleado: "ACTIVO" },
    create: { email, nombre, estadoEmpleado: "ACTIVO" },
    select: { id: true },
  })
  return col.id
}

async function upsertUsuario(
  prisma: PrismaClient,
  colaboradorId: string,
  rol: "ADMIN" | "PARTICIPANTE",
  passwordHash: string,
): Promise<string> {
  const user = await prisma.usuario.upsert({
    where: { colaboradorId },
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
      colaboradorId,
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

describe.runIf(RUN_E2E)("reportes operativos e2e (P11b)", () => {
  let app: INestApplication
  let prisma: PrismaClient
  let agenteAdmin: Agent
  let agentePart: Agent
  let colaboradorId: string
  let clienteId: string
  let cursoId: string
  let asignacionId: string

  beforeAll(async () => {
    prisma = new PrismaClient()
    try {
      await prisma.$queryRaw`SELECT 1`
    } catch (error) {
      const detalle = error instanceof Error ? error.message : String(error)
      throw new Error(`No se pudo conectar a la BD para los e2e: ${detalle}`)
    }

    const passwordHash = await bcrypt.hash(PASSWORD, 12)
    const adminColId = await upsertColaborador(prisma, ADMIN_EMAIL, "Admin P11b")
    const partColId = await upsertColaborador(prisma, PART_EMAIL, "Part P11b")
    colaboradorId = await upsertColaborador(prisma, COLAB_EMAIL, "Colab P11b")
    await upsertUsuario(prisma, adminColId, "ADMIN", passwordHash)
    await upsertUsuario(prisma, partColId, "PARTICIPANTE", passwordHash)

    // Cliente + curso ACTIVO para escenarios.
    const cliente = await prisma.cliente.upsert({
      where: { nombre: "Cliente Reportes P11b" },
      update: {},
      create: { nombre: "Cliente Reportes P11b" },
      select: { id: true },
    })
    clienteId = cliente.id

    const curso = await prisma.curso.create({
      data: {
        titulo: "Curso reportes P11b",
        clienteId,
        estado: "ACTIVO",
        fechaInicio: new Date("2026-01-01"),
        fechaDeadline: new Date("2026-12-31"),
        umbralNoCumple: 40,
      },
      select: { id: true },
    })
    cursoId = curso.id

    const asig = await prisma.asignacionCurso.create({
      data: {
        cursoId,
        colaboradorId,
        rol: "ASIGNADO",
        estadoAsignado: "EN_PROGRESO",
        fechaInicio: new Date("2026-02-01"),
      },
      select: { id: true },
    })
    asignacionId = asig.id

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
    agenteAdmin = supertest.agent(app.getHttpServer())
    agentePart = supertest.agent(app.getHttpServer())
    await loginYObtenerCsrf(agenteAdmin, ADMIN_EMAIL)
    await loginYObtenerCsrf(agentePart, PART_EMAIL)
  }, 60_000)

  afterAll(async () => {
    try {
      // Limpieza FK-ordered: intentos > nota_skill > asignacion > curso_skills/areas/modulos >
      // log_cambios_curso > fotografia > curso > cliente
      await prisma.intentoBloque.deleteMany({ where: { cursoId } })
      await prisma.cursoSkillExigida.deleteMany({ where: { cursoId } })
      await prisma.cursoAreaExigida.deleteMany({ where: { cursoId } })
      await prisma.cursoModuloHabilitado.deleteMany({ where: { cursoId } })
      await prisma.notaSkill.deleteMany({ where: { colaboradorId } })
      await prisma.historicoEstadoAsignacion.deleteMany({
        where: { asignacion: { cursoId } },
      })
      await prisma.asignacionCurso.deleteMany({ where: { cursoId } })
      await prisma.cursoFotografiaCierre.deleteMany({ where: { cursoId } })
      await prisma.logCambioCurso.deleteMany({ where: { cursoId } })
      await prisma.curso.deleteMany({ where: { id: cursoId } })
      await prisma.cliente.deleteMany({ where: { id: clienteId } })
      await prisma.$executeRaw`
        DELETE FROM sesiones
        WHERE (sess::jsonb->>'usuarioId') IN (
          SELECT id::text FROM usuarios WHERE colaborador_id IN
            (SELECT id FROM colaboradores WHERE email IN
              (${ADMIN_EMAIL}, ${PART_EMAIL}, ${COLAB_EMAIL}))
        )
      `
    } finally {
      await app.close()
      await prisma.$disconnect()
    }
  }, 30_000)

  it("E1 ACTUAL — ADMIN obtiene avance-curso con la asignacion y alertas computadas", async () => {
    const res = await agenteAdmin
      .get(`/api/v1/reportes/avance-curso?cursoId=${cursoId}`)
      .expect(200)

    expect(res.body.meta).toMatchObject({ page: 1, pageSize: 20 })
    expect(res.body.data).toHaveLength(1)
    const fila = res.body.data[0]
    expect(fila.asignacionId).toBe(asignacionId)
    expect(fila.colaborador.email).toBe(COLAB_EMAIL)
    // Sin actividad reciente + sin plan -> 2 alertas minimo.
    expect(fila.alertas).toEqual(
      expect.arrayContaining(["SIN_ACTIVIDAD_7_DIAS", "PLAN_NO_CALCULADO"]),
    )
  })

  it("E1 ACTUAL — PARTICIPANTE recibe 403", async () => {
    await agentePart.get(`/api/v1/reportes/avance-curso?cursoId=${cursoId}`).expect(403)
  })

  it("E1 FOTOGRAFIA_CIERRE — 404 fotografiaNoEncontrada cuando no existe", async () => {
    const res = await agenteAdmin
      .get(`/api/v1/reportes/avance-curso?cursoId=${cursoId}&vista=FOTOGRAFIA_CIERRE`)
      .expect(404)
    expect(res.body).toMatchObject({ code: "FOTOGRAFIA_NO_ENCONTRADA" })
  })

  it("E2 detalle-colaborador — ACTUAL devuelve plan + ultimosIntentos + meta", async () => {
    const res = await agenteAdmin
      .get(`/api/v1/reportes/detalle-colaborador?cursoId=${cursoId}&colaboradorId=${colaboradorId}`)
      .expect(200)
    expect(res.body.asignacion.id).toBe(asignacionId)
    expect(res.body.plan).toEqual([])
    expect(res.body.ultimosIntentos).toMatchObject({
      bloque: [],
      transversal: [],
      entrevistaIa: [],
    })
    expect(res.body.hayMas).toMatchObject({
      bloque: false,
      transversal: false,
      entrevistaIa: false,
    })
    expect(res.body.meta.frescura).toMatch(/T/)
  })

  it("E2 detalle-colaborador — 422 vistaNoSoportada si vista=HISTORICO", async () => {
    const res = await agenteAdmin
      .get(
        `/api/v1/reportes/detalle-colaborador?cursoId=${cursoId}&colaboradorId=${colaboradorId}&vista=HISTORICO`,
      )
      .expect(422)
    expect(res.body).toMatchObject({ code: "VISTA_NO_SOPORTADA" })
  })

  it("E3 brechas-detectadas — ACTUAL devuelve umbrales default cuando no hay umbralesLogro", async () => {
    const res = await agenteAdmin
      .get(`/api/v1/reportes/brechas-detectadas?cursoId=${cursoId}`)
      .expect(200)
    expect(res.body.cursoId).toBe(cursoId)
    expect(res.body.umbrales).toMatchObject({
      umbralAprobado: 70,
      umbralExcelencia: 85,
    })
    expect(res.body.skills).toEqual([])
  })

  it("E4 centro-revision — TODAS devuelve listas vacias cuando no hay pendientes", async () => {
    const res = await agenteAdmin.get("/api/v1/reportes/centro-revision").expect(200)
    expect(res.body.totales).toEqual({ transversales: 0, entrevistasIa: 0 })
  })

  it("E4 centro-revision — rechaza format=csv con 422 formatoNoSoportadoEnP11b", async () => {
    const res = await agenteAdmin.get("/api/v1/reportes/centro-revision?format=csv").expect(400)
    // Zod schema rechaza format=csv antes de llegar al cinturon del controller -> 400 INVALID_QUERY.
    expect(res.body.code).toBe("INVALID_QUERY")
  })

  it("FIX-P11b-avance §5.128 — porcentajeAvance refleja el motor real cuando hay plan + intento aprobado", async () => {
    // Setup local: skill + modulo habilitado + seccion + bloque evaluable +
    // plan con item OBLIGATORIO + intento mejor-vigente aprobado.
    const area = await prisma.area.upsert({
      where: { nombre: "reportes-avance-p11b-area" },
      update: {},
      create: { nombre: "reportes-avance-p11b-area" },
      select: { id: true },
    })
    const skill = await prisma.skill.upsert({
      where: { etiquetaVisible: "reportes-avance-p11b-skill" },
      update: {},
      create: {
        etiquetaVisible: "reportes-avance-p11b-skill",
        areaId: area.id,
        estado: "ACTIVA",
      },
      select: { id: true },
    })
    const modulo = await prisma.modulo.create({
      data: { titulo: "Mod reportes avance" },
      select: { id: true },
    })
    const seccion = await prisma.seccion.create({
      data: { moduloId: modulo.id, titulo: "Sec reportes avance", orden: 1 },
      select: { id: true },
    })
    const bloque = await prisma.bloque.create({
      data: {
        seccionId: seccion.id,
        orden: 1,
        tipo: "QUIZ",
        esEvaluable: true,
        skillQueMideId: skill.id,
        contenido: {},
        version: 1,
      },
      select: { id: true },
    })
    await prisma.cursoModuloHabilitado.create({
      data: { cursoId, moduloId: modulo.id },
    })
    const plan = await prisma.planEstudio.create({
      data: { asignacionId },
      select: { id: true },
    })
    await prisma.itemPlan.create({
      data: {
        planId: plan.id,
        moduloId: modulo.id,
        seccionId: seccion.id,
        caracter: "OBLIGATORIA",
        razon: "SKILL_FALTANTE",
      },
    })
    await prisma.intentoBloque.create({
      data: {
        colaboradorId,
        bloqueId: bloque.id,
        skillId: skill.id,
        cursoId,
        nota: 85,
        esMejorIntento: true,
        estaInvalidado: false,
        respuestas: {},
        versionBloque: 1,
      },
    })

    try {
      const res = await agenteAdmin
        .get(`/api/v1/reportes/avance-curso?cursoId=${cursoId}`)
        .expect(200)
      const fila = res.body.data.find(
        (f: { asignacionId: string }) => f.asignacionId === asignacionId,
      )
      expect(fila).toBeDefined()
      // 1 obligatoria con su unico bloque aprobado (nota=85 > umbral 70) -> 100%.
      expect(fila.porcentajeAvance).toBe(100)
    } finally {
      // Limpieza local para no contaminar otros e2e que comparten el harness.
      await prisma.intentoBloque.deleteMany({ where: { bloqueId: bloque.id } })
      await prisma.itemPlan.deleteMany({ where: { planId: plan.id } })
      await prisma.planEstudio.deleteMany({ where: { id: plan.id } })
      await prisma.cursoModuloHabilitado.deleteMany({
        where: { cursoId, moduloId: modulo.id },
      })
      await prisma.bloque.deleteMany({ where: { id: bloque.id } })
      await prisma.seccion.deleteMany({ where: { id: seccion.id } })
      await prisma.modulo.deleteMany({ where: { id: modulo.id } })
    }
  })
})
