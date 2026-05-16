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
  console.warn("entrevista-ia.e2e.spec: DATABASE_URL ausente — tests SKIP.")
}
if (HAS_DB_URL && !DIST_DISPONIBLE) {
  console.warn(
    "entrevista-ia.e2e.spec: dist/ no encontrado — ejecutar `pnpm --filter @nexott-learn/api build`. SKIP.",
  )
}

const RUN_E2E = HAS_DB_URL && DIST_DISPONIBLE

const ADMIN_EMAIL = "eia-admin-p8c@nttdata.test"
const PARTICIPANTE_EMAIL = "eia-part-p8c@nttdata.test"
const PASSWORD = "Entrev1234!"
const CLIENTE_NOMBRE = "ACME P8c entrevista IA e2e"
const PREFIX = "P8c-eia-"

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

describe.runIf(RUN_E2E)("entrevista-ia e2e (Slice 8 P8c)", () => {
  let app: INestApplication
  let prisma: PrismaClient
  let agenteAdmin: Agent
  let agentePart: Agent
  let csrfAdmin: string
  let csrfPart: string
  let cursoId: string
  let entrevistaIaId: string
  let asignacionPartId: string

  beforeAll(async () => {
    prisma = new PrismaClient()
    try {
      await prisma.$queryRaw`SELECT 1`
    } catch (error) {
      const detalle = error instanceof Error ? error.message : String(error)
      throw new Error(`No se pudo conectar a la BD para los e2e: ${detalle}`)
    }

    const passwordHash = await bcrypt.hash(PASSWORD, 12)
    await upsertUsuario(prisma, ADMIN_EMAIL, "ADMIN", passwordHash, "P8c EIA Admin")
    const colabPartId = await upsertUsuario(
      prisma,
      PARTICIPANTE_EMAIL,
      "PARTICIPANTE",
      passwordHash,
      "P8c EIA Part",
    )

    const cliente = await prisma.cliente.upsert({
      where: { nombre: CLIENTE_NOMBRE },
      update: { activo: true, deletedAt: null },
      create: { nombre: CLIENTE_NOMBRE, activo: true },
      select: { id: true },
    })

    // Limpieza defensiva — borrar artefactos del run anterior.
    const cursosPrev = await prisma.curso.findMany({
      where: { titulo: { contains: PREFIX } },
      select: { id: true, entrevistaIaId: true },
    })
    for (const c of cursosPrev) {
      if (c.entrevistaIaId !== null) {
        await prisma.intentoEntrevistaIA.deleteMany({ where: { entrevistaIaId: c.entrevistaIaId } })
      }
    }
    const cursoIdsPrev = cursosPrev.map((c) => c.id)
    if (cursoIdsPrev.length > 0) {
      await prisma.asignacionCurso.deleteMany({ where: { cursoId: { in: cursoIdsPrev } } })
      await prisma.cursoAreaExigida.deleteMany({ where: { cursoId: { in: cursoIdsPrev } } })
      await prisma.curso.deleteMany({ where: { id: { in: cursoIdsPrev } } })
    }
    for (const c of cursosPrev) {
      if (c.entrevistaIaId !== null) {
        await prisma.entrevistaIA.deleteMany({ where: { id: c.entrevistaIaId } })
      }
    }
    await prisma.idempotencyKey.deleteMany({
      where: {
        scope: { in: ["intento-entrevista-ia.crear", "intento-entrevista-ia.anular"] },
      },
    })
    await prisma.activityLog.deleteMany({
      where: {
        accion: {
          in: [
            "INTENTO_ENTREVISTA_IA_CREADO",
            "INTENTO_ENTREVISTA_IA_FINALIZADO",
            "INTENTO_ENTREVISTA_IA_AJUSTADO",
            "INTENTO_ENTREVISTA_IA_ANULADO",
          ],
        },
      },
    })

    // Antes de crear nuevos, limpiar modulos/secciones/bloques previos.
    await prisma.bloque.deleteMany({
      where: { seccion: { modulo: { titulo: { contains: PREFIX } } } },
    })
    await prisma.seccionSkill.deleteMany({
      where: { seccion: { modulo: { titulo: { contains: PREFIX } } } },
    })
    await prisma.seccion.deleteMany({ where: { modulo: { titulo: { contains: PREFIX } } } })
    await prisma.modulo.deleteMany({ where: { titulo: { contains: PREFIX } } })
    // Limpiar notas_skill que apunten a skills del prefix (de runs anteriores).
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

    const area = await prisma.area.create({
      data: { nombre: `${PREFIX}area`, descripcion: "Area entrevista" },
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
        titulo: "Seccion 1",
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
        contenido: { titulo: "Bloque 1", resumen: "Resumen del bloque." },
        estado: "ACTIVO",
      },
    })
    const curso = await prisma.curso.create({
      data: {
        titulo: `${PREFIX}curso`,
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
    // Plan con un item opcional (no obligatorio) + apertura registrada para
    // que el snapshot tenga contenido pero `planCompleto` salga true (0 items
    // obligatorios = vacuamente completo).
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
            (${ADMIN_EMAIL}, ${PARTICIPANTE_EMAIL}))
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
    csrfAdmin = await loginYObtenerCsrf(agenteAdmin, ADMIN_EMAIL)
    csrfPart = await loginYObtenerCsrf(agentePart, PARTICIPANTE_EMAIL)
  }, 60_000)

  afterAll(async () => {
    try {
      // Limpieza ordenada: notas_area -> intentos -> rubrica -> entrevista
      // -> asignacion + plan -> curso -> area.
      if (entrevistaIaId) {
        const intentos = await prisma.intentoEntrevistaIA.findMany({
          where: { entrevistaIaId },
          select: { id: true },
        })
        const intentoIds = intentos.map((i) => i.id)
        if (intentoIds.length > 0) {
          await prisma.intentoEntrevistaIANotaArea.deleteMany({
            where: { intentoId: { in: intentoIds } },
          })
          await prisma.intentoEntrevistaIASeccionBase.deleteMany({
            where: { intentoId: { in: intentoIds } },
          })
          await prisma.intentoEntrevistaIA.deleteMany({ where: { id: { in: intentoIds } } })
        }
      }
      if (asignacionPartId) {
        await prisma.aperturaSeccion.deleteMany({ where: { asignacionId: asignacionPartId } })
        await prisma.itemPlan.deleteMany({ where: { plan: { asignacionId: asignacionPartId } } })
        await prisma.planEstudio.deleteMany({ where: { asignacionId: asignacionPartId } })
      }
      if (cursoId) {
        await prisma.asignacionCurso.deleteMany({ where: { cursoId } })
        await prisma.cursoAreaExigida.deleteMany({ where: { cursoId } })
        if (entrevistaIaId) {
          await prisma.curso.update({ where: { id: cursoId }, data: { entrevistaIaId: null } })
        }
        await prisma.curso.deleteMany({ where: { id: cursoId } })
      }
      if (entrevistaIaId) {
        await prisma.rubricaEntrevistaIA.deleteMany({ where: { entrevistaIaId } })
        await prisma.entrevistaIA.deleteMany({ where: { id: entrevistaIaId } })
      }
      // Limpia modulos/secciones/bloques del run.
      await prisma.bloque.deleteMany({
        where: { seccion: { modulo: { titulo: { contains: PREFIX } } } },
      })
      await prisma.seccionSkill.deleteMany({
        where: { seccion: { modulo: { titulo: { contains: PREFIX } } } },
      })
      await prisma.seccion.deleteMany({ where: { modulo: { titulo: { contains: PREFIX } } } })
      await prisma.modulo.deleteMany({ where: { titulo: { contains: PREFIX } } })
      const skillsToClean = await prisma.skill.findMany({
        where: { etiquetaVisible: { contains: PREFIX } },
        select: { id: true },
      })
      const skillIdsToClean = skillsToClean.map((s) => s.id)
      if (skillIdsToClean.length > 0) {
        await prisma.historicoNotaSkill.deleteMany({
          where: { notaSkill: { skillId: { in: skillIdsToClean } } },
        })
        await prisma.notaSkill.deleteMany({ where: { skillId: { in: skillIdsToClean } } })
      }
      await prisma.skill.deleteMany({ where: { etiquetaVisible: { contains: PREFIX } } })
      await prisma.area.deleteMany({ where: { nombre: { contains: PREFIX } } })
      await prisma.idempotencyKey.deleteMany({
        where: {
          scope: { in: ["intento-entrevista-ia.crear", "intento-entrevista-ia.anular"] },
        },
      })
    } finally {
      if (app) {
        await app.close()
      }
      await prisma.$disconnect()
    }
  }, 30_000)

  it("E12 GET /cursos/:cursoId/entrevista-ia devuelve definicion", async () => {
    const res = await agenteAdmin
      .get(`/api/v1/cursos/${cursoId}/entrevista-ia`)
      .set("X-XSRF-TOKEN", csrfAdmin)
    expect(res.status).toBe(200)
    expect(res.body.entrevistaIaId).toBe(entrevistaIaId)
    expect(res.body.areas).toHaveLength(1)
  })

  it("E13 GET disponibilidad para ADMIN -> DISPONIBLE", async () => {
    const res = await agenteAdmin
      .get(`/api/v1/asignaciones/${asignacionPartId}/entrevista-ia/disponibilidad`)
      .set("X-XSRF-TOKEN", csrfAdmin)
    expect(res.status).toBe(200)
    expect(res.body.maxPorHora).toBe(5)
  })

  it("E14 POST crear intento happy: devuelve intentoId + primeraPregunta", async () => {
    const key = randomUUID()
    const res = await agentePart
      .post(`/api/v1/asignaciones/${asignacionPartId}/intentos-entrevista-ia`)
      .set("X-XSRF-TOKEN", csrfPart)
      .set("Idempotency-Key", key)
      .send({})
    expect(res.status).toBe(201)
    expect(typeof res.body.intentoId).toBe("string")
    expect(typeof res.body.primeraPregunta).toBe("string")
    // Limpiar para no bloquear INTENTO_EN_CURSO en los siguientes tests.
    await agentePart
      .post(`/api/v1/intentos-entrevista-ia/${res.body.intentoId}/finalizar`)
      .set("X-XSRF-TOKEN", csrfPart)
      .send({})
  })

  it("E14 sin Idempotency-Key -> 422", async () => {
    const res = await agentePart
      .post(`/api/v1/asignaciones/${asignacionPartId}/intentos-entrevista-ia`)
      .set("X-XSRF-TOKEN", csrfPart)
      .send({})
    expect([400, 422]).toContain(res.status)
  })

  it("E15 enviar turno + E16 finalizar (mock IA + replicacion)", async () => {
    // Crear nuevo intento
    const key1 = randomUUID()
    const create = await agentePart
      .post(`/api/v1/asignaciones/${asignacionPartId}/intentos-entrevista-ia`)
      .set("X-XSRF-TOKEN", csrfPart)
      .set("Idempotency-Key", key1)
      .send({})
    expect(create.status).toBe(201)
    const intentoId = create.body.intentoId as string

    // Enviar un turno
    const turno = await agentePart
      .post(`/api/v1/intentos-entrevista-ia/${intentoId}/turnos`)
      .set("X-XSRF-TOKEN", csrfPart)
      .send({ mensaje: "respuesta del colaborador" })
    expect(turno.status).toBe(200)
    expect(typeof turno.body.respuestaIa).toBe("string")

    // Finalizar
    const fin = await agentePart
      .post(`/api/v1/intentos-entrevista-ia/${intentoId}/finalizar`)
      .set("X-XSRF-TOKEN", csrfPart)
      .send({})
    expect(fin.status).toBe(200)
    expect(fin.body.notaGlobal).toBe(75)
    expect(fin.body.aprobado).toBe(true)
    expect(fin.body.notasPorArea).toHaveLength(1)

    // Verificar que se grabaron historico_notas_skill para la skill del area.
    const historicos = await prisma.historicoNotaSkill.findMany({
      where: { origen: "ENTREVISTA_IA" },
    })
    expect(historicos.length).toBeGreaterThan(0)
  })

  it("E19 ajustar sin X-Motivo -> 422", async () => {
    const create = await agentePart
      .post(`/api/v1/asignaciones/${asignacionPartId}/intentos-entrevista-ia`)
      .set("X-XSRF-TOKEN", csrfPart)
      .set("Idempotency-Key", randomUUID())
      .send({})
    const intentoId = create.body.intentoId as string
    await agentePart
      .post(`/api/v1/intentos-entrevista-ia/${intentoId}/finalizar`)
      .set("X-XSRF-TOKEN", csrfPart)
      .send({})
    const res = await agenteAdmin
      .post(`/api/v1/intentos-entrevista-ia/${intentoId}/ajustar`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .send({ notaAjustada: 85 })
    expect(res.status).toBe(422)
  })

  it("E20 anular happy + replay no duplica audit", async () => {
    const create = await agentePart
      .post(`/api/v1/asignaciones/${asignacionPartId}/intentos-entrevista-ia`)
      .set("X-XSRF-TOKEN", csrfPart)
      .set("Idempotency-Key", randomUUID())
      .send({})
    const intentoId = create.body.intentoId as string
    await agentePart
      .post(`/api/v1/intentos-entrevista-ia/${intentoId}/finalizar`)
      .set("X-XSRF-TOKEN", csrfPart)
      .send({})

    const anularKey = randomUUID()
    const res1 = await agenteAdmin
      .post(`/api/v1/intentos-entrevista-ia/${intentoId}/anular`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .set("Idempotency-Key", anularKey)
      .set("X-Motivo", "se cayo la conexion en la entrevista")
      .send({})
    expect(res1.status).toBe(200)
    expect(res1.body.anulado).toBe(true)

    // Replay con misma key — debe devolver respuesta cacheada (no error).
    const res2 = await agenteAdmin
      .post(`/api/v1/intentos-entrevista-ia/${intentoId}/anular`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .set("Idempotency-Key", anularKey)
      .set("X-Motivo", "se cayo la conexion en la entrevista")
      .send({})
    expect(res2.status).toBe(200)

    // Verificar que solo hay 1 audit log INTENTO_ENTREVISTA_IA_ANULADO.
    const audits = await prisma.activityLog.count({
      where: { accion: "INTENTO_ENTREVISTA_IA_ANULADO", recursoId: intentoId },
    })
    expect(audits).toBe(1)
  })

  it("E17 GET intento PARTICIPANTE: no recibe motivoAjuste/notaAjustadaAdmin", async () => {
    const create = await agentePart
      .post(`/api/v1/asignaciones/${asignacionPartId}/intentos-entrevista-ia`)
      .set("X-XSRF-TOKEN", csrfPart)
      .set("Idempotency-Key", randomUUID())
      .send({})
    const intentoId = create.body.intentoId as string
    const res = await agentePart
      .get(`/api/v1/intentos-entrevista-ia/${intentoId}`)
      .set("X-XSRF-TOKEN", csrfPart)
    expect(res.status).toBe(200)
    expect("motivoAjusteOAnulacion" in res.body).toBe(false)
    expect("notaAjustadaAdmin" in res.body).toBe(false)
  })

  it("E18 GET listado paginado admin", async () => {
    const res = await agenteAdmin
      .get(`/api/v1/asignaciones/${asignacionPartId}/intentos-entrevista-ia`)
      .set("X-XSRF-TOKEN", csrfAdmin)
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.data)).toBe(true)
    expect(res.body.meta.total).toBeGreaterThanOrEqual(0)
  })
})
