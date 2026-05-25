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
  console.warn("catalogo-admin-areas-skills.e2e: DATABASE_URL ausente — tests SKIP.")
}
if (HAS_DB_URL && !DIST_DISPONIBLE) {
  console.warn(
    "catalogo-admin-areas-skills.e2e: dist/ no encontrado — ejecutar `pnpm --filter @nexott-learn/api build`. SKIP.",
  )
}

const RUN_E2E = HAS_DB_URL && DIST_DISPONIBLE

// Admin propio para evitar colisionar con otros e2e que mutan el admin del seed.
const ADMIN_EMAIL = "catalogo-admin-p3a@nttdata.test"
const ADMIN_PASSWORD = "Catalogo1234!"
const FIXTURE_SUFFIX = "-p3a-e2e"

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

describe.runIf(RUN_E2E)("catalogo-admin areas + skills e2e (P3a)", () => {
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
      update: { nombre: "Catalogo Admin P3a", estadoEmpleado: "ACTIVO" },
      create: { email: ADMIN_EMAIL, nombre: "Catalogo Admin P3a", estadoEmpleado: "ACTIVO" },
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
      throw new Error(`Login admin P3a fallo con status ${login.status}`)
    }
    const token = extraerXsrf(login)
    if (!token) {
      throw new Error("No se obtuvo XSRF token tras login")
    }
    csrf = token
  }, 60_000)

  afterAll(async () => {
    // Cleanup parametrizado por sufijo. Patron FIX-P2 §5.18: try/catch envolviendo
    // todo el teardown para que el cierre de app/prisma siempre se ejecute.
    try {
      const suffixLike = `%${FIXTURE_SUFFIX}%`
      await prisma.$executeRaw`
        DELETE FROM bloques
        WHERE skill_que_mide_id IN (
          SELECT id FROM skills WHERE etiqueta_visible LIKE ${suffixLike}
        )
      `
      await prisma.$executeRaw`
        DELETE FROM secciones_skills
        WHERE skill_id IN (
          SELECT id FROM skills WHERE etiqueta_visible LIKE ${suffixLike}
        )
      `
      await prisma.$executeRaw`
        DELETE FROM historico_renombrados_skill
        WHERE skill_id IN (
          SELECT id FROM skills WHERE etiqueta_visible LIKE ${suffixLike}
        )
      `
      await prisma.$executeRaw`DELETE FROM skills WHERE etiqueta_visible LIKE ${suffixLike}`
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
      console.warn(`catalogo-admin P3a cleanup fallo (no rompe teardown): ${detalle}`)
    }

    if (app) {
      await app.close()
    }
    if (prisma) {
      await prisma.$disconnect()
    }
  })

  it("POST /catalogo/areas crea area y emite audit log AREA_CREADA", async () => {
    const nombre = `Area-OK${FIXTURE_SUFFIX}`
    const res = await agente
      .post("/api/v1/catalogo/areas")
      .set("X-XSRF-TOKEN", csrf)
      .send({ nombre, codigo: "frontend", descripcion: "creada por e2e" })
    expect(res.status).toBe(201)
    const body = res.body as { id: string; nombre: string }
    expect(body.nombre).toBe(nombre)

    const log = await prisma.activityLog.findFirst({
      where: { accion: "AREA_CREADA", recursoId: body.id },
      select: { id: true },
    })
    expect(log).not.toBeNull()
  })

  it("POST /catalogo/areas con nombre duplicado: 409 CONFLICT_AREA_NOMBRE_DUPLICADO", async () => {
    const nombre = `Area-Dup${FIXTURE_SUFFIX}`
    const primera = await agente
      .post("/api/v1/catalogo/areas")
      .set("X-XSRF-TOKEN", csrf)
      .send({ nombre, codigo: "backend" })
    expect(primera.status).toBe(201)

    const segunda = await agente
      .post("/api/v1/catalogo/areas")
      .set("X-XSRF-TOKEN", csrf)
      .send({ nombre, codigo: "backend" })
    expect(segunda.status).toBe(409)
    expect((segunda.body as { code: string }).code).toBe("CONFLICT_AREA_NOMBRE_DUPLICADO")
  })

  it("POST /catalogo/skills crea skill sin candidatas (etiqueta unica)", async () => {
    const area = await agente
      .post("/api/v1/catalogo/areas")
      .set("X-XSRF-TOKEN", csrf)
      .send({ nombre: `Area-Skill${FIXTURE_SUFFIX}`, codigo: "data" })
    expect(area.status).toBe(201)
    const areaId = (area.body as { id: string }).id

    const etiqueta = `unica.totalmente.nueva${FIXTURE_SUFFIX}`
    const res = await agente
      .post("/api/v1/catalogo/skills")
      .set("X-XSRF-TOKEN", csrf)
      .send({ etiquetaVisible: etiqueta, areaId })
    expect(res.status).toBe(201)
    expect((res.body as { etiquetaVisible: string }).etiquetaVisible).toBe(etiqueta)
  })

  it("POST /catalogo/skills duplicada (mismo prefijo familia) + X-Forzar-Creacion: true -> 201", async () => {
    const area = await agente
      .post("/api/v1/catalogo/areas")
      .set("X-XSRF-TOKEN", csrf)
      .send({ nombre: `Area-Force${FIXTURE_SUFFIX}`, codigo: "mobile" })
    const areaId = (area.body as { id: string }).id

    const base = `wizard.familia${FIXTURE_SUFFIX}.original`
    const creadaBase = await agente
      .post("/api/v1/catalogo/skills")
      .set("X-XSRF-TOKEN", csrf)
      .send({ etiquetaVisible: base, areaId })
    expect(creadaBase.status).toBe(201)

    // Sin forzar -> 409 con candidatas
    const similar = `wizard.familia${FIXTURE_SUFFIX}.variante`
    const conflicto = await agente
      .post("/api/v1/catalogo/skills")
      .set("X-XSRF-TOKEN", csrf)
      .send({ etiquetaVisible: similar, areaId })
    expect(conflicto.status).toBe(409)
    expect((conflicto.body as { code: string }).code).toBe("CONFLICT_SKILL_DUPLICADA")
    const detalles = conflicto.body as { details: { candidatas: readonly { id: string }[] } }
    expect(detalles.details.candidatas.length).toBeGreaterThanOrEqual(1)

    // Forzando -> 201
    const forzada = await agente
      .post("/api/v1/catalogo/skills")
      .set("X-XSRF-TOKEN", csrf)
      .set("X-Forzar-Creacion", "true")
      .send({ etiquetaVisible: similar, areaId })
    expect(forzada.status).toBe(201)
  })

  it("PATCH /catalogo/skills/:id rename con X-Motivo: 200 + fila en historico_renombrados_skill", async () => {
    const area = await agente
      .post("/api/v1/catalogo/areas")
      .set("X-XSRF-TOKEN", csrf)
      .send({ nombre: `Area-Rename${FIXTURE_SUFFIX}`, codigo: "devops" })
    const areaId = (area.body as { id: string }).id

    const skill = await agente
      .post("/api/v1/catalogo/skills")
      .set("X-XSRF-TOKEN", csrf)
      .send({ etiquetaVisible: `rename.antes${FIXTURE_SUFFIX}`, areaId })
    const skillId = (skill.body as { id: string }).id

    const renombrada = await agente
      .patch(`/api/v1/catalogo/skills/${skillId}`)
      .set("X-XSRF-TOKEN", csrf)
      .set("X-Motivo", "ortografia")
      .send({ etiquetaVisible: `rename.despues${FIXTURE_SUFFIX}` })
    expect(renombrada.status).toBe(200)

    const historico = await prisma.historicoRenombradoSkill.findFirst({
      where: { skillId },
      orderBy: { fecha: "desc" },
    })
    expect(historico).not.toBeNull()
    expect(historico?.etiquetaAnterior).toBe(`rename.antes${FIXTURE_SUFFIX}`)
    expect(historico?.etiquetaNueva).toBe(`rename.despues${FIXTURE_SUFFIX}`)
  })

  it("PATCH /catalogo/skills/:id sin X-Motivo: 422 MOTIVO_REQUERIDO", async () => {
    const area = await agente
      .post("/api/v1/catalogo/areas")
      .set("X-XSRF-TOKEN", csrf)
      .send({ nombre: `Area-NoMotivo${FIXTURE_SUFFIX}`, codigo: "qa" })
    const areaId = (area.body as { id: string }).id

    const skill = await agente
      .post("/api/v1/catalogo/skills")
      .set("X-XSRF-TOKEN", csrf)
      .send({ etiquetaVisible: `rename.no-motivo${FIXTURE_SUFFIX}`, areaId })
    const skillId = (skill.body as { id: string }).id

    const res = await agente
      .patch(`/api/v1/catalogo/skills/${skillId}`)
      .set("X-XSRF-TOKEN", csrf)
      .send({ etiquetaVisible: `rename.x${FIXTURE_SUFFIX}` })
    expect(res.status).toBe(422)
    expect((res.body as { code: string }).code).toBe("MOTIVO_REQUERIDO")
  })

  it("POST /catalogo/skills/:id/archivar: 204 + audit SKILL_ARCHIVADA", async () => {
    const area = await agente
      .post("/api/v1/catalogo/areas")
      .set("X-XSRF-TOKEN", csrf)
      .send({ nombre: `Area-Arch${FIXTURE_SUFFIX}`, codigo: "soft" })
    const areaId = (area.body as { id: string }).id

    const skill = await agente
      .post("/api/v1/catalogo/skills")
      .set("X-XSRF-TOKEN", csrf)
      .send({ etiquetaVisible: `archivar.skill${FIXTURE_SUFFIX}`, areaId })
    const skillId = (skill.body as { id: string }).id

    const res = await agente
      .post(`/api/v1/catalogo/skills/${skillId}/archivar`)
      .set("X-XSRF-TOKEN", csrf)
      .set("X-Motivo", "obsoleta")
      .send({})
    expect(res.status).toBe(204)

    const log = await prisma.activityLog.findFirst({
      where: { accion: "SKILL_ARCHIVADA", recursoId: skillId },
      select: { id: true },
    })
    expect(log).not.toBeNull()
  })

  it("DELETE /catalogo/skills/:id sin referencias: 204 + audit SKILL_ELIMINADA", async () => {
    const area = await agente
      .post("/api/v1/catalogo/areas")
      .set("X-XSRF-TOKEN", csrf)
      .send({ nombre: `Area-Del${FIXTURE_SUFFIX}`, codigo: "frontend" })
    const areaId = (area.body as { id: string }).id

    const skill = await agente
      .post("/api/v1/catalogo/skills")
      .set("X-XSRF-TOKEN", csrf)
      .send({ etiquetaVisible: `delete.skill${FIXTURE_SUFFIX}`, areaId })
    const skillId = (skill.body as { id: string }).id

    const res = await agente
      .delete(`/api/v1/catalogo/skills/${skillId}`)
      .set("X-XSRF-TOKEN", csrf)
      .set("X-Motivo", "limpieza")
    expect(res.status).toBe(204)

    const skillTrasDelete = await prisma.skill.findUnique({ where: { id: skillId } })
    expect(skillTrasDelete).toBeNull()

    const log = await prisma.activityLog.findFirst({
      where: { accion: "SKILL_ELIMINADA", recursoId: skillId },
      select: { id: true },
    })
    expect(log).not.toBeNull()
  })
})
