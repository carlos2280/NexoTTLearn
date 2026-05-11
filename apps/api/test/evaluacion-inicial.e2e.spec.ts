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

describe.runIf(RUN_E2E)("evaluacion-inicial e2e (P5a + P5b — template + preview)", () => {
  let app: INestApplication
  let prisma: PrismaClient
  let agenteAdmin: Agent
  let agentePart: Agent
  let cursoListoId: string
  let cursoSinAreasId: string
  let cursoSinAsignadosId: string
  let areaId: string
  let skillId: string
  let etiquetaSkill: string
  let nombreArea: string
  let csrfAdmin: string
  let csrfPart: string

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

    nombreArea = `${PREFIX}area-backend`
    const area = await prisma.area.create({
      data: { nombre: nombreArea, descripcion: "Area de prueba P5a" },
      select: { id: true },
    })
    areaId = area.id
    etiquetaSkill = `${PREFIX}python.fastapi`
    const skill = await prisma.skill.create({
      data: { etiquetaVisible: etiquetaSkill, areaId: area.id, estado: "ACTIVA" },
      select: { id: true },
    })
    skillId = skill.id

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
    csrfAdmin = await loginYObtenerCsrf(agenteAdmin, ADMIN_EMAIL)
    csrfPart = await loginYObtenerCsrf(agentePart, PARTICIPANTE_EMAIL)
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

  // =============================================================================
  // P5b — preview (upload + parsing + algoritmo "lo especifico gana")
  // =============================================================================

  const mimeXlsx = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

  async function workbookValido(
    filas: ReadonlyArray<{
      email: string
      nombre?: string
      notaSkill?: number | null
      notaArea?: number | null
    }>,
  ): Promise<Buffer> {
    const workbook = new Workbook()
    const hoja = workbook.addWorksheet("Notas")
    hoja.addRow([
      "email",
      "nombre",
      `[SKILL:${skillId}|${etiquetaSkill}]`,
      `[AREA:${areaId}|${nombreArea}]`,
    ])
    for (const f of filas) {
      hoja.addRow([f.email, f.nombre ?? "X", f.notaSkill ?? null, f.notaArea ?? null])
    }
    const ab = await workbook.xlsx.writeBuffer()
    return Buffer.from(ab as ArrayBuffer)
  }

  async function workbookHeadersFaltantes(): Promise<Buffer> {
    const workbook = new Workbook()
    const hoja = workbook.addWorksheet("Notas")
    hoja.addRow(["email", "nombre"]) // sin headers SKILL/AREA
    hoja.addRow([PARTICIPANTE_EMAIL, "X"])
    const ab = await workbook.xlsx.writeBuffer()
    return Buffer.from(ab as ArrayBuffer)
  }

  it("ADMIN POST preview happy path: 201, preview persistido y audit log", async () => {
    const buffer = await workbookValido([
      { email: PARTICIPANTE_EMAIL, nombre: "A", notaSkill: 88, notaArea: null },
      { email: PARTICIPANTE_2_EMAIL, nombre: "B", notaSkill: null, notaArea: 72 },
    ])
    const res = await agenteAdmin
      .post(`/api/v1/cursos/${cursoListoId}/evaluacion-inicial/preview`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .attach("archivo", buffer, { filename: "ok.xlsx", contentType: mimeXlsx })
    expect(res.status).toBe(201)
    const body = res.body as {
      previewId: string
      archivoId: string
      expiraEn: string
      resumen: {
        filasTotales: number
        filasValidas: number
        filasRechazadas: number
        skillsAfectadas: number
        colaboradoresAfectados: number
      }
      cambios: { skillId: string; fuente: string; valorNuevo: number | null }[]
      rechazos: unknown[]
    }
    expect(body.previewId).toBeTruthy()
    expect(body.archivoId).toBeTruthy()
    expect(body.resumen.filasTotales).toBe(2)
    expect(body.resumen.filasValidas).toBe(2)
    expect(body.resumen.filasRechazadas).toBe(0)
    expect(body.cambios).toHaveLength(2)
    expect(body.cambios.find((c) => c.fuente === "SKILL_DIRECTA")?.valorNuevo).toBe(88)
    expect(body.cambios.find((c) => c.fuente === "AREA_HEREDADA")?.valorNuevo).toBe(72)

    const preview = await prisma.previewEvaluacionInicial.findUnique({
      where: { id: body.previewId },
      select: { id: true, cursoId: true, aplicadoEn: true, archivoId: true, expiraEn: true },
    })
    expect(preview).not.toBeNull()
    expect(preview?.aplicadoEn).toBeNull()
    expect(preview?.cursoId).toBe(cursoListoId)
    expect(preview?.archivoId).toBe(body.archivoId)

    const log = await prisma.activityLog.findFirst({
      where: { accion: "EVALUACION_PREVIEW_CREADO", recursoId: cursoListoId },
      orderBy: { createdAt: "desc" },
      select: { exito: true, metadata: true, recursoTipo: true },
    })
    expect(log?.exito).toBe(true)
    expect(log?.recursoTipo).toBe("curso")
    expect(log?.metadata).toMatchObject({
      previewId: body.previewId,
      archivoId: body.archivoId,
      filasValidas: 2,
      filasRechazadas: 0,
    })
  })

  it("PARTICIPANTE POST preview: 403", async () => {
    const buffer = await workbookValido([
      { email: PARTICIPANTE_EMAIL, nombre: "A", notaSkill: 80, notaArea: null },
    ])
    const res = await agentePart
      .post(`/api/v1/cursos/${cursoListoId}/evaluacion-inicial/preview`)
      .set("X-XSRF-TOKEN", csrfPart)
      .attach("archivo", buffer, { filename: "ok.xlsx", contentType: mimeXlsx })
    expect(res.status).toBe(403)
  })

  it("ADMIN POST preview con PDF: 400 INVALID_BODY", async () => {
    const res = await agenteAdmin
      .post(`/api/v1/cursos/${cursoListoId}/evaluacion-inicial/preview`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .attach("archivo", Buffer.from("%PDF-1.4"), {
        filename: "x.pdf",
        contentType: "application/pdf",
      })
    expect(res.status).toBe(400)
    expect((res.body as { code: string }).code).toBe("INVALID_BODY")
  })

  it("ADMIN POST preview con headers faltantes: 422 VALIDACION_EXCEL_ENCABEZADOS", async () => {
    const buffer = await workbookHeadersFaltantes()
    const res = await agenteAdmin
      .post(`/api/v1/cursos/${cursoListoId}/evaluacion-inicial/preview`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .attach("archivo", buffer, { filename: "incompleto.xlsx", contentType: mimeXlsx })
    expect(res.status).toBe(422)
    const body = res.body as {
      code: string
      details: { encabezadosFaltantes: string[] }
    }
    expect(body.code).toBe("VALIDACION_EXCEL_ENCABEZADOS")
    expect(body.details.encabezadosFaltantes.length).toBeGreaterThan(0)
  })

  it("ADMIN POST preview mixto valido + rechazado: 201 con rechazos enumerados", async () => {
    const buffer = await workbookValido([
      { email: PARTICIPANTE_EMAIL, nombre: "Valido", notaSkill: 80, notaArea: null },
      { email: "foreign@nope.test", nombre: "X", notaSkill: 50, notaArea: null },
    ])
    const res = await agenteAdmin
      .post(`/api/v1/cursos/${cursoListoId}/evaluacion-inicial/preview`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .attach("archivo", buffer, { filename: "mixto.xlsx", contentType: mimeXlsx })
    expect(res.status).toBe(201)
    const body = res.body as {
      resumen: { filasTotales: number; filasValidas: number; filasRechazadas: number }
      cambios: unknown[]
      rechazos: { fila: number; email: string | null; errores: { codigo: string }[] }[]
    }
    expect(body.resumen.filasTotales).toBe(2)
    expect(body.resumen.filasValidas).toBe(1)
    expect(body.resumen.filasRechazadas).toBe(1)
    expect(body.cambios.length).toBeGreaterThanOrEqual(1)
    expect(body.rechazos[0]?.errores[0]?.codigo).toBe("VALIDACION_EXCEL_EMAIL_NO_ASIGNADO")
  })

  it("ADMIN DELETE preview no aplicado: 204 + audit log", async () => {
    const buffer = await workbookValido([
      { email: PARTICIPANTE_EMAIL, nombre: "A", notaSkill: 90, notaArea: null },
    ])
    const crear = await agenteAdmin
      .post(`/api/v1/cursos/${cursoListoId}/evaluacion-inicial/preview`)
      .set("X-XSRF-TOKEN", csrfAdmin)
      .attach("archivo", buffer, { filename: "para-borrar.xlsx", contentType: mimeXlsx })
    expect(crear.status).toBe(201)
    const previewId = (crear.body as { previewId: string }).previewId

    const borrar = await agenteAdmin
      .delete(`/api/v1/cursos/${cursoListoId}/evaluacion-inicial/${previewId}`)
      .set("X-XSRF-TOKEN", csrfAdmin)
    expect(borrar.status).toBe(204)

    const preview = await prisma.previewEvaluacionInicial.findUnique({
      where: { id: previewId },
      select: { id: true },
    })
    expect(preview).toBeNull()

    const log = await prisma.activityLog.findFirst({
      where: { accion: "EVALUACION_PREVIEW_DESCARTADO", recursoId: cursoListoId },
      orderBy: { createdAt: "desc" },
      select: { metadata: true },
    })
    expect(log?.metadata).toMatchObject({ previewId })
  })

  it("ADMIN DELETE preview inexistente: 404 PREVIEW_NO_ENCONTRADO", async () => {
    const res = await agenteAdmin
      .delete(
        `/api/v1/cursos/${cursoListoId}/evaluacion-inicial/00000000-0000-0000-0000-000000000099`,
      )
      .set("X-XSRF-TOKEN", csrfAdmin)
    expect(res.status).toBe(404)
    expect((res.body as { code: string }).code).toBe("PREVIEW_NO_ENCONTRADO")
  })

  it("ADMIN DELETE doble paralelo: 1 cumple 204 + 1 falla (race)", async () => {
    // Creamos el preview directamente via Prisma para evitar consumir cuota
    // del @Throttle(10/hora) del endpoint POST en este describe. Lo importante
    // del test es el race del DELETE, no el upload.
    const archivo = await prisma.archivo.create({
      data: {
        tipo: "EVALUACION_INICIAL_EXCEL",
        path: `EVALUACION_INICIAL_EXCEL/race/${cursoListoId}.xlsx`,
        mimeType: mimeXlsx,
        tamanioBytes: 1,
        subidoPorUsuarioId: (
          await prisma.usuario.findFirstOrThrow({
            where: { colaborador: { email: ADMIN_EMAIL } },
            select: { id: true },
          })
        ).id,
      },
      select: { id: true },
    })
    const preview = await prisma.previewEvaluacionInicial.create({
      data: {
        cursoId: cursoListoId,
        archivoId: archivo.id,
        creadoPorUsuarioId: (
          await prisma.usuario.findFirstOrThrow({
            where: { colaborador: { email: ADMIN_EMAIL } },
            select: { id: true },
          })
        ).id,
        expiraEn: new Date(Date.now() + 30 * 60 * 1000),
        resumen: {
          filasTotales: 0,
          filasValidas: 0,
          filasRechazadas: 0,
          skillsAfectadas: 0,
          colaboradoresAfectados: 0,
        },
        cambios: [],
        rechazos: [],
      },
      select: { id: true },
    })
    const previewId = preview.id

    const [a, b] = await Promise.all([
      agenteAdmin
        .delete(`/api/v1/cursos/${cursoListoId}/evaluacion-inicial/${previewId}`)
        .set("X-XSRF-TOKEN", csrfAdmin),
      agenteAdmin
        .delete(`/api/v1/cursos/${cursoListoId}/evaluacion-inicial/${previewId}`)
        .set("X-XSRF-TOKEN", csrfAdmin),
    ])
    const statuses = [a.status, b.status].sort()
    // Solo uno borra (204). El otro puede ver la fila ya borrada (404) o ver la fila
    // y perder el deleteMany por el guard `aplicadoEn IS NULL` (409, count===0).
    // Ambas variantes son aceptables y demuestran race-safety.
    expect(statuses[0]).toBe(204)
    expect([404, 409]).toContain(statuses[1])
  })
})
