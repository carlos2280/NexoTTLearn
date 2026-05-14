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
  console.warn("catalogo-admin-bloques-clientes.e2e: DATABASE_URL ausente — tests SKIP.")
}
if (HAS_DB_URL && !DIST_DISPONIBLE) {
  console.warn(
    "catalogo-admin-bloques-clientes.e2e: dist/ no encontrado — ejecutar `pnpm --filter @nexott-learn/api build`. SKIP.",
  )
}

const RUN_E2E = HAS_DB_URL && DIST_DISPONIBLE

const ADMIN_EMAIL = "catalogo-admin-p3c-bc@nttdata.test"
const ADMIN_PASSWORD = "Catalogo1234!"
const FIXTURE_SUFFIX = "-p3c-e2e-bc"

// Contenidos validos minimos para los tipos usados en este e2e. El backend
// valida el shape de `Bloque.contenido` contra los schemas Zod oficiales
// (packages/shared-types/src/catalogo/bloques/contenido/), por lo que ya no
// es admisible enviar shapes inventados como `{ texto: "..." }`.
const CONTENIDO_PARRAFO_VACIO = { html: "", textoPlano: "", tiempoLecturaMin: 0 } as const
const CONTENIDO_PARRAFO_V1 = {
  html: "<p>v1</p>",
  textoPlano: "v1",
  tiempoLecturaMin: 1,
} as const
const CONTENIDO_PARRAFO_COSMETICO = {
  html: "<p>v1-cosmetico</p>",
  textoPlano: "v1-cosmetico",
  tiempoLecturaMin: 1,
} as const

function buildContenidoQuiz(enunciado: string): Record<string, unknown> {
  return {
    intentosMax: null,
    solucionVisible: "al_aprobar",
    ordenAleatorio: false,
    notaMinima: 60,
    preguntas: [
      {
        id: "p1",
        tipo: "OPCION_UNICA",
        enunciado,
        pesoPunto: 1,
        opciones: [
          { id: "a", texto: "A", esCorrecta: true },
          { id: "b", texto: "B", esCorrecta: false },
        ],
      },
    ],
  }
}

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

describe.runIf(RUN_E2E)("catalogo-admin bloques + clientes e2e (P3c)", () => {
  let app: INestApplication
  let agente: Agent
  let csrf: string
  let prisma: PrismaClient
  let areaId: string
  let skillActivaId: string
  let moduloId: string
  let seccionId: string

  beforeAll(async () => {
    prisma = new PrismaClient()
    try {
      await prisma.$queryRaw`SELECT 1`
    } catch (error) {
      const detalle = error instanceof Error ? error.message : String(error)
      throw new Error(`No se pudo conectar a la BD para los e2e: ${detalle}`)
    }

    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12)
    const col = await prisma.colaborador.upsert({
      where: { email: ADMIN_EMAIL },
      update: { nombre: "Catalogo Admin P3c BC", estadoEmpleado: "ACTIVO" },
      create: { email: ADMIN_EMAIL, nombre: "Catalogo Admin P3c BC", estadoEmpleado: "ACTIVO" },
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
        rol: "ADMIN",
        mfaHabilitado: false,
        requiereSetupMfa: false,
      },
      create: {
        colaboradorId: col.id,
        rol: "ADMIN",
        passwordHash,
        requiereCambioPassword: false,
        intentosFallidos: 0,
        bloqueado: false,
        mfaHabilitado: false,
      },
    })
    await prisma.$executeRaw`
      DELETE FROM sesiones
      WHERE (sess::jsonb->>'usuarioId') IN (
        SELECT id::text FROM usuarios WHERE colaborador_id = ${col.id}::uuid
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
    agente = supertest.agent(app.getHttpServer())

    const login = await agente
      .post("/api/v1/auth/login")
      .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
    if (login.status !== 200) {
      throw new Error(`Login admin P3c-BC fallo con status ${login.status}`)
    }
    const token = extraerXsrf(login)
    if (!token) {
      throw new Error("No se obtuvo XSRF token tras login")
    }
    csrf = token

    // Fixtures comunes: area + skill activa + modulo + seccion. Cada test crea
    // sus propios bloques/clientes dentro y limpia con suffix-LIKE en afterAll.
    const area = await prisma.area.create({
      data: { nombre: `Area-Base${FIXTURE_SUFFIX}` },
      select: { id: true },
    })
    areaId = area.id
    const skill = await prisma.skill.create({
      data: { etiquetaVisible: `skill.activa${FIXTURE_SUFFIX}`, areaId },
      select: { id: true },
    })
    skillActivaId = skill.id
    const modulo = await prisma.modulo.create({
      data: { titulo: `Modulo-Base${FIXTURE_SUFFIX}` },
      select: { id: true },
    })
    moduloId = modulo.id
    const seccion = await prisma.seccion.create({
      data: { moduloId, titulo: `Sec-Base${FIXTURE_SUFFIX}`, orden: 1 },
      select: { id: true },
    })
    seccionId = seccion.id
  }, 60_000)

  afterAll(async () => {
    try {
      const suffixLike = `%${FIXTURE_SUFFIX}%`
      await prisma.$executeRaw`
        DELETE FROM bloques WHERE seccion_id IN (
          SELECT id FROM secciones WHERE titulo LIKE ${suffixLike}
        )
      `
      await prisma.$executeRaw`
        DELETE FROM secciones_skills WHERE seccion_id IN (
          SELECT id FROM secciones WHERE titulo LIKE ${suffixLike}
        )
      `
      await prisma.$executeRaw`
        DELETE FROM secciones WHERE modulo_id IN (
          SELECT id FROM modulos WHERE titulo LIKE ${suffixLike}
        )
      `
      await prisma.$executeRaw`DELETE FROM modulos WHERE titulo LIKE ${suffixLike}`
      await prisma.$executeRaw`DELETE FROM skills WHERE etiqueta_visible LIKE ${suffixLike}`
      await prisma.$executeRaw`DELETE FROM cursos WHERE titulo LIKE ${suffixLike}`
      await prisma.$executeRaw`DELETE FROM clientes WHERE nombre LIKE ${suffixLike}`
      await prisma.$executeRaw`DELETE FROM areas WHERE nombre LIKE ${suffixLike}`

      const col = await prisma.colaborador.findUnique({
        where: { email: ADMIN_EMAIL },
        select: { id: true },
      })
      if (col) {
        await prisma.$executeRaw`
          DELETE FROM sesiones
          WHERE (sess::jsonb->>'usuarioId') IN (
            SELECT id::text FROM usuarios WHERE colaborador_id = ${col.id}::uuid
          )
        `
        await prisma.activityLog.deleteMany({ where: { usuario: { colaboradorId: col.id } } })
        await prisma.usuario.deleteMany({ where: { colaboradorId: col.id } })
        await prisma.colaborador.delete({ where: { id: col.id } })
      }
    } catch (error) {
      const detalle = error instanceof Error ? error.message : String(error)
      console.warn(`catalogo-admin P3c-BC cleanup fallo (no rompe teardown): ${detalle}`)
    }

    if (app) {
      await app.close()
    }
    if (prisma) {
      await prisma.$disconnect()
    }
  })

  // ===== BLOQUES =====

  it("POST /secciones/:seccionId/bloques: 201 con QUIZ + skill activa", async () => {
    const res = await agente
      .post(`/api/v1/catalogo/secciones/${seccionId}/bloques`)
      .set("X-XSRF-TOKEN", csrf)
      .send({
        tipo: "QUIZ",
        esEvaluable: true,
        skillQueMideId: skillActivaId,
        contenido: buildContenidoQuiz("Pregunta 1"),
      })
    expect(res.status).toBe(201)
    const body = res.body as { id: string; version: number; estado: string }
    expect(body.version).toBe(1)
    expect(body.estado).toBe("ACTIVO")

    const log = await prisma.activityLog.findFirst({
      where: { accion: "BLOQUE_CREADO", recursoId: body.id },
      select: { id: true },
    })
    expect(log).not.toBeNull()
  })

  it("POST /bloques esEvaluable=true sin skillQueMideId: 400 INVALID_BODY (Zod)", async () => {
    const res = await agente
      .post(`/api/v1/catalogo/secciones/${seccionId}/bloques`)
      .set("X-XSRF-TOKEN", csrf)
      .send({ tipo: "QUIZ", esEvaluable: true, contenido: buildContenidoQuiz("Pregunta 1") })
    expect(res.status).toBe(400)
    expect((res.body as { code: string }).code).toBe("INVALID_BODY")
  })

  it("PATCH /bloques/:id COSMETICO sin motivo: 200 y version no cambia", async () => {
    const creado = await agente
      .post(`/api/v1/catalogo/secciones/${seccionId}/bloques`)
      .set("X-XSRF-TOKEN", csrf)
      .send({
        tipo: "PARRAFO",
        esEvaluable: false,
        contenido: CONTENIDO_PARRAFO_V1,
      })
    const bloqueId = (creado.body as { id: string; version: number }).id

    const res = await agente
      .patch(`/api/v1/catalogo/bloques/${bloqueId}`)
      .set("X-XSRF-TOKEN", csrf)
      .send({ tipoEdicion: "COSMETICO", contenido: CONTENIDO_PARRAFO_COSMETICO })
    expect(res.status).toBe(200)
    const body = res.body as { versionAnterior: number; versionNueva: number; tipoEdicion: string }
    expect(body.tipoEdicion).toBe("COSMETICO")
    expect(body.versionAnterior).toBe(body.versionNueva)
  })

  it("PATCH /bloques/:id CAMBIA_EVALUACION sin motivo: 422; con motivo: 200 + version++", async () => {
    const creado = await agente
      .post(`/api/v1/catalogo/secciones/${seccionId}/bloques`)
      .set("X-XSRF-TOKEN", csrf)
      .send({
        tipo: "QUIZ",
        esEvaluable: true,
        skillQueMideId: skillActivaId,
        contenido: buildContenidoQuiz("v1"),
      })
    const bloqueId = (creado.body as { id: string }).id

    const sinMotivo = await agente
      .patch(`/api/v1/catalogo/bloques/${bloqueId}`)
      .set("X-XSRF-TOKEN", csrf)
      .send({ tipoEdicion: "CAMBIA_EVALUACION", contenido: buildContenidoQuiz("v2") })
    expect(sinMotivo.status).toBe(422)
    expect((sinMotivo.body as { code: string }).code).toBe("MOTIVO_REQUERIDO")

    const conMotivo = await agente
      .patch(`/api/v1/catalogo/bloques/${bloqueId}`)
      .set("X-XSRF-TOKEN", csrf)
      .set("X-Motivo", "ajuste de rubrica")
      .send({ tipoEdicion: "CAMBIA_EVALUACION", contenido: buildContenidoQuiz("v3") })
    expect(conMotivo.status).toBe(200)
    const body = conMotivo.body as {
      tipoEdicion: string
      versionAnterior: number
      versionNueva: number
      intentosInvalidados: number
    }
    expect(body.tipoEdicion).toBe("CAMBIA_EVALUACION")
    expect(body.versionNueva).toBe(body.versionAnterior + 1)
    expect(body.intentosInvalidados).toBe(0)

    const log = await prisma.activityLog.findFirst({
      where: { accion: "BLOQUE_EDITADO_EVALUACION", recursoId: bloqueId },
      orderBy: { createdAt: "desc" },
      select: { metadata: true },
    })
    expect(log).not.toBeNull()
    const meta = log?.metadata as { motivo?: string; tipoEdicion?: string } | null
    expect(meta?.motivo).toBe("ajuste de rubrica")
    expect(meta?.tipoEdicion).toBe("CAMBIA_EVALUACION")
  })

  it("DELETE /bloques/:id: 200 con previewImpacto vacio + estado ELIMINADO", async () => {
    const creado = await agente
      .post(`/api/v1/catalogo/secciones/${seccionId}/bloques`)
      .set("X-XSRF-TOKEN", csrf)
      .send({ tipo: "PARRAFO", esEvaluable: false, contenido: CONTENIDO_PARRAFO_VACIO })
    const bloqueId = (creado.body as { id: string }).id

    const res = await agente
      .delete(`/api/v1/catalogo/bloques/${bloqueId}`)
      .set("X-XSRF-TOKEN", csrf)
      .set("X-Motivo", "limpieza")
    expect(res.status).toBe(200)
    const body = res.body as { previewImpacto: { colaboradoresAfectados: readonly unknown[] } }
    expect(body.previewImpacto.colaboradoresAfectados).toEqual([])

    const enBd = await prisma.bloque.findUnique({
      where: { id: bloqueId },
      select: { estado: true },
    })
    expect(enBd?.estado).toBe("ELIMINADO")
  })

  // ===== CLIENTES =====

  it("POST /clientes: 201 + audit CLIENTE_CREADO", async () => {
    const nombre = `Cliente-OK${FIXTURE_SUFFIX}`
    const res = await agente
      .post("/api/v1/catalogo/clientes")
      .set("X-XSRF-TOKEN", csrf)
      .send({ nombre, datosContacto: { email: "ops@test" } })
    expect(res.status).toBe(201)
    const body = res.body as { id: string; datosContacto: { email: string } | null }
    expect(body.datosContacto?.email).toBe("ops@test")
    const log = await prisma.activityLog.findFirst({
      where: { accion: "CLIENTE_CREADO", recursoId: body.id },
      select: { id: true },
    })
    expect(log).not.toBeNull()
  })

  it("POST /clientes con nombre duplicado: 409 CONFLICT_CLIENTE_NOMBRE_DUPLICADO", async () => {
    const nombre = `Cliente-Dup${FIXTURE_SUFFIX}`
    const r1 = await agente
      .post("/api/v1/catalogo/clientes")
      .set("X-XSRF-TOKEN", csrf)
      .send({ nombre })
    expect(r1.status).toBe(201)
    const r2 = await agente
      .post("/api/v1/catalogo/clientes")
      .set("X-XSRF-TOKEN", csrf)
      .send({ nombre })
    expect(r2.status).toBe(409)
    expect((r2.body as { code: string }).code).toBe("CONFLICT_CLIENTE_NOMBRE_DUPLICADO")
  })

  it("PATCH /clientes/:id cambia nombre sin motivo: 422; solo datosContacto: 200", async () => {
    const creado = await agente
      .post("/api/v1/catalogo/clientes")
      .set("X-XSRF-TOKEN", csrf)
      .send({ nombre: `Cliente-Patch${FIXTURE_SUFFIX}` })
    const id = (creado.body as { id: string }).id

    const sinMotivo = await agente
      .patch(`/api/v1/catalogo/clientes/${id}`)
      .set("X-XSRF-TOKEN", csrf)
      .send({ nombre: `Cliente-Patch-Nuevo${FIXTURE_SUFFIX}` })
    expect(sinMotivo.status).toBe(422)
    expect((sinMotivo.body as { code: string }).code).toBe("MOTIVO_REQUERIDO")

    const soloContacto = await agente
      .patch(`/api/v1/catalogo/clientes/${id}`)
      .set("X-XSRF-TOKEN", csrf)
      .send({ datosContacto: { telefono: "555-0100" } })
    expect(soloContacto.status).toBe(200)
  })

  it("DELETE /clientes/:id con cursos: 409 CONFLICT_CLIENTE_CON_CURSOS", async () => {
    const cliente = await prisma.cliente.create({
      data: { nombre: `Cliente-Con-Cursos${FIXTURE_SUFFIX}` },
      select: { id: true },
    })
    await prisma.curso.create({
      data: {
        titulo: `Curso-Bloqueante${FIXTURE_SUFFIX}`,
        clienteId: cliente.id,
        fechaInicio: new Date("2026-01-01"),
        fechaDeadline: new Date("2026-12-31"),
      },
    })
    const res = await agente
      .delete(`/api/v1/catalogo/clientes/${cliente.id}`)
      .set("X-XSRF-TOKEN", csrf)
      .set("X-Motivo", "off-boarding")
    expect(res.status).toBe(409)
    expect((res.body as { code: string }).code).toBe("CONFLICT_CLIENTE_CON_CURSOS")
  })

  // Sello: usar las variables fixture en algun assert directo para evitar
  // warning de "no usado" si la suite cambia.
  it("fixture base coherente (area + skill + modulo + seccion creados)", () => {
    expect(areaId).toMatch(/^[0-9a-f-]{36}$/)
    expect(skillActivaId).toMatch(/^[0-9a-f-]{36}$/)
    expect(moduloId).toMatch(/^[0-9a-f-]{36}$/)
    expect(seccionId).toMatch(/^[0-9a-f-]{36}$/)
  })
})
