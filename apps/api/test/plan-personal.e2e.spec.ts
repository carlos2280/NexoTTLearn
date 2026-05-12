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
  console.warn("plan-personal.e2e.spec: DATABASE_URL ausente — tests SKIP.")
}
if (HAS_DB_URL && !DIST_DISPONIBLE) {
  console.warn(
    "plan-personal.e2e.spec: dist/ no encontrado — ejecutar `pnpm --filter @nexott-learn/api build`. SKIP.",
  )
}

const RUN_E2E = HAS_DB_URL && DIST_DISPONIBLE

const ADMIN_EMAIL = "plan-admin-p7@nttdata.test"
const PARTICIPANTE_EMAIL = "plan-part-p7@nttdata.test"
const PARTICIPANTE2_EMAIL = "plan-part2-p7@nttdata.test"
const PASSWORD = "Plan1234!"
const CLIENTE_NOMBRE = "ACME P7 plan e2e"
const PREFIX = "P7-plan-"

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

describe.runIf(RUN_E2E)("plan-personal e2e (P7a + P7c — FIX-P7-cierre)", () => {
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
  let colabPartId: string
  let colabPart2Id: string
  let skillExigidaId: string
  let modulo1Id: string
  let seccionObligatoriaId: string
  let seccionOpcionalId: string
  let asignacionId: string
  let asignacionAjenaId: string
  let throttlerStorageFake: { reset: () => void }

  beforeAll(async () => {
    prisma = new PrismaClient()
    try {
      await prisma.$queryRaw`SELECT 1`
    } catch (error) {
      const detalle = error instanceof Error ? error.message : String(error)
      throw new Error(`No se pudo conectar a la BD para los e2e: ${detalle}`)
    }

    const passwordHash = await bcrypt.hash(PASSWORD, 12)
    await upsertUsuario(prisma, ADMIN_EMAIL, "ADMIN", passwordHash, "P7 Admin")
    colabPartId = await upsertUsuario(
      prisma,
      PARTICIPANTE_EMAIL,
      "PARTICIPANTE",
      passwordHash,
      "P7 Part",
    )
    colabPart2Id = await upsertUsuario(
      prisma,
      PARTICIPANTE2_EMAIL,
      "PARTICIPANTE",
      passwordHash,
      "P7 Part 2",
    )

    const cliente = await prisma.cliente.upsert({
      where: { nombre: CLIENTE_NOMBRE },
      update: { activo: true, deletedAt: null },
      create: { nombre: CLIENTE_NOMBRE, activo: true },
      select: { id: true },
    })
    clienteId = cliente.id

    // Limpieza defensiva de corridas anteriores.
    const cursosPrev = await prisma.curso.findMany({
      where: { titulo: { contains: PREFIX } },
      select: { id: true },
    })
    const cursoIdsPrev = cursosPrev.map((c) => c.id)
    if (cursoIdsPrev.length > 0) {
      const planesPrev = await prisma.planEstudio.findMany({
        where: { asignacion: { cursoId: { in: cursoIdsPrev } } },
        select: { id: true },
      })
      const planIdsPrev = planesPrev.map((p) => p.id)
      if (planIdsPrev.length > 0) {
        await prisma.ajustePlan.deleteMany({ where: { planId: { in: planIdsPrev } } })
        await prisma.itemPlan.deleteMany({ where: { planId: { in: planIdsPrev } } })
        await prisma.planEstudio.deleteMany({ where: { id: { in: planIdsPrev } } })
      }
      await prisma.aperturaSeccion.deleteMany({
        where: { asignacion: { cursoId: { in: cursoIdsPrev } } },
      })
      await prisma.asignacionCurso.deleteMany({ where: { cursoId: { in: cursoIdsPrev } } })
      await prisma.cursoSkillExigida.deleteMany({ where: { cursoId: { in: cursoIdsPrev } } })
      await prisma.cursoAreaExigida.deleteMany({ where: { cursoId: { in: cursoIdsPrev } } })
      await prisma.cursoModuloHabilitado.deleteMany({
        where: { cursoId: { in: cursoIdsPrev } },
      })
      await prisma.curso.deleteMany({ where: { id: { in: cursoIdsPrev } } })
    }
    const modulosPrev = await prisma.modulo.findMany({
      where: { titulo: { contains: PREFIX } },
      select: { id: true },
    })
    const moduloIdsPrev = modulosPrev.map((m) => m.id)
    if (moduloIdsPrev.length > 0) {
      const seccionesPrev = await prisma.seccion.findMany({
        where: { moduloId: { in: moduloIdsPrev } },
        select: { id: true },
      })
      const seccionIdsPrev = seccionesPrev.map((s) => s.id)
      if (seccionIdsPrev.length > 0) {
        await prisma.seccionSkill.deleteMany({ where: { seccionId: { in: seccionIdsPrev } } })
        await prisma.seccion.deleteMany({ where: { id: { in: seccionIdsPrev } } })
      }
      await prisma.modulo.deleteMany({ where: { id: { in: moduloIdsPrev } } })
    }
    await prisma.notaSkill.deleteMany({
      where: { colaboradorId: { in: [colabPartId, colabPart2Id] } },
    })
    await prisma.skill.deleteMany({ where: { etiquetaVisible: { contains: PREFIX } } })
    await prisma.area.deleteMany({ where: { nombre: { contains: PREFIX } } })

    // Fixtures: Area + Skill exigida + Skill no exigida (para ramas de plan).
    const area = await prisma.area.create({
      data: { nombre: `${PREFIX}area`, descripcion: "Area P7" },
      select: { id: true },
    })
    const skill = await prisma.skill.create({
      data: { etiquetaVisible: `${PREFIX}skill-exigida`, areaId: area.id, estado: "ACTIVA" },
      select: { id: true },
    })
    skillExigidaId = skill.id

    // Modulo + 2 secciones: una que enseña la skill exigida (sera OBLIGATORIA
    // si hay brecha) y otra que no la enseña (queda fuera del plan).
    const modulo = await prisma.modulo.create({
      data: { titulo: `${PREFIX}modulo1` },
      select: { id: true },
    })
    modulo1Id = modulo.id
    const secObl = await prisma.seccion.create({
      data: { moduloId: modulo.id, titulo: `${PREFIX}seccion-obligatoria`, orden: 1 },
      select: { id: true },
    })
    seccionObligatoriaId = secObl.id
    await prisma.seccionSkill.create({ data: { seccionId: secObl.id, skillId: skill.id } })

    const secOpc = await prisma.seccion.create({
      data: { moduloId: modulo.id, titulo: `${PREFIX}seccion-libre`, orden: 2 },
      select: { id: true },
    })
    seccionOpcionalId = secOpc.id

    // Curso ACTIVO con modulo habilitado + skill exigida con brecha (notaMinima 70,
    // participante sin nota → brecha 70, estado NO_CUMPLE).
    const curso = await prisma.curso.create({
      data: {
        titulo: `${PREFIX}curso`,
        clienteId,
        estado: "ACTIVO",
        fechaInicio: new Date("2026-04-01"),
        fechaDeadline: new Date("2026-08-01"),
        toggleVoluntarios: false,
        areasExigidas: { create: [{ areaId: area.id, peso: 100, puntajeObjetivo: 70 }] },
        skillsExigidas: { create: [{ skillId: skill.id, notaMinima: 70 }] },
        modulosHabilitados: { create: [{ moduloId: modulo.id }] },
      },
      select: { id: true },
    })
    cursoId = curso.id

    // Asignacion del participante "propio" y del ajeno (part2).
    const asig = await prisma.asignacionCurso.create({
      data: {
        colaboradorId: colabPartId,
        cursoId,
        rol: "ASIGNADO",
        estadoAsignado: "ASIGNADO",
      },
      select: { id: true },
    })
    asignacionId = asig.id
    const asigAjena = await prisma.asignacionCurso.create({
      data: {
        colaboradorId: colabPart2Id,
        cursoId,
        rol: "ASIGNADO",
        estadoAsignado: "ASIGNADO",
      },
      select: { id: true },
    })
    asignacionAjenaId = asigAjena.id

    // Limpiar sesiones residuales antes de levantar la app.
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
    agentePart2 = supertest.agent(app.getHttpServer())
    csrfAdmin = await loginYObtenerCsrf(agenteAdmin, ADMIN_EMAIL)
    csrfPart = await loginYObtenerCsrf(agentePart, PARTICIPANTE_EMAIL)
    csrfPart2 = await loginYObtenerCsrf(agentePart2, PARTICIPANTE2_EMAIL)
  }, 60_000)

  afterAll(async () => {
    try {
      // Borrar todo lo creado en orden inverso a FKs.
      const planesPrev = await prisma.planEstudio.findMany({
        where: { asignacion: { cursoId } },
        select: { id: true },
      })
      const planIdsPrev = planesPrev.map((p) => p.id)
      if (planIdsPrev.length > 0) {
        await prisma.ajustePlan.deleteMany({ where: { planId: { in: planIdsPrev } } })
        await prisma.itemPlan.deleteMany({ where: { planId: { in: planIdsPrev } } })
        await prisma.planEstudio.deleteMany({ where: { id: { in: planIdsPrev } } })
      }
      await prisma.aperturaSeccion.deleteMany({ where: { asignacion: { cursoId } } })
      await prisma.asignacionCurso.deleteMany({ where: { cursoId } })
      await prisma.cursoSkillExigida.deleteMany({ where: { cursoId } })
      await prisma.cursoAreaExigida.deleteMany({ where: { cursoId } })
      await prisma.cursoModuloHabilitado.deleteMany({ where: { cursoId } })
      await prisma.curso.deleteMany({ where: { id: cursoId } })

      await prisma.seccionSkill.deleteMany({
        where: { seccion: { moduloId: modulo1Id } },
      })
      await prisma.seccion.deleteMany({ where: { moduloId: modulo1Id } })
      await prisma.modulo.deleteMany({ where: { id: modulo1Id } })
      await prisma.notaSkill.deleteMany({
        where: { colaboradorId: { in: [colabPartId, colabPart2Id] } },
      })
      await prisma.skill.deleteMany({ where: { etiquetaVisible: { contains: PREFIX } } })
      await prisma.area.deleteMany({ where: { nombre: { contains: PREFIX } } })
      const auditAcciones: ("PLAN_RECALCULADO" | "PLAN_AJUSTADO_MANUALMENTE")[] = [
        "PLAN_RECALCULADO",
        "PLAN_AJUSTADO_MANUALMENTE",
      ]
      await prisma.activityLog.deleteMany({ where: { accion: { in: auditAcciones } } })
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
      const colIds = cols.map((c) => c.id)
      if (colIds.length > 0) {
        await prisma.$executeRaw`
          DELETE FROM sesiones
          WHERE (sess::jsonb->>'usuarioId') IN (
            SELECT id::text FROM usuarios WHERE colaborador_id = ANY(${colIds}::uuid[])
          )
        `
        await prisma.usuario.deleteMany({ where: { colaboradorId: { in: colIds } } })
        await prisma.colaborador.deleteMany({ where: { id: { in: colIds } } })
      }
    } catch (error) {
      const detalle = error instanceof Error ? error.message : String(error)
      console.warn(`plan-personal.e2e cleanup fallo (no rompe teardown): ${detalle}`)
    }
    if (app) {
      await app.close()
    }
    if (prisma) {
      await prisma.$disconnect()
    }
  })

  async function resetPlan(): Promise<void> {
    throttlerStorageFake.reset()
    const planes = await prisma.planEstudio.findMany({
      where: { asignacion: { cursoId } },
      select: { id: true },
    })
    const planIds = planes.map((p) => p.id)
    if (planIds.length > 0) {
      await prisma.ajustePlan.deleteMany({ where: { planId: { in: planIds } } })
      await prisma.itemPlan.deleteMany({ where: { planId: { in: planIds } } })
      await prisma.planEstudio.deleteMany({ where: { id: { in: planIds } } })
    }
    await prisma.aperturaSeccion.deleteMany({ where: { asignacion: { cursoId } } })
  }

  it("POST /plan/calcular: 201 con shape admin (fichaSnapshot + razon)", async () => {
    await resetPlan()
    const res = await agenteAdmin
      .post(`/api/v1/asignaciones/${asignacionId}/plan/calcular`)
      .set("X-XSRF-TOKEN", csrfAdmin)
    expect(res.status).toBe(201)
    const body = res.body as {
      planId: string
      asignacionId: string
      fichaSnapshot: unknown
      estaDesactualizado: boolean
      items: ReadonlyArray<{ secciones: ReadonlyArray<{ razon: string; caracter: string }> }>
    }
    expect(body.asignacionId).toBe(asignacionId)
    expect(body.estaDesactualizado).toBe(false)
    expect(body.fichaSnapshot).toBeTruthy()
    const seccionesRespuesta = body.items.flatMap((m) => m.secciones)
    expect(seccionesRespuesta.length).toBeGreaterThan(0)
    expect(seccionesRespuesta[0]?.razon).toBeDefined()
  })

  it("POST /plan/calcular segundo intento: 409 conflictPlanYaCalculado", async () => {
    const res = await agenteAdmin
      .post(`/api/v1/asignaciones/${asignacionId}/plan/calcular`)
      .set("X-XSRF-TOKEN", csrfAdmin)
    expect(res.status).toBe(409)
    expect((res.body as { code: string }).code).toBe("CONFLICT_PLAN_YA_CALCULADO")
  })

  it("POST /plan/recalcular sin X-Motivo: 422 motivoRequerido", async () => {
    const res = await agenteAdmin
      .post(`/api/v1/asignaciones/${asignacionId}/plan/recalcular`)
      .set("X-XSRF-TOKEN", csrfAdmin)
    expect(res.status).toBe(422)
    expect((res.body as { code: string }).code).toBe("MOTIVO_REQUERIDO")
  })

  it("POST /plan/recalcular con X-Motivo: 200 + audit PLAN_RECALCULADO con metadata.motivoLength", async () => {
    const motivo = "Recalculo por cambio de skills"
    const res = await agenteAdmin
      .post(`/api/v1/asignaciones/${asignacionId}/plan/recalcular`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .set("X-Motivo", motivo)
    expect(res.status).toBe(200)
    expect((res.body as { estaDesactualizado: boolean }).estaDesactualizado).toBe(false)
    const log = await prisma.activityLog.findFirst({
      where: { accion: "PLAN_RECALCULADO", recursoTipo: "plan_estudio" },
      orderBy: { createdAt: "desc" },
      select: { metadata: true },
    })
    expect(log).not.toBeNull()
    const metadata = log?.metadata as { motivoLength?: number } | null
    expect(metadata?.motivoLength).toBe(motivo.trim().length)
  })

  it("GET /plan (ADMIN): incluye fichaSnapshot + razon (Object.hasOwn true)", async () => {
    const res = await agenteAdmin.get(`/api/v1/asignaciones/${asignacionId}/plan`)
    expect(res.status).toBe(200)
    const body = res.body as Record<string, unknown>
    expect(Object.hasOwn(body, "fichaSnapshot")).toBe(true)
    const items = body.items as readonly {
      readonly secciones: readonly Record<string, unknown>[]
    }[]
    const primeraSeccion = items[0]?.secciones[0]
    expect(primeraSeccion && Object.hasOwn(primeraSeccion, "razon")).toBe(true)
  })

  it("GET /plan (PARTICIPANTE propio): NO incluye fichaSnapshot, razon, ni estaDesactualizado (R-S7-9)", async () => {
    const res = await agentePart.get(`/api/v1/asignaciones/${asignacionId}/plan`)
    expect(res.status).toBe(200)
    const body = res.body as Record<string, unknown>
    expect(Object.hasOwn(body, "fichaSnapshot")).toBe(false)
    expect(Object.hasOwn(body, "estaDesactualizado")).toBe(false)
    const items = body.items as readonly {
      readonly secciones: readonly Record<string, unknown>[]
    }[]
    const primeraSeccion = items[0]?.secciones[0]
    expect(primeraSeccion && Object.hasOwn(primeraSeccion, "razon")).toBe(false)
  })

  it("GET /plan (PARTICIPANTE sobre asignacion ajena): 404 (D-S7-D1)", async () => {
    const res = await agentePart2.get(`/api/v1/asignaciones/${asignacionId}/plan`)
    expect(res.status).toBe(404)
    expect((res.body as { code: string }).code).toBe("ASIGNACION_NO_ENCONTRADA")
  })

  it("PATCH /plan/ajustes accion=AGREGAR: 200 + razon=AJUSTE_ADMIN + fila AjustePlan", async () => {
    const res = await agenteAdmin
      .patch(`/api/v1/asignaciones/${asignacionId}/plan/ajustes`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .set("X-Motivo", "Anadiendo seccion libre")
      .send({ accion: "AGREGAR", seccionId: seccionOpcionalId, caracter: "OPCIONAL" })
    expect(res.status).toBe(200)
    const plan = await prisma.planEstudio.findUnique({
      where: { asignacionId },
      select: {
        id: true,
        items: { select: { seccionId: true, razon: true } },
      },
    })
    const item = plan?.items.find((i) => i.seccionId === seccionOpcionalId)
    expect(item).toBeDefined()
    expect(item?.razon).toBe("AJUSTE_ADMIN")
    const ajuste = await prisma.ajustePlan.findFirst({
      where: { planId: plan?.id, accion: "AGREGAR", seccionId: seccionOpcionalId },
      select: { motivo: true },
    })
    expect(ajuste).not.toBeNull()
  })

  it("PATCH /plan/ajustes accion=CAMBIAR_CARACTER: 200 + caracter actualizado", async () => {
    const res = await agenteAdmin
      .patch(`/api/v1/asignaciones/${asignacionId}/plan/ajustes`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .set("X-Motivo", "Forzando obligatoriedad")
      .send({ accion: "CAMBIAR_CARACTER", seccionId: seccionOpcionalId, caracter: "OBLIGATORIA" })
    expect(res.status).toBe(200)
    const item = await prisma.itemPlan.findFirst({
      where: { seccionId: seccionOpcionalId, plan: { asignacionId } },
      select: { caracter: true },
    })
    expect(item?.caracter).toBe("OBLIGATORIA")
  })

  it("PATCH /plan/ajustes accion=QUITAR: 200 + seccion eliminada", async () => {
    const res = await agenteAdmin
      .patch(`/api/v1/asignaciones/${asignacionId}/plan/ajustes`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .set("X-Motivo", "Eliminando seccion libre")
      .send({ accion: "QUITAR", seccionId: seccionOpcionalId })
    expect(res.status).toBe(200)
    const item = await prisma.itemPlan.findFirst({
      where: { seccionId: seccionOpcionalId, plan: { asignacionId } },
      select: { id: true },
    })
    expect(item).toBeNull()
  })

  it("PATCH /plan/ajustes accion=EXIMIR: 200 + 1 fila AjustePlan con seccionId=null", async () => {
    const res = await agenteAdmin
      .patch(`/api/v1/asignaciones/${asignacionId}/plan/ajustes`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .set("X-Motivo", "Eximiendo skill por experiencia previa")
      .send({ accion: "EXIMIR", skillId: skillExigidaId })
    expect(res.status).toBe(200)
    const ajuste = await prisma.ajustePlan.findFirst({
      where: { plan: { asignacionId }, accion: "EXIMIR" },
      select: { seccionId: true },
    })
    expect(ajuste).not.toBeNull()
    expect(ajuste?.seccionId).toBeNull()
    const obligatoria = await prisma.itemPlan.findFirst({
      where: { seccionId: seccionObligatoriaId, plan: { asignacionId } },
      select: { caracter: true },
    })
    // Tras EXIMIR las secciones obligatorias que ensenan la skill bajan a OPCIONAL.
    expect(obligatoria?.caracter).toBe("OPCIONAL")
  })

  it("GET /plan/diff (ADMIN): 200 con diff y posibles impacto", async () => {
    const res = await agenteAdmin.get(`/api/v1/asignaciones/${asignacionId}/plan/diff`)
    expect(res.status).toBe(200)
    const body = res.body as { diff: ReadonlyArray<{ impacto?: string }> }
    expect(Array.isArray(body.diff)).toBe(true)
  })

  it("GET /plan/diff (PARTICIPANTE): 404 (D-S7-D1 estricto)", async () => {
    const res = await agentePart.get(`/api/v1/asignaciones/${asignacionId}/plan/diff`)
    expect(res.status).toBe(404)
    expect((res.body as { code: string }).code).toBe("ASIGNACION_NO_ENCONTRADA")
  })

  it("POST /secciones/:seccionId/apertura primera vez: 200 con yaEstaba=false", async () => {
    const res = await agentePart
      .post(`/api/v1/asignaciones/${asignacionId}/secciones/${seccionObligatoriaId}/apertura`)
      .set("X-XSRF-TOKEN", csrfPart)
    expect(res.status).toBe(200)
    const body = res.body as { yaEstaba: boolean; seccionId: string }
    expect(body.yaEstaba).toBe(false)
    expect(body.seccionId).toBe(seccionObligatoriaId)
  })

  it("POST /secciones/:seccionId/apertura segunda vez: 200 con yaEstaba=true (idempotente)", async () => {
    const res = await agentePart
      .post(`/api/v1/asignaciones/${asignacionId}/secciones/${seccionObligatoriaId}/apertura`)
      .set("X-XSRF-TOKEN", csrfPart)
    expect(res.status).toBe(200)
    const body = res.body as { yaEstaba: boolean }
    expect(body.yaEstaba).toBe(true)
  })

  it("POST apertura (PARTICIPANTE sobre asignacion ajena): 404 (D-S7-D1)", async () => {
    // part2 intenta POST apertura sobre la asignacion de part1: 404 sin revelar
    // existencia del recurso (patron uniforme D-S7-D1).
    const res = await agentePart2
      .post(`/api/v1/asignaciones/${asignacionId}/secciones/${seccionObligatoriaId}/apertura`)
      .set("X-XSRF-TOKEN", csrfPart2)
    expect(res.status).toBe(404)
    // Validacion redundante: part1 sigue viendo su propia asignacion (sanity).
    const ok = await agentePart.get(`/api/v1/asignaciones/${asignacionId}/plan`)
    expect(ok.status).toBe(200)
    // `asignacionAjenaId` queda como fixture documentada para futuros tests.
    expect(asignacionAjenaId.length).toBeGreaterThan(0)
  })
})
