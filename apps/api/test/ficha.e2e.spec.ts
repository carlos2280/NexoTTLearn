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
  console.warn("ficha.e2e.spec: DATABASE_URL ausente — tests SKIP.")
}
if (HAS_DB_URL && !DIST_DISPONIBLE) {
  console.warn(
    "ficha.e2e.spec: dist/ no encontrado — ejecutar `pnpm --filter @nexott-learn/api build`. SKIP.",
  )
}
const RUN_E2E = HAS_DB_URL && DIST_DISPONIBLE

const ADMIN_EMAIL = "ficha-admin-p5a@nttdata.test"
const PART_A_EMAIL = "ficha-part-a-p5a@nttdata.test"
const PART_B_EMAIL = "ficha-part-b-p5a@nttdata.test"
const PASSWORD = "Ficha1234!"
const PREFIX = "P5a-ficha-"

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

interface FichaCtx {
  agenteAdmin: Agent
  agentePartA: Agent
  agentePartB: Agent
  colAId: string
  colBId: string
  skillId: string
  notaSkillId: string
}

describe.runIf(RUN_E2E)("ficha e2e (P5a)", () => {
  let app: INestApplication
  let prisma: PrismaClient
  let ctx: FichaCtx

  beforeAll(async () => {
    prisma = new PrismaClient()
    try {
      await prisma.$queryRaw`SELECT 1`
    } catch (error) {
      const detalle = error instanceof Error ? error.message : String(error)
      throw new Error(`No se pudo conectar a la BD para los e2e: ${detalle}`)
    }

    const passwordHash = await bcrypt.hash(PASSWORD, 12)

    async function upsertUsuario(
      email: string,
      nombre: string,
      rol: "ADMIN" | "PARTICIPANTE",
    ): Promise<{ colId: string; usrId: string }> {
      const col = await prisma.colaborador.upsert({
        where: { email },
        update: { nombre, estadoEmpleado: "ACTIVO" },
        create: { email, nombre, estadoEmpleado: "ACTIVO" },
        select: { id: true },
      })
      const usr = await prisma.usuario.upsert({
        where: { colaboradorId: col.id },
        update: {
          passwordHash,
          rol,
          requiereCambioPassword: false,
          passwordInicialCaduca: null,
          bloqueado: false,
          intentosFallidos: 0,
          mfaHabilitado: false,
          requiereSetupMfa: false,
        },
        create: {
          colaboradorId: col.id,
          rol,
          passwordHash,
          requiereCambioPassword: false,
          bloqueado: false,
          intentosFallidos: 0,
          mfaHabilitado: false,
        },
        select: { id: true },
      })
      return { colId: col.id, usrId: usr.id }
    }

    const admin = await upsertUsuario(ADMIN_EMAIL, "Ficha Admin", "ADMIN")
    const partA = await upsertUsuario(PART_A_EMAIL, "Part A", "PARTICIPANTE")
    const partB = await upsertUsuario(PART_B_EMAIL, "Part B", "PARTICIPANTE")

    // Limpieza defensiva por si una corrida anterior dejo leftovers.
    await prisma.$executeRaw`
      DELETE FROM historico_notas_skill WHERE nota_skill_id IN (
        SELECT id FROM notas_skill WHERE skill_id IN (
          SELECT id FROM skills WHERE etiqueta_visible LIKE ${`%${PREFIX}%`}
        )
      )
    `
    await prisma.notaSkill.deleteMany({
      where: { skill: { etiquetaVisible: { contains: PREFIX } } },
    })
    await prisma.skill.deleteMany({ where: { etiquetaVisible: { contains: PREFIX } } })
    await prisma.area.deleteMany({ where: { nombre: { contains: PREFIX } } })

    const area = await prisma.area.create({
      data: { nombre: `${PREFIX}area-backend`, descripcion: "Area P5a ficha" },
      select: { id: true },
    })
    const skill = await prisma.skill.create({
      data: { etiquetaVisible: `${PREFIX}python.fastapi`, areaId: area.id, estado: "ACTIVA" },
      select: { id: true },
    })

    // Nota para Part A con 2 entradas de historico.
    const nota = await prisma.notaSkill.create({
      data: {
        colaboradorId: partA.colId,
        skillId: skill.id,
        notaActual: 86,
        origenActual: { fuente: "ENTREVISTA_INICIAL" },
      },
      select: { id: true },
    })
    await prisma.historicoNotaSkill.createMany({
      data: [
        {
          notaSkillId: nota.id,
          fecha: new Date("2026-05-10T10:00:00Z"),
          valor: 70,
          origen: "ENTREVISTA_INICIAL",
          autorUsuarioId: admin.usrId,
          referencia: { paso: 1 },
        },
        {
          notaSkillId: nota.id,
          fecha: new Date("2026-05-11T11:00:00Z"),
          valor: 86,
          origen: "ENTREVISTA_INICIAL",
          autorUsuarioId: admin.usrId,
          referencia: { paso: 2 },
        },
      ],
    })

    await prisma.$executeRaw`
      DELETE FROM sesiones
      WHERE (sess::jsonb->>'usuarioId') IN (
        SELECT id::text FROM usuarios WHERE colaborador_id IN (
          ${admin.colId}::uuid, ${partA.colId}::uuid, ${partB.colId}::uuid
        )
      )
    `

    const moduleApp = (await import(join(DIST_DIR, "app.module.js"))) as ModuloApp
    const moduleHttp = (await import(join(DIST_DIR, "bootstrap-http.js"))) as ModuloHttp
    const { Test } = await import("@nestjs/testing")
    const { ThrottlerGuard } = await import("@nestjs/throttler")
    const throttlerSiempreOk = { canActivate: (): boolean => true }
    const moduleRef = await Test.createTestingModule({ imports: [moduleApp.AppModule] })
      .overrideGuard(ThrottlerGuard)
      .useValue(throttlerSiempreOk)
      .compile()
    app = moduleRef.createNestApplication()
    moduleHttp.configurarHttp(app)
    await app.init()

    const agenteAdmin = supertest.agent(app.getHttpServer())
    const agentePartA = supertest.agent(app.getHttpServer())
    const agentePartB = supertest.agent(app.getHttpServer())
    await loginYObtenerCsrf(agenteAdmin, ADMIN_EMAIL)
    await loginYObtenerCsrf(agentePartA, PART_A_EMAIL)
    await loginYObtenerCsrf(agentePartB, PART_B_EMAIL)

    ctx = {
      agenteAdmin,
      agentePartA,
      agentePartB,
      colAId: partA.colId,
      colBId: partB.colId,
      skillId: skill.id,
      notaSkillId: nota.id,
    }
  }, 60_000)

  afterAll(async () => {
    try {
      const cols = await prisma.colaborador.findMany({
        where: { email: { in: [ADMIN_EMAIL, PART_A_EMAIL, PART_B_EMAIL] } },
        select: { id: true },
      })
      const colIds = cols.map((c) => c.id)
      if (colIds.length > 0) {
        await prisma.$executeRaw`
          DELETE FROM historico_notas_skill WHERE nota_skill_id IN (
            SELECT id FROM notas_skill WHERE colaborador_id = ANY(${colIds}::uuid[])
          )
        `
        await prisma.notaSkill.deleteMany({ where: { colaboradorId: { in: colIds } } })
      }
      await prisma.skill.deleteMany({ where: { etiquetaVisible: { contains: PREFIX } } })
      await prisma.area.deleteMany({ where: { nombre: { contains: PREFIX } } })
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
      console.warn(`ficha e2e cleanup fallo: ${detalle}`)
    }
    if (app) {
      await app.close()
    }
    if (prisma) {
      await prisma.$disconnect()
    }
  })

  it("ADMIN GET /colaboradores/:id/ficha (otro colaborador): 200 con skills + porArea", async () => {
    const res = await ctx.agenteAdmin.get(`/api/v1/colaboradores/${ctx.colAId}/ficha`)
    expect(res.status).toBe(200)
    const body = res.body as {
      colaboradorId: string
      skills: Array<{ skillId: string; notaActual: number | null; etiquetaVisible: string }>
      porArea: Array<{ areaId: string; promedio: number | null; skillsConNota: number }>
    }
    expect(body.colaboradorId).toBe(ctx.colAId)
    const item = body.skills.find((s) => s.skillId === ctx.skillId)
    expect(item).toBeDefined()
    expect(item?.notaActual).toBe(86)
    expect(body.porArea.length).toBeGreaterThanOrEqual(1)
  })

  it("PARTICIPANTE GET /me/ficha: 200 con su propia ficha", async () => {
    const res = await ctx.agentePartA.get("/api/v1/me/ficha")
    expect(res.status).toBe(200)
    const body = res.body as {
      colaboradorId: string
      skills: Array<{ skillId: string; notaActual: number | null }>
    }
    expect(body.colaboradorId).toBe(ctx.colAId)
    const item = body.skills.find((s) => s.skillId === ctx.skillId)
    expect(item?.notaActual).toBe(86)
  })

  it("PARTICIPANTE consultando ficha de OTRO colaborador: 404 (D-CUR-13)", async () => {
    const res = await ctx.agentePartA.get(`/api/v1/colaboradores/${ctx.colBId}/ficha`)
    expect(res.status).toBe(404)
    expect((res.body as { code: string }).code).toBe("COLABORADOR_NO_ENCONTRADO")
  })

  it("PARTICIPANTE con colaborador sin notas: ficha con notaActual=null explicito", async () => {
    const res = await ctx.agentePartB.get("/api/v1/me/ficha")
    expect(res.status).toBe(200)
    const body = res.body as {
      colaboradorId: string
      skills: Array<{ skillId: string; notaActual: number | null }>
    }
    expect(body.colaboradorId).toBe(ctx.colBId)
    const item = body.skills.find((s) => s.skillId === ctx.skillId)
    expect(item).toBeDefined()
    expect(item?.notaActual).toBeNull() // null != 0 (D40)
  })

  it("ADMIN GET historico skill: 200 paginado, orden DESC por fecha", async () => {
    const res = await ctx.agenteAdmin.get(
      `/api/v1/colaboradores/${ctx.colAId}/ficha/skills/${ctx.skillId}/historico`,
    )
    expect(res.status).toBe(200)
    const body = res.body as {
      data: Array<{ id: string; valor: number | null; fecha: string }>
      meta: { total: number }
    }
    expect(body.meta.total).toBe(2)
    expect(body.data).toHaveLength(2)
    expect(body.data[0]?.valor).toBe(86) // DESC: el mas reciente primero
    expect(body.data[1]?.valor).toBe(70)
  })

  it("ADMIN GET historico de skill sin NotaSkill: pagina vacia (no 404)", async () => {
    const res = await ctx.agenteAdmin.get(
      `/api/v1/colaboradores/${ctx.colBId}/ficha/skills/${ctx.skillId}/historico`,
    )
    expect(res.status).toBe(200)
    const body = res.body as { data: unknown[]; meta: { total: number } }
    expect(body.meta.total).toBe(0)
    expect(body.data).toEqual([])
  })

  it("ADMIN GET historico skill inexistente: 404 SKILL_NO_ENCONTRADA", async () => {
    const res = await ctx.agenteAdmin.get(
      `/api/v1/colaboradores/${ctx.colAId}/ficha/skills/00000000-0000-0000-0000-000000000000/historico`,
    )
    expect(res.status).toBe(404)
    expect((res.body as { code: string }).code).toBe("SKILL_NO_ENCONTRADA")
  })
})
