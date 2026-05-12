// biome-ignore lint/correctness/noNodejsModules: crypto.randomUUID para Idempotency-Key.
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
  console.warn("intentos-bloque.e2e.spec: DATABASE_URL ausente — tests SKIP.")
}
if (HAS_DB_URL && !DIST_DISPONIBLE) {
  console.warn(
    "intentos-bloque.e2e.spec: dist/ no encontrado — ejecutar `pnpm --filter @nexott-learn/api build`. SKIP.",
  )
}

const RUN_E2E = HAS_DB_URL && DIST_DISPONIBLE

const ADMIN_EMAIL = "intblq-admin-p7@nttdata.test"
const PARTICIPANTE_EMAIL = "intblq-part-p7@nttdata.test"
const PARTICIPANTE2_EMAIL = "intblq-part2-p7@nttdata.test"
const PASSWORD = "Intblq1234!"
const CLIENTE_NOMBRE = "ACME P7 intentos-bloque e2e"
const PREFIX = "P7-intblq-"

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

describe.runIf(RUN_E2E)("intentos-bloque e2e (P7b — FIX-P7-cierre)", () => {
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
  let bloqueQuizId: string
  let bloqueCodigoTestsId: string
  let colabPartId: string
  let colabPart2Id: string
  let throttlerStorageFake: { reset: () => void }

  // Contenido de bloque QUIZ — 1 pregunta, opcion B correcta, peso 1.
  const contenidoQuiz = {
    preguntas: [
      {
        id: "q1",
        enunciado: "¿Capital de Francia?",
        opciones: [
          { id: "a", texto: "Madrid" },
          { id: "b", texto: "Paris" },
          { id: "c", texto: "Roma" },
        ],
        respuestaCorrectaId: "b",
        pesoPunto: 1,
      },
    ],
  }
  const respuestasCorrectas = { preguntas: [{ preguntaId: "q1", opcionElegidaId: "b" }] }

  beforeAll(async () => {
    prisma = new PrismaClient()
    try {
      await prisma.$queryRaw`SELECT 1`
    } catch (error) {
      const detalle = error instanceof Error ? error.message : String(error)
      throw new Error(`No se pudo conectar a la BD para los e2e: ${detalle}`)
    }

    const passwordHash = await bcrypt.hash(PASSWORD, 12)
    await upsertUsuario(prisma, ADMIN_EMAIL, "ADMIN", passwordHash, "P7 IntBlq Admin")
    colabPartId = await upsertUsuario(
      prisma,
      PARTICIPANTE_EMAIL,
      "PARTICIPANTE",
      passwordHash,
      "P7 IntBlq Part",
    )
    colabPart2Id = await upsertUsuario(
      prisma,
      PARTICIPANTE2_EMAIL,
      "PARTICIPANTE",
      passwordHash,
      "P7 IntBlq Part 2",
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
      select: { id: true },
    })
    const cursoIdsPrev = cursosPrev.map((c) => c.id)
    if (cursoIdsPrev.length > 0) {
      await prisma.intentoBloque.deleteMany({ where: { cursoId: { in: cursoIdsPrev } } })
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
        await prisma.bloque.deleteMany({ where: { seccionId: { in: seccionIdsPrev } } })
        await prisma.seccionSkill.deleteMany({ where: { seccionId: { in: seccionIdsPrev } } })
        await prisma.seccion.deleteMany({ where: { id: { in: seccionIdsPrev } } })
      }
      await prisma.modulo.deleteMany({ where: { id: { in: moduloIdsPrev } } })
    }
    const colIds = [colabPartId, colabPart2Id]
    await prisma.historicoNotaSkill.deleteMany({
      where: { notaSkill: { colaboradorId: { in: colIds } } },
    })
    await prisma.notaSkill.deleteMany({ where: { colaboradorId: { in: colIds } } })
    await prisma.skill.deleteMany({ where: { etiquetaVisible: { contains: PREFIX } } })
    await prisma.area.deleteMany({ where: { nombre: { contains: PREFIX } } })
    await prisma.idempotencyKey.deleteMany({ where: { scope: "intento-bloque" } })

    const area = await prisma.area.create({
      data: { nombre: `${PREFIX}area`, descripcion: "Area intblq" },
      select: { id: true },
    })
    const skill = await prisma.skill.create({
      data: { etiquetaVisible: `${PREFIX}skill`, areaId: area.id, estado: "ACTIVA" },
      select: { id: true },
    })

    const modulo = await prisma.modulo.create({
      data: { titulo: `${PREFIX}modulo` },
      select: { id: true },
    })
    const seccion = await prisma.seccion.create({
      data: { moduloId: modulo.id, titulo: `${PREFIX}seccion`, orden: 1 },
      select: { id: true },
    })
    await prisma.seccionSkill.create({ data: { seccionId: seccion.id, skillId: skill.id } })

    const bloqueQuiz = await prisma.bloque.create({
      data: {
        seccionId: seccion.id,
        orden: 1,
        tipo: "QUIZ",
        esEvaluable: true,
        skillQueMideId: skill.id,
        contenido: contenidoQuiz,
        estado: "ACTIVO",
        version: 1,
      },
      select: { id: true },
    })
    bloqueQuizId = bloqueQuiz.id

    const bloqueCodigo = await prisma.bloque.create({
      data: {
        seccionId: seccion.id,
        orden: 2,
        tipo: "CODIGO_TESTS",
        esEvaluable: true,
        skillQueMideId: skill.id,
        contenido: { pruebas: [] },
        estado: "ACTIVO",
        version: 1,
      },
      select: { id: true },
    })
    bloqueCodigoTestsId = bloqueCodigo.id

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

    await prisma.asignacionCurso.create({
      data: {
        colaboradorId: colabPartId,
        cursoId,
        rol: "ASIGNADO",
        estadoAsignado: "ASIGNADO",
      },
    })
    await prisma.asignacionCurso.create({
      data: {
        colaboradorId: colabPart2Id,
        cursoId,
        rol: "ASIGNADO",
        estadoAsignado: "ASIGNADO",
      },
    })

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
      await prisma.intentoBloque.deleteMany({ where: { cursoId } })
      await prisma.idempotencyKey.deleteMany({ where: { scope: "intento-bloque" } })
      const auditAcciones: ("INTENTO_BLOQUE_INVALIDADO" | "PLAN_RECALCULADO")[] = [
        "INTENTO_BLOQUE_INVALIDADO",
        "PLAN_RECALCULADO",
      ]
      await prisma.activityLog.deleteMany({ where: { accion: { in: auditAcciones } } })
      await prisma.asignacionCurso.deleteMany({ where: { cursoId } })
      await prisma.cursoSkillExigida.deleteMany({ where: { cursoId } })
      await prisma.cursoAreaExigida.deleteMany({ where: { cursoId } })
      await prisma.cursoModuloHabilitado.deleteMany({ where: { cursoId } })
      await prisma.curso.deleteMany({ where: { id: cursoId } })

      const seccionesPrev = await prisma.seccion.findMany({
        where: { modulo: { titulo: { contains: PREFIX } } },
        select: { id: true },
      })
      const seccionIds = seccionesPrev.map((s) => s.id)
      if (seccionIds.length > 0) {
        await prisma.bloque.deleteMany({ where: { seccionId: { in: seccionIds } } })
        await prisma.seccionSkill.deleteMany({ where: { seccionId: { in: seccionIds } } })
        await prisma.seccion.deleteMany({ where: { id: { in: seccionIds } } })
      }
      await prisma.modulo.deleteMany({ where: { titulo: { contains: PREFIX } } })

      const colIds = [colabPartId, colabPart2Id]
      await prisma.historicoNotaSkill.deleteMany({
        where: { notaSkill: { colaboradorId: { in: colIds } } },
      })
      await prisma.notaSkill.deleteMany({ where: { colaboradorId: { in: colIds } } })
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
      console.warn(`intentos-bloque.e2e cleanup fallo (no rompe teardown): ${detalle}`)
    }
    if (app) {
      await app.close()
    }
    if (prisma) {
      await prisma.$disconnect()
    }
  })

  it("POST /intentos-bloque con Idempotency-Key UUID v4: 201 + shape esperado", async () => {
    const key = randomUUID()
    const res = await agentePart
      .post("/api/v1/intentos-bloque")
      .set("X-XSRF-TOKEN", csrfPart)
      .set("Idempotency-Key", key)
      .send({ bloqueId: bloqueQuizId, cursoId, respuestas: respuestasCorrectas })
    expect(res.status).toBe(201)
    const body = res.body as {
      intentoId: string
      bloqueId: string
      nota: number
      esMejorIntento: boolean
      versionBloque: number
      estaInvalidado: boolean
    }
    expect(body.bloqueId).toBe(bloqueQuizId)
    expect(body.nota).toBe(100)
    expect(body.esMejorIntento).toBe(true)
    expect(body.versionBloque).toBe(1)
    expect(body.estaInvalidado).toBe(false)
  })

  it("POST /intentos-bloque replay con misma key + mismo body: no duplica fila", async () => {
    const key = randomUUID()
    const body = { bloqueId: bloqueQuizId, cursoId, respuestas: respuestasCorrectas }
    const r1 = await agentePart
      .post("/api/v1/intentos-bloque")
      .set("X-XSRF-TOKEN", csrfPart)
      .set("Idempotency-Key", key)
      .send(body)
    expect([200, 201]).toContain(r1.status)
    const intentoId = (r1.body as { intentoId: string }).intentoId

    const r2 = await agentePart
      .post("/api/v1/intentos-bloque")
      .set("X-XSRF-TOKEN", csrfPart)
      .set("Idempotency-Key", key)
      .send(body)
    expect([200, 201]).toContain(r2.status)
    expect((r2.body as { intentoId: string }).intentoId).toBe(intentoId)
  })

  it("POST /intentos-bloque sin Idempotency-Key: 400 idempotencyKeyRequerida", async () => {
    const res = await agentePart
      .post("/api/v1/intentos-bloque")
      .set("X-XSRF-TOKEN", csrfPart)
      .send({ bloqueId: bloqueQuizId, cursoId, respuestas: respuestasCorrectas })
    expect(res.status).toBe(400)
    expect((res.body as { code: string }).code).toBe("IDEMPOTENCY_KEY_REQUERIDA")
  })

  it("POST /intentos-bloque sobre bloque CODIGO_TESTS: 422 tipoBloqueNoSoportadoMvp", async () => {
    const key = randomUUID()
    const res = await agentePart
      .post("/api/v1/intentos-bloque")
      .set("X-XSRF-TOKEN", csrfPart)
      .set("Idempotency-Key", key)
      .send({
        bloqueId: bloqueCodigoTestsId,
        cursoId,
        respuestas: respuestasCorrectas,
      })
    expect(res.status).toBe(422)
    expect((res.body as { code: string }).code).toBe("TIPO_BLOQUE_NO_SOPORTADO_MVP")
  })

  it("POST /intentos-bloque genera transicion ASIGNADO→EN_PROGRESO con histórico", async () => {
    const hist = await prisma.historicoEstadoAsignacion.findFirst({
      where: {
        asignacion: { colaboradorId: colabPartId, cursoId },
        motivo: "TRANSICION_AUTOMATICA_POR_INTENTO",
      },
      orderBy: { fecha: "desc" },
      select: { estadoAnterior: true, estadoNuevo: true },
    })
    expect(hist).not.toBeNull()
    expect(hist?.estadoAnterior).toBe("ASIGNADO:ASIGNADO")
    expect(hist?.estadoNuevo).toBe("ASIGNADO:EN_PROGRESO")
  })

  it("GET intentos ADMIN con ?incluirInvalidados=true: incluye filas invalidadas", async () => {
    // Inyectamos un intento invalidado adicional para esta validacion.
    await prisma.intentoBloque.create({
      data: {
        colaboradorId: colabPartId,
        bloqueId: bloqueQuizId,
        skillId: (
          await prisma.bloque.findUniqueOrThrow({
            where: { id: bloqueQuizId },
            select: { skillQueMideId: true },
          })
        ).skillQueMideId as string,
        cursoId,
        nota: 50,
        respuestas: respuestasCorrectas,
        versionBloque: 1,
        esMejorIntento: false,
        estaInvalidado: true,
      },
    })
    const res = await agenteAdmin
      .get(
        `/api/v1/colaboradores/${colabPartId}/bloques/${bloqueQuizId}/intentos?incluirInvalidados=true`,
      )
      .set("X-XSRF-TOKEN", csrfAdmin)
    expect(res.status).toBe(200)
    const body = res.body as { data: ReadonlyArray<{ estaInvalidado: boolean }> }
    expect(body.data.some((i) => i.estaInvalidado === true)).toBe(true)
  })

  it("GET intentos PARTICIPANTE con ?incluirInvalidados=true: ignora flag (D-S7-D2)", async () => {
    const res = await agentePart
      .get(
        `/api/v1/colaboradores/${colabPartId}/bloques/${bloqueQuizId}/intentos?incluirInvalidados=true`,
      )
      .set("X-XSRF-TOKEN", csrfPart)
    expect(res.status).toBe(200)
    const body = res.body as { data: ReadonlyArray<{ estaInvalidado: boolean }> }
    expect(body.data.every((i) => i.estaInvalidado === false)).toBe(true)
  })

  it("GET intentos PARTICIPANTE sobre colaborador ajeno: 404 (D-S7-D1)", async () => {
    const res = await agentePart2
      .get(`/api/v1/colaboradores/${colabPartId}/bloques/${bloqueQuizId}/intentos`)
      .set("X-XSRF-TOKEN", csrfPart2)
    expect(res.status).toBe(404)
  })

  it("POST /intentos-bloque/:id/invalidar (ADMIN) con X-Motivo: 200 + estaInvalidado=true + audit", async () => {
    const intento = await prisma.intentoBloque.findFirstOrThrow({
      where: { colaboradorId: colabPartId, bloqueId: bloqueQuizId, estaInvalidado: false },
      select: { id: true },
      orderBy: { fecha: "desc" },
    })
    const res = await agenteAdmin
      .post(`/api/v1/intentos-bloque/${intento.id}/invalidar`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .set("X-Motivo", "Anulado por error en enunciado")
    expect(res.status).toBe(200)
    const body = res.body as { estaInvalidado: boolean }
    expect(body.estaInvalidado).toBe(true)
    const log = await prisma.activityLog.findFirst({
      where: { accion: "INTENTO_BLOQUE_INVALIDADO", recursoId: intento.id },
      select: { exito: true },
    })
    expect(log).not.toBeNull()
    expect(log?.exito).toBe(true)
  })

  it("POST /invalidar segundo intento sobre el mismo: 409 conflictIntentoYaInvalidado", async () => {
    const yaInvalidado = await prisma.intentoBloque.findFirstOrThrow({
      where: { colaboradorId: colabPartId, bloqueId: bloqueQuizId, estaInvalidado: true },
      select: { id: true },
    })
    const res = await agenteAdmin
      .post(`/api/v1/intentos-bloque/${yaInvalidado.id}/invalidar`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .set("X-Motivo", "Doble invalidacion")
    expect(res.status).toBe(409)
    expect((res.body as { code: string }).code).toBe("CONFLICT_INTENTO_YA_INVALIDADO")
  })
})
