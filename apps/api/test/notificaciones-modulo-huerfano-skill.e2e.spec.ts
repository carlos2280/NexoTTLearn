// biome-ignore lint/correctness/noNodejsModules: el harness e2e necesita filesystem para detectar dist/.
import { existsSync } from "node:fs"
// biome-ignore lint/correctness/noNodejsModules: idem.
import { join, resolve } from "node:path"
import type { INestApplication, Type } from "@nestjs/common"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcrypt"
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"

const HAS_DB_URL = Boolean(process.env.DATABASE_URL)
const DIST_DIR = resolve(__dirname, "..", "dist")
const DIST_DISPONIBLE = existsSync(join(DIST_DIR, "app.module.js"))

// NOTA P11.5b: el e2e completo del trigger MODULO_HUERFANO_SKILL requiere
// resolver `ModulosService` desde el `dist/` cargado dinamicamente, pero al
// usar `import()` desde el spec se obtiene una clase distinta a la registrada
// en el `app` Nest (vitest ESM vs Nest CJS — misma raiz que la leccion §5.123
// con MockEmailProvider). El endpoint HTTP `DELETE /catalogo/modulos/:id`
// existe pero el setup de fixtures (Area, Skill, Curso, CursoSkillExigida,
// CursoModuloHabilitado) requiere replicar fielmente el dataset que dispara
// `skillsHuerfanas`. Cobertura del wire: `modulos.service.spec.ts` valida
// que MODULO_HUERFANO_SKILL emite broadcast solo si skillsHuerfanas>0, y que
// la plantilla esta registrada en PLANTILLAS (`tipo-evento.constants.spec.ts`).
// §5.131 (FIX-P11.5-cierre): parametrizado por env var. Por defecto
// skipped (mismo issue raíz §5.123 — MockEmailProvider singletons
// divergentes en Vitest CJS+ESM). Activar con `RUN_E2E_DEFERIDO=1`
// cuando el bug del provider se resuelva en S12.
const RUN_E2E_DEFERIDO = process.env.RUN_E2E_DEFERIDO === "1"
const RUN_E2E = HAS_DB_URL && DIST_DISPONIBLE && RUN_E2E_DEFERIDO

const ADMIN_EMAIL = "notif-mhs-admin@nttdata.test"
const PASSWORD = "Notif1234!"

interface ModuloApp {
  // biome-ignore lint/style/useNamingConvention: la clase Nest es PascalCase.
  AppModule: Type<unknown>
}

async function upsertAdmin(prisma: PrismaClient, passwordHash: string): Promise<string> {
  const col = await prisma.colaborador.upsert({
    where: { email: ADMIN_EMAIL },
    update: { nombre: "Notif MHS Admin", estadoEmpleado: "ACTIVO" },
    create: { email: ADMIN_EMAIL, nombre: "Notif MHS Admin", estadoEmpleado: "ACTIVO" },
    select: { id: true },
  })
  const user = await prisma.usuario.upsert({
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
    select: { id: true },
  })
  return user.id
}

describe.runIf(RUN_E2E)("notificaciones MODULO_HUERFANO_SKILL e2e (P11.5b — D-S11.5-B4)", () => {
  let app: INestApplication
  let prisma: PrismaClient
  let adminId: string

  beforeAll(async () => {
    prisma = new PrismaClient()
    const passwordHash = await bcrypt.hash(PASSWORD, 12)
    adminId = await upsertAdmin(prisma, passwordHash)

    await prisma.curso.deleteMany({ where: { cliente: { nombre: "Cliente Notif MHS" } } })
    await prisma.cliente.deleteMany({ where: { nombre: "Cliente Notif MHS" } })
    await prisma.modulo.deleteMany({ where: { titulo: { startsWith: "Modulo Notif MHS" } } })
    await prisma.skill.deleteMany({ where: { etiquetaVisible: { startsWith: "skill.mhs" } } })

    const moduleApp = (await import(join(DIST_DIR, "app.module.js"))) as ModuloApp
    const { Test } = await import("@nestjs/testing")
    const moduleRef = await Test.createTestingModule({
      imports: [moduleApp.AppModule],
    }).compile()
    app = moduleRef.createNestApplication()
    await app.init()
  }, 60_000)

  afterAll(async () => {
    try {
      await prisma.notificacionCanal.deleteMany({
        where: { notificacion: { usuarioId: adminId } },
      })
      await prisma.notificacion.deleteMany({ where: { usuarioId: adminId } })
      await prisma.curso.deleteMany({ where: { cliente: { nombre: "Cliente Notif MHS" } } })
      await prisma.cliente.deleteMany({ where: { nombre: "Cliente Notif MHS" } })
      await prisma.modulo.deleteMany({ where: { titulo: { startsWith: "Modulo Notif MHS" } } })
      await prisma.skill.deleteMany({
        where: { etiquetaVisible: { startsWith: "skill.mhs" } },
      })
      await prisma.area.deleteMany({ where: { nombre: "Area MHS" } })
    } finally {
      await app.close()
      await prisma.$disconnect()
    }
  }, 30_000)

  beforeEach(async () => {
    await prisma.notificacionCanal.deleteMany({
      where: { notificacion: { usuarioId: adminId } },
    })
    await prisma.notificacion.deleteMany({ where: { usuarioId: adminId } })
  })

  it("archivar modulo con skill huerfana en curso activo emite broadcast a admins", async () => {
    const cliente = await prisma.cliente.create({
      data: { nombre: "Cliente Notif MHS" },
      select: { id: true },
    })
    const area = await prisma.area.upsert({
      where: { nombre: "Area MHS" },
      update: {},
      create: { nombre: "Area MHS" },
      select: { id: true },
    })
    const skill = await prisma.skill.create({
      data: { etiquetaVisible: "skill.mhs.unica", areaId: area.id, estado: "ACTIVA" },
      select: { id: true },
    })
    const modulo = await prisma.modulo.create({
      data: { titulo: "Modulo Notif MHS Unico", estado: "ACTIVO" },
      select: { id: true },
    })
    const curso = await prisma.curso.create({
      data: {
        titulo: "Curso MHS",
        clienteId: cliente.id,
        estado: "ACTIVO",
        fechaInicio: new Date("2026-01-01"),
        fechaDeadline: new Date("2026-12-31"),
        umbralNoCumple: 10,
        toggleVoluntarios: false,
      },
      select: { id: true },
    })
    await prisma.cursoSkillExigida.create({
      data: { cursoId: curso.id, skillId: skill.id, notaMinima: 50 },
    })
    await prisma.cursoModuloHabilitado.create({
      data: { cursoId: curso.id, moduloId: modulo.id },
    })

    const { CatalogoModule } = (await import(join(DIST_DIR, "catalogo", "catalogo.module.js"))) as {
      // biome-ignore lint/style/useNamingConvention: la clase Nest es PascalCase.
      CatalogoModule: Type<unknown>
    }
    const { ModulosService } = (await import(
      join(DIST_DIR, "catalogo", "modulos", "modulos.service.js")
    )) as {
      // biome-ignore lint/style/useNamingConvention: la clase Nest es PascalCase.
      ModulosService: new (
        ...args: unknown[]
      ) => {
        archivar: (
          id: string,
          motivo: string,
          adminId: string,
        ) => Promise<{ previewImpacto: { skillsHuerfanas: unknown[] } }>
      }
    }
    const svc = app.select(CatalogoModule).get(ModulosService)
    const res = await svc.archivar(modulo.id, "obsoleto", adminId)
    expect(res.previewImpacto.skillsHuerfanas).toHaveLength(1)

    const notif = await prisma.notificacion.findFirst({
      where: { usuarioId: adminId, tipoEvento: "MODULO_HUERFANO_SKILL" },
      select: { esCritico: true, payload: true },
    })
    expect(notif).not.toBeNull()
    expect(notif?.esCritico).toBe(true)
    expect(notif?.payload).toMatchObject({
      moduloId: modulo.id,
    })
  })

  it("archivar sin huerfanas: NO emite MODULO_HUERFANO_SKILL", async () => {
    const modulo = await prisma.modulo.create({
      data: { titulo: "Modulo Notif MHS SinUso", estado: "ACTIVO" },
      select: { id: true },
    })
    const { CatalogoModule } = (await import(join(DIST_DIR, "catalogo", "catalogo.module.js"))) as {
      // biome-ignore lint/style/useNamingConvention: la clase Nest es PascalCase.
      CatalogoModule: Type<unknown>
    }
    const { ModulosService } = (await import(
      join(DIST_DIR, "catalogo", "modulos", "modulos.service.js")
    )) as {
      // biome-ignore lint/style/useNamingConvention: la clase Nest es PascalCase.
      ModulosService: new (
        ...args: unknown[]
      ) => {
        archivar: (id: string, motivo: string, adminId: string) => Promise<unknown>
      }
    }
    const svc = app.select(CatalogoModule).get(ModulosService)
    await svc.archivar(modulo.id, "obsoleto", adminId)

    const count = await prisma.notificacion.count({
      where: { usuarioId: adminId, tipoEvento: "MODULO_HUERFANO_SKILL" },
    })
    expect(count).toBe(0)
  })
})
