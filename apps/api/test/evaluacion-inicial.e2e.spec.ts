// biome-ignore lint/correctness/noNodejsModules: el harness e2e necesita filesystem para detectar dist/.
import { existsSync } from "node:fs"
// biome-ignore lint/correctness/noNodejsModules: idem.
import { join, resolve } from "node:path"
import type { INestApplication, Type } from "@nestjs/common"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcrypt"
import { Workbook } from "exceljs"
import supertest, { type Agent, type Response } from "supertest"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

const HAS_DB_URL = Boolean(process.env.DATABASE_URL)
const DIST_DIR = resolve(__dirname, "..", "dist")
const DIST_DISPONIBLE = existsSync(join(DIST_DIR, "app.module.js"))

if (!HAS_DB_URL) {
  console.warn("evaluacion-inicial.e2e.spec: DATABASE_URL ausente — tests SKIP.")
}
if (HAS_DB_URL && !DIST_DISPONIBLE) {
  console.warn(
    "evaluacion-inicial.e2e.spec: dist/ no encontrado — ejecutar `pnpm --filter @nexott-learn/api build`. SKIP.",
  )
}
const RUN_E2E = HAS_DB_URL && DIST_DISPONIBLE

const ADMIN_EMAIL = "evalini-admin-p5a@nttdata.test"
const PARTICIPANTE_EMAIL = "evalini-part-p5a@nttdata.test"
const PARTICIPANTE_2_EMAIL = "evalini-part2-p5a@nttdata.test"
const PASSWORD = "Evalini1234!"
const PREFIX = "P5a-eval-"
const CLIENTE_NOMBRE = "ACME P5a eval"

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

describe.runIf(RUN_E2E)("evaluacion-inicial e2e (P5a — template)", () => {
  let app: INestApplication
  let prisma: PrismaClient
  let agenteAdmin: Agent
  let agentePart: Agent
  let cursoListoId: string
  let cursoSinAreasId: string
  let cursoSinAsignadosId: string

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
      update: { nombre: "P5a Admin", estadoEmpleado: "ACTIVO" },
      create: { email: ADMIN_EMAIL, nombre: "P5a Admin", estadoEmpleado: "ACTIVO" },
      select: { id: true },
    })
    await prisma.usuario.upsert({
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
    })

    const colPart = await prisma.colaborador.upsert({
      where: { email: PARTICIPANTE_EMAIL },
      update: { nombre: "P5a Part", estadoEmpleado: "ACTIVO" },
      create: { email: PARTICIPANTE_EMAIL, nombre: "P5a Part", estadoEmpleado: "ACTIVO" },
      select: { id: true },
    })
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
      update: { nombre: "P5a Part 2", estadoEmpleado: "ACTIVO" },
      create: { email: PARTICIPANTE_2_EMAIL, nombre: "P5a Part 2", estadoEmpleado: "ACTIVO" },
      select: { id: true },
    })

    const cliente = await prisma.cliente.upsert({
      where: { nombre: CLIENTE_NOMBRE },
      update: { activo: true, deletedAt: null },
      create: { nombre: CLIENTE_NOMBRE, activo: true },
      select: { id: true },
    })
    // Limpieza defensiva por si una corrida anterior dejo leftovers.
    await prisma.curso.deleteMany({ where: { titulo: { contains: PREFIX } } })
    await prisma.skill.deleteMany({ where: { etiquetaVisible: { contains: PREFIX } } })
    await prisma.area.deleteMany({ where: { nombre: { contains: PREFIX } } })

    const area = await prisma.area.create({
      data: { nombre: `${PREFIX}area-backend`, descripcion: "Area de prueba P5a" },
      select: { id: true },
    })
    const skill = await prisma.skill.create({
      data: { etiquetaVisible: `${PREFIX}python.fastapi`, areaId: area.id, estado: "ACTIVA" },
      select: { id: true },
    })

    // Curso listo: con areas exigidas + skill exigida + 2 asignados.
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
    cursoListoId = cursoListo.id
    await prisma.asignacionCurso.createMany({
      data: [
        {
          colaboradorId: colPart.id,
          cursoId: cursoListoId,
          rol: "ASIGNADO",
          estadoAsignado: "ASIGNADO",
        },
        {
          colaboradorId: colPart2.id,
          cursoId: cursoListoId,
          rol: "ASIGNADO",
          estadoAsignado: "EN_PROGRESO",
        },
      ],
    })

    const cursoSinAreas = await prisma.curso.create({
      data: {
        titulo: `${PREFIX}sin-areas`,
        clienteId: cliente.id,
        estado: "BORRADOR",
        fechaInicio: new Date("2026-04-01T00:00:00Z"),
        fechaDeadline: new Date("2026-06-30T00:00:00Z"),
      },
      select: { id: true },
    })
    cursoSinAreasId = cursoSinAreas.id

    const cursoSinAsignados = await prisma.curso.create({
      data: {
        titulo: `${PREFIX}sin-asignados`,
        clienteId: cliente.id,
        estado: "BORRADOR",
        fechaInicio: new Date("2026-04-01T00:00:00Z"),
        fechaDeadline: new Date("2026-06-30T00:00:00Z"),
        areasExigidas: { create: [{ areaId: area.id, peso: 100, puntajeObjetivo: 80 }] },
      },
      select: { id: true },
    })
    cursoSinAsignadosId = cursoSinAsignados.id

    await prisma.$executeRaw`
      DELETE FROM sesiones
      WHERE (sess::jsonb->>'usuarioId') IN (
        SELECT id::text FROM usuarios WHERE colaborador_id IN (${colAdmin.id}::uuid, ${colPart.id}::uuid)
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
    agenteAdmin = supertest.agent(app.getHttpServer())
    agentePart = supertest.agent(app.getHttpServer())
    await loginYObtenerCsrf(agenteAdmin, ADMIN_EMAIL)
    await loginYObtenerCsrf(agentePart, PARTICIPANTE_EMAIL)
  }, 60_000)

  afterAll(async () => {
    try {
      const cursosBorrar = await prisma.curso.findMany({
        where: { titulo: { contains: PREFIX } },
        select: { id: true },
      })
      const cursoIds = cursosBorrar.map((c) => c.id)
      if (cursoIds.length > 0) {
        await prisma.$executeRaw`DELETE FROM cargas_evaluacion_inicial WHERE curso_id = ANY(${cursoIds}::uuid[])`
        await prisma.$executeRaw`DELETE FROM previews_evaluacion_inicial WHERE curso_id = ANY(${cursoIds}::uuid[])`
        await prisma.asignacionCurso.deleteMany({ where: { cursoId: { in: cursoIds } } })
        await prisma.curso.deleteMany({ where: { id: { in: cursoIds } } })
      }
      await prisma.$executeRaw`
        DELETE FROM archivos
        WHERE subido_por_usuario_id IN (
          SELECT id FROM usuarios u
          JOIN colaboradores c ON c.id = u.colaborador_id
          WHERE c.email IN (${ADMIN_EMAIL}, ${PARTICIPANTE_EMAIL}, ${PARTICIPANTE_2_EMAIL})
        )
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
      console.warn(`evaluacion-inicial e2e cleanup fallo: ${detalle}`)
    }
    if (app) {
      await app.close()
    }
    if (prisma) {
      await prisma.$disconnect()
    }
  })

  it("ADMIN GET template: 200, Content-Type xlsx y workbook valido con 2 filas", async () => {
    const res = await agenteAdmin
      .get(`/api/v1/cursos/${cursoListoId}/evaluacion-inicial/template`)
      .buffer(true)
      .parse((response, callback) => {
        const chunks: Buffer[] = []
        response.on("data", (chunk: Buffer) => chunks.push(chunk))
        response.on("end", () => callback(null, Buffer.concat(chunks)))
      })

    expect(res.status).toBe(200)
    expect(res.headers["content-type"]).toContain(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    )
    expect(res.headers["content-disposition"]).toContain(`eval-inicial-${cursoListoId}.xlsx`)

    const workbook = new Workbook()
    await workbook.xlsx.load(res.body as ArrayBuffer)
    const hojaNotas = workbook.getWorksheet("Notas")
    expect(hojaNotas).toBeDefined()
    expect(hojaNotas?.rowCount).toBe(3) // header + 2 asignados
    expect(workbook.getWorksheet("Instrucciones")).toBeDefined()
  })

  it("audit log EVALUACION_TEMPLATE_DESCARGADO insertado tras descarga", async () => {
    await agenteAdmin
      .get(`/api/v1/cursos/${cursoListoId}/evaluacion-inicial/template`)
      .buffer(true)
      .parse((response, callback) => {
        const chunks: Buffer[] = []
        response.on("data", (chunk: Buffer) => chunks.push(chunk))
        response.on("end", () => callback(null, Buffer.concat(chunks)))
      })

    const log = await prisma.activityLog.findFirst({
      where: { accion: "EVALUACION_TEMPLATE_DESCARGADO", recursoId: cursoListoId },
      orderBy: { createdAt: "desc" },
      select: { id: true, exito: true, metadata: true, recursoTipo: true },
    })
    expect(log).not.toBeNull()
    expect(log?.exito).toBe(true)
    expect(log?.recursoTipo).toBe("curso")
    expect(log?.metadata).toMatchObject({
      asignados: 2,
      areasExigidas: 1,
      skillsExigidas: 1,
    })
  })

  it("PARTICIPANTE GET template: 403", async () => {
    const res = await agentePart.get(`/api/v1/cursos/${cursoListoId}/evaluacion-inicial/template`)
    expect(res.status).toBe(403)
  })

  it("ADMIN GET template curso sin areas: 409 CONFLICT_CURSO_NO_PUBLICABLE", async () => {
    const res = await agenteAdmin.get(
      `/api/v1/cursos/${cursoSinAreasId}/evaluacion-inicial/template`,
    )
    expect(res.status).toBe(409)
    expect((res.body as { code: string }).code).toBe("CONFLICT_CURSO_NO_PUBLICABLE")
  })

  it("ADMIN GET template curso sin asignados: 409 CONFLICT_CURSO_NO_PUBLICABLE", async () => {
    const res = await agenteAdmin.get(
      `/api/v1/cursos/${cursoSinAsignadosId}/evaluacion-inicial/template`,
    )
    expect(res.status).toBe(409)
    expect((res.body as { code: string }).code).toBe("CONFLICT_CURSO_NO_PUBLICABLE")
  })

  it("ADMIN GET template curso inexistente: 404 CURSO_NO_ENCONTRADO", async () => {
    const res = await agenteAdmin.get(
      "/api/v1/cursos/00000000-0000-0000-0000-000000000000/evaluacion-inicial/template",
    )
    expect(res.status).toBe(404)
    expect((res.body as { code: string }).code).toBe("CURSO_NO_ENCONTRADO")
  })
})
