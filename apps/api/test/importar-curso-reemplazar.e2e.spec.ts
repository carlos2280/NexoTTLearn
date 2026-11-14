// biome-ignore lint/correctness/noNodejsModules: el harness e2e necesita filesystem para detectar dist/.
import { existsSync } from "node:fs"
// biome-ignore lint/correctness/noNodejsModules: idem.
import { join, resolve } from "node:path"
import type { INestApplication, Type } from "@nestjs/common"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcrypt"
import supertest, { type Agent, type Response } from "supertest"
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"
import type { ThrottlerStorageFake } from "./throttler-storage-fake"

const HAS_DB_URL = Boolean(process.env.DATABASE_URL)
const DIST_DIR = resolve(__dirname, "..", "dist")
const DIST_DISPONIBLE = existsSync(join(DIST_DIR, "app.module.js"))

if (!HAS_DB_URL) {
  console.warn("importar-curso-reemplazar.e2e: DATABASE_URL ausente — tests SKIP.")
}
if (HAS_DB_URL && !DIST_DISPONIBLE) {
  console.warn(
    "importar-curso-reemplazar.e2e: dist/ no encontrado — ejecutar `pnpm --filter @nexott-learn/api build`. SKIP.",
  )
}

const RUN_E2E = HAS_DB_URL && DIST_DISPONIBLE

const ADMIN_EMAIL = "importar-reemplazar-admin@nttdata.test"
const ADMIN_PASSWORD = "Importar1234!"
const SUFIJO = "e2e-importar-reemplazar"
const CLIENTE = `Cliente ${SUFIJO}`
const TITULO = `Curso ${SUFIJO}`

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

/** `.md` minimo (solo parrafos, sin skills) para no dejar skills sueltas. */
function md(modulo: string): string {
  return `---
curso:
  titulo: "${TITULO}"
  cliente: "${CLIENTE}"
  fechaInicio: "2026-06-15"
  fechaDeadline: "2026-09-15"
---

# Módulo 1: ${modulo}

## Sección 1.1: Hola

::: parrafo
Hola desde ${modulo}.
:::
`
}

describe.runIf(RUN_E2E)("importar curso — aviso de duplicado y reemplazo (2A/2B)", () => {
  let app: INestApplication
  let agente: Agent
  let csrf: string
  let prisma: PrismaClient
  let colaboradorId: string
  let cursoId: string
  let throttler: ThrottlerStorageFake

  async function limpiar(): Promise<void> {
    const cursos = await prisma.curso.findMany({ where: { titulo: TITULO }, select: { id: true } })
    const cursoIds = cursos.map((c) => c.id)
    const modulos = await prisma.modulo.findMany({
      where: { titulo: { startsWith: "e2e-reemplazar-" } },
      select: { id: true },
    })
    const moduloIds = modulos.map((m) => m.id)
    await prisma.asignacionCurso.deleteMany({ where: { cursoId: { in: cursoIds } } })
    await prisma.logCambioCurso.deleteMany({ where: { cursoId: { in: cursoIds } } })
    await prisma.curso.deleteMany({ where: { id: { in: cursoIds } } })
    await prisma.cursoModuloHabilitado.deleteMany({ where: { moduloId: { in: moduloIds } } })
    await prisma.bloque.deleteMany({ where: { seccion: { moduloId: { in: moduloIds } } } })
    await prisma.seccion.deleteMany({ where: { moduloId: { in: moduloIds } } })
    await prisma.historicoEstadoModulo.deleteMany({ where: { moduloId: { in: moduloIds } } })
    await prisma.modulo.deleteMany({ where: { id: { in: moduloIds } } })
    await prisma.area.deleteMany({ where: { nombre: TITULO } })
    await prisma.cliente.deleteMany({ where: { nombre: CLIENTE } })
  }

  function importar(body: Record<string, unknown>) {
    return agente.post("/api/v1/admin/cursos/importar").set("X-XSRF-TOKEN", csrf).send(body)
  }

  beforeAll(async () => {
    prisma = new PrismaClient()
    await prisma.$queryRaw`SELECT 1`
    await limpiar()
    await prisma.cliente.create({ data: { nombre: CLIENTE } })

    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12)
    const col = await prisma.colaborador.upsert({
      where: { email: ADMIN_EMAIL },
      update: { nombre: "Admin importar reemplazar", estadoEmpleado: "ACTIVO" },
      create: { email: ADMIN_EMAIL, nombre: "Admin importar reemplazar", estadoEmpleado: "ACTIVO" },
      select: { id: true },
    })
    colaboradorId = col.id
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
    const { ThrottlerGuard, ThrottlerStorage } = await import("@nestjs/throttler")
    const { ThrottlerStorageFake: Fake } = await import("./throttler-storage-fake.js")
    throttler = new Fake()
    const moduleRef = await Test.createTestingModule({ imports: [moduleApp.AppModule] })
      .overrideGuard(ThrottlerGuard)
      .useValue({ canActivate: (): boolean => true })
      .overrideProvider(ThrottlerStorage)
      .useValue(throttler)
      .compile()
    app = moduleRef.createNestApplication()
    moduleHttp.configurarHttp(app)
    await app.init()
    agente = supertest.agent(app.getHttpServer())

    const login = await agente
      .post("/api/v1/auth/login")
      .send({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
    if (login.status !== 200) {
      throw new Error(`Login admin fallo con status ${login.status}`)
    }
    const token = extraerXsrf(login)
    if (!token) {
      throw new Error("No se obtuvo XSRF token tras login")
    }
    csrf = token
  })

  beforeEach(() => {
    // El endpoint limita a 3 importaciones por minuto: cada prueba parte de cero.
    throttler?.reset()
  })

  afterAll(async () => {
    await limpiar()
    await app?.close()
    await prisma?.$disconnect()
  })

  it("primera importacion crea el curso", async () => {
    const res = await importar({ contenidoMd: md("e2e-reemplazar-uno") })
    expect(res.status).toBe(201)
    expect(res.body.reemplazado).toBe(false)
    cursoId = res.body.cursoId
  })

  it("misma importacion otra vez: 409 con el curso marcado como reemplazable", async () => {
    const res = await importar({ contenidoMd: md("e2e-reemplazar-uno") })
    expect(res.status).toBe(409)
    expect(res.body.code).toBe("CURSO_TITULO_DUPLICADO")
    expect(res.body.details.cursosExistentes).toEqual([
      { id: cursoId, titulo: TITULO, estado: "BORRADOR", reemplazable: true },
    ])
    expect(await prisma.curso.count({ where: { titulo: TITULO } })).toBe(1)
  })

  it("reemplazar: mismo curso, modulo viejo archivado y log del cambio", async () => {
    const viejo = await prisma.cursoModuloHabilitado.findFirstOrThrow({
      where: { cursoId },
      select: { moduloId: true },
    })

    const res = await importar({
      contenidoMd: md("e2e-reemplazar-dos"),
      reemplazarCursoId: cursoId,
    })

    expect(res.status).toBe(201)
    expect(res.body).toMatchObject({ cursoId, reemplazado: true, modulosArchivados: 1 })
    expect(await prisma.curso.count({ where: { titulo: TITULO } })).toBe(1)
    const habilitados = await prisma.cursoModuloHabilitado.findMany({
      where: { cursoId },
      select: { modulo: { select: { titulo: true } } },
    })
    expect(habilitados.map((h) => h.modulo.titulo)).toEqual(["e2e-reemplazar-dos"])
    const moduloViejo = await prisma.modulo.findUniqueOrThrow({
      where: { id: viejo.moduloId },
      select: { estado: true, historicoEstados: { select: { estadoNuevo: true } } },
    })
    expect(moduloViejo.estado).toBe("ARCHIVADO")
    expect(moduloViejo.historicoEstados.map((h) => h.estadoNuevo)).toContain("ARCHIVADO")
    expect(
      await prisma.logCambioCurso.count({ where: { cursoId, accion: "CAMBIO_MODULOS" } }),
    ).toBe(1)
  })

  it("con una persona asignada: 409 CURSO_NO_REEMPLAZABLE y el curso no cambia", async () => {
    await prisma.asignacionCurso.create({
      data: { colaboradorId, cursoId, rol: "ASIGNADO", estadoAsignado: "ASIGNADO" },
    })

    const res = await importar({
      contenidoMd: md("e2e-reemplazar-tres"),
      reemplazarCursoId: cursoId,
    })

    expect(res.status).toBe(409)
    expect(res.body.code).toBe("CURSO_NO_REEMPLAZABLE")
    const habilitados = await prisma.cursoModuloHabilitado.findMany({
      where: { cursoId },
      select: { modulo: { select: { titulo: true } } },
    })
    expect(habilitados.map((h) => h.modulo.titulo)).toEqual(["e2e-reemplazar-dos"])
  })
})
