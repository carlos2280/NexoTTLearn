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
  console.warn("catalogo-admin-modulos-secciones.e2e: DATABASE_URL ausente — tests SKIP.")
}
if (HAS_DB_URL && !DIST_DISPONIBLE) {
  console.warn(
    "catalogo-admin-modulos-secciones.e2e: dist/ no encontrado — ejecutar `pnpm --filter @nexott-learn/api build`. SKIP.",
  )
}

const RUN_E2E = HAS_DB_URL && DIST_DISPONIBLE

const ADMIN_EMAIL = "catalogo-admin-p3c-ms@nttdata.test"
const ADMIN_PASSWORD = "Catalogo1234!"
const FIXTURE_SUFFIX = "-p3c-e2e-ms"

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

describe.runIf(RUN_E2E)("catalogo-admin modulos + secciones e2e (P3c)", () => {
  let app: INestApplication
  let agente: Agent
  let csrf: string
  let prisma: PrismaClient

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
      update: { nombre: "Catalogo Admin P3c MS", estadoEmpleado: "ACTIVO" },
      create: { email: ADMIN_EMAIL, nombre: "Catalogo Admin P3c MS", estadoEmpleado: "ACTIVO" },
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
      throw new Error(`Login admin P3c-MS fallo con status ${login.status}`)
    }
    const token = extraerXsrf(login)
    if (!token) {
      throw new Error("No se obtuvo XSRF token tras login")
    }
    csrf = token
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
        DELETE FROM secciones_skills WHERE seccion_id IN (
          SELECT s.id FROM secciones s JOIN modulos m ON s.modulo_id = m.id WHERE m.titulo LIKE ${suffixLike}
        )
      `
      await prisma.$executeRaw`
        DELETE FROM cursos_modulos_habilitados WHERE modulo_id IN (
          SELECT id FROM modulos WHERE titulo LIKE ${suffixLike}
        )
      `
      await prisma.$executeRaw`
        DELETE FROM cursos_skills_exigidas WHERE curso_id IN (
          SELECT id FROM cursos WHERE titulo LIKE ${suffixLike}
        )
      `
      await prisma.$executeRaw`
        DELETE FROM cursos_areas_exigidas WHERE curso_id IN (
          SELECT id FROM cursos WHERE titulo LIKE ${suffixLike}
        )
      `
      await prisma.$executeRaw`
        DELETE FROM historico_estados_modulo WHERE modulo_id IN (
          SELECT id FROM modulos WHERE titulo LIKE ${suffixLike}
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
      console.warn(`catalogo-admin P3c-MS cleanup fallo (no rompe teardown): ${detalle}`)
    }

    if (app) {
      await app.close()
    }
    if (prisma) {
      await prisma.$disconnect()
    }
  })

  async function crearModulo(titulo: string): Promise<string> {
    const res = await agente
      .post("/api/v1/catalogo/modulos")
      .set("X-XSRF-TOKEN", csrf)
      .send({ titulo })
    expect(res.status).toBe(201)
    return (res.body as { id: string }).id
  }

  it("POST /modulos: 201 + audit MODULO_CREADO", async () => {
    const titulo = `Modulo-OK${FIXTURE_SUFFIX}`
    const res = await agente
      .post("/api/v1/catalogo/modulos")
      .set("X-XSRF-TOKEN", csrf)
      .send({ titulo, descripcion: "creado por e2e" })
    expect(res.status).toBe(201)
    const id = (res.body as { id: string }).id
    const log = await prisma.activityLog.findFirst({
      where: { accion: "MODULO_CREADO", recursoId: id },
      select: { id: true },
    })
    expect(log).not.toBeNull()
  })

  it("PATCH /modulos/:id cambia titulo sin motivo: 422 MOTIVO_REQUERIDO", async () => {
    const id = await crearModulo(`Modulo-Sin-Motivo${FIXTURE_SUFFIX}`)
    const res = await agente
      .patch(`/api/v1/catalogo/modulos/${id}`)
      .set("X-XSRF-TOKEN", csrf)
      .send({ titulo: `Modulo-Renombrado${FIXTURE_SUFFIX}` })
    expect(res.status).toBe(422)
    expect((res.body as { code: string }).code).toBe("MOTIVO_REQUERIDO")
  })

  it("PATCH /modulos/:id solo descripcion: 200 sin motivo", async () => {
    const id = await crearModulo(`Modulo-Desc${FIXTURE_SUFFIX}`)
    const res = await agente
      .patch(`/api/v1/catalogo/modulos/${id}`)
      .set("X-XSRF-TOKEN", csrf)
      .send({ descripcion: "actualizada sin motivo" })
    expect(res.status).toBe(200)
  })

  it("POST /modulos/:id/archivar sin impacto: 200 con preview vacio", async () => {
    const id = await crearModulo(`Modulo-Archivar${FIXTURE_SUFFIX}`)
    const res = await agente
      .post(`/api/v1/catalogo/modulos/${id}/archivar`)
      .set("X-XSRF-TOKEN", csrf)
      .set("X-Motivo", "obsoleto")
      .send({})
    expect(res.status).toBe(200)
    const body = res.body as {
      modulo: { id: string; estado: string }
      previewImpacto: {
        cursosActivosAfectados: readonly unknown[]
        skillsHuerfanas: readonly unknown[]
      }
    }
    expect(body.modulo.estado).toBe("ARCHIVADO")
    expect(body.previewImpacto.cursosActivosAfectados).toHaveLength(0)
    expect(body.previewImpacto.skillsHuerfanas).toHaveLength(0)

    const historico = await prisma.historicoEstadoModulo.findFirst({
      where: { moduloId: id, estadoNuevo: "ARCHIVADO" },
      select: { motivo: true },
    })
    expect(historico?.motivo).toBe("obsoleto")
  })

  it("POST /modulos/:id/archivar con curso ACTIVO + skill huerfana: preview poblado y MODULO_HUERFANO_DETECTADO", async () => {
    const area = await prisma.area.create({
      data: { nombre: `Area-Huerfana${FIXTURE_SUFFIX}` },
      select: { id: true },
    })
    const skill = await prisma.skill.create({
      data: { etiquetaVisible: `huerfana.unica${FIXTURE_SUFFIX}`, areaId: area.id },
      select: { id: true, etiquetaVisible: true },
    })
    const cliente = await prisma.cliente.create({
      data: { nombre: `Cliente-Huerfana${FIXTURE_SUFFIX}` },
      select: { id: true },
    })
    const curso = await prisma.curso.create({
      data: {
        titulo: `Curso-Huerfana${FIXTURE_SUFFIX}`,
        clienteId: cliente.id,
        fechaInicio: new Date("2026-01-01"),
        fechaDeadline: new Date("2026-12-31"),
        estado: "ACTIVO",
      },
      select: { id: true },
    })
    await prisma.cursoSkillExigida.create({
      data: { cursoId: curso.id, skillId: skill.id, notaMinima: 70 },
    })
    const moduloId = await crearModulo(`Modulo-Cubridor${FIXTURE_SUFFIX}`)
    const seccion = await prisma.seccion.create({
      data: { moduloId, titulo: `Sec-Cubridora${FIXTURE_SUFFIX}`, orden: 1 },
      select: { id: true },
    })
    await prisma.seccionSkill.create({ data: { seccionId: seccion.id, skillId: skill.id } })
    await prisma.cursoModuloHabilitado.create({
      data: { cursoId: curso.id, moduloId },
    })

    const res = await agente
      .post(`/api/v1/catalogo/modulos/${moduloId}/archivar`)
      .set("X-XSRF-TOKEN", csrf)
      .set("X-Motivo", "reestructuracion")
      .send({})
    expect(res.status).toBe(200)
    const body = res.body as {
      previewImpacto: {
        cursosActivosAfectados: readonly { cursoId: string; titulo: string }[]
        skillsHuerfanas: readonly { skillId: string; cursosDondeQuedaHuerfana: readonly string[] }[]
      }
    }
    expect(body.previewImpacto.cursosActivosAfectados).toHaveLength(1)
    expect(body.previewImpacto.skillsHuerfanas[0]?.skillId).toBe(skill.id)

    const logHuerfano = await prisma.activityLog.findFirst({
      where: { accion: "MODULO_HUERFANO_DETECTADO", recursoId: moduloId },
      select: { id: true },
    })
    expect(logHuerfano).not.toBeNull()
  })

  it("DELETE /modulos/:id con secciones: 409 MODULO_CON_SECCIONES; sin secciones: 204", async () => {
    const idConSec = await crearModulo(`Modulo-Con-Sec${FIXTURE_SUFFIX}`)
    await prisma.seccion.create({
      data: { moduloId: idConSec, titulo: `Sec-bloqueante${FIXTURE_SUFFIX}`, orden: 1 },
    })
    const r1 = await agente
      .delete(`/api/v1/catalogo/modulos/${idConSec}`)
      .set("X-XSRF-TOKEN", csrf)
      .set("X-Motivo", "limpiar")
    expect(r1.status).toBe(409)
    expect((r1.body as { code: string }).code).toBe("MODULO_CON_SECCIONES")

    const idVacio = await crearModulo(`Modulo-Sin-Sec${FIXTURE_SUFFIX}`)
    const r2 = await agente
      .delete(`/api/v1/catalogo/modulos/${idVacio}`)
      .set("X-XSRF-TOKEN", csrf)
      .set("X-Motivo", "limpiar")
    expect(r2.status).toBe(204)
    const log = await prisma.activityLog.findFirst({
      where: { accion: "MODULO_ELIMINADO", recursoId: idVacio },
      select: { id: true },
    })
    expect(log).not.toBeNull()
  })

  it("POST /modulos/:moduloId/secciones con skillIds: 201 + seccion_skill creadas", async () => {
    const moduloId = await crearModulo(`Modulo-Sec-Skills${FIXTURE_SUFFIX}`)
    const area = await prisma.area.create({
      data: { nombre: `Area-Sec-Skills${FIXTURE_SUFFIX}` },
      select: { id: true },
    })
    const skill = await prisma.skill.create({
      data: { etiquetaVisible: `sec.skill${FIXTURE_SUFFIX}`, areaId: area.id },
      select: { id: true },
    })

    const res = await agente
      .post(`/api/v1/catalogo/modulos/${moduloId}/secciones`)
      .set("X-XSRF-TOKEN", csrf)
      .send({ titulo: `Sec-Con-Skills${FIXTURE_SUFFIX}`, skillIds: [skill.id] })
    expect(res.status).toBe(201)
    const seccionId = (res.body as { id: string }).id

    const links = await prisma.seccionSkill.findMany({
      where: { seccionId },
      select: { skillId: true },
    })
    expect(links).toHaveLength(1)
    expect(links[0]?.skillId).toBe(skill.id)
  })

  it("POST /modulos/:moduloId/secciones/orden: 204 y permutacion aplicada", async () => {
    const moduloId = await crearModulo(`Modulo-Reorden${FIXTURE_SUFFIX}`)
    const a = await prisma.seccion.create({
      data: { moduloId, titulo: `Sec-A${FIXTURE_SUFFIX}`, orden: 1 },
      select: { id: true },
    })
    const b = await prisma.seccion.create({
      data: { moduloId, titulo: `Sec-B${FIXTURE_SUFFIX}`, orden: 2 },
      select: { id: true },
    })
    const c = await prisma.seccion.create({
      data: { moduloId, titulo: `Sec-C${FIXTURE_SUFFIX}`, orden: 3 },
      select: { id: true },
    })

    const res = await agente
      .post(`/api/v1/catalogo/modulos/${moduloId}/secciones/orden`)
      .set("X-XSRF-TOKEN", csrf)
      .send({
        orden: [
          { seccionId: a.id, orden: 3 },
          { seccionId: b.id, orden: 1 },
          { seccionId: c.id, orden: 2 },
        ],
      })
    expect(res.status).toBe(204)

    const finales = await prisma.seccion.findMany({
      where: { moduloId },
      orderBy: { orden: "asc" },
      select: { id: true, orden: true },
    })
    expect(finales).toEqual([
      { id: b.id, orden: 1 },
      { id: c.id, orden: 2 },
      { id: a.id, orden: 3 },
    ])
  })
})
