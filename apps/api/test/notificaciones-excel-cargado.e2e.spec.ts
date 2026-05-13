// biome-ignore lint/correctness/noNodejsModules: idem (randomUUID para Idempotency-Key).
import { randomUUID } from "node:crypto"
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

// NOTA P11.5b: el e2e completo del trigger EXCEL_CARGADO requiere resolver
// `AplicarService` desde el `dist/` cargado dinamicamente, pero al usar
// `import()` desde el spec se obtiene una clase distinta a la registrada en
// el `app` Nest (vitest ESM vs Nest CJS — misma raiz que la leccion §5.123 con
// MockEmailProvider). El path HTTP completo `POST /aplicar` requiere subir
// Excel real + preview valido + Archivo persistido, lo cual excede el alcance
// de este e2e. Cobertura del wire: `aplicar.service.spec.ts` valida que
// EXCEL_CARGADO se emite 1-a-1 al actor solo si !replay, y que la plantilla
// esta registrada en PLANTILLAS (`tipo-evento.constants.spec.ts`).
// §5.131 (P12 — Slice 12): el fix D-S12-B1/B2 (globalThis singleton de
// MockEmailProvider con `Symbol.for`) corrige el reparto de instancias entre
// realms para el provider de email, pero el spec usa ademas
// `app.select(EvaluacionInicialModule).get(AplicarService)` que dispara la
// MISMA familia de fallo CJS+ESM en otro vector: la clase `Module` importada
// estaticamente desde el spec (ESM) no coincide con la registrada en `dist/`
// (CJS). Se mantiene skipped por defecto hasta resolver tambien el resolve
// de modulos en el harness e2e (deuda §5.131 reabierta P12). Activar con
// `RUN_E2E_DEFERIDO=1` si el harness se arregla en S13.
const RUN_E2E_DEFERIDO = process.env.RUN_E2E_DEFERIDO === "1"
const RUN_E2E = HAS_DB_URL && DIST_DISPONIBLE && RUN_E2E_DEFERIDO

const ADMIN_EMAIL = "notif-excel-admin@nttdata.test"
const PART_EMAIL = "notif-excel-part@nttdata.test"
const PASSWORD = "Notif1234!"

interface ModuloApp {
  // biome-ignore lint/style/useNamingConvention: la clase Nest es PascalCase.
  AppModule: Type<unknown>
}

async function upsertColaborador(
  prisma: PrismaClient,
  email: string,
  nombre: string,
): Promise<string> {
  const col = await prisma.colaborador.upsert({
    where: { email },
    update: { nombre, estadoEmpleado: "ACTIVO" },
    create: { email, nombre, estadoEmpleado: "ACTIVO" },
    select: { id: true },
  })
  return col.id
}

async function upsertAdmin(
  prisma: PrismaClient,
  email: string,
  passwordHash: string,
): Promise<string> {
  const col = await prisma.colaborador.upsert({
    where: { email },
    update: { nombre: "Notif Excel Admin", estadoEmpleado: "ACTIVO" },
    create: { email, nombre: "Notif Excel Admin", estadoEmpleado: "ACTIVO" },
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

async function crearCursoBase(prisma: PrismaClient, titulo: string): Promise<string> {
  const cliente = await prisma.cliente.upsert({
    where: { nombre: "Cliente Notif Excel" },
    update: {},
    create: { nombre: "Cliente Notif Excel" },
    select: { id: true },
  })
  const curso = await prisma.curso.create({
    data: {
      titulo,
      clienteId: cliente.id,
      estado: "ACTIVO",
      fechaInicio: new Date("2026-01-01"),
      fechaDeadline: new Date("2026-12-31"),
      umbralNoCumple: 10,
      toggleVoluntarios: false,
    },
    select: { id: true },
  })
  return curso.id
}

describe.runIf(RUN_E2E)("notificaciones EXCEL_CARGADO e2e (P11.5b — D-S11.5-B2)", () => {
  let app: INestApplication
  let prisma: PrismaClient
  let adminId: string

  beforeAll(async () => {
    prisma = new PrismaClient()
    const passwordHash = await bcrypt.hash(PASSWORD, 12)
    adminId = await upsertAdmin(prisma, ADMIN_EMAIL, passwordHash)
    await upsertColaborador(prisma, PART_EMAIL, "Notif Excel Part")

    await prisma.idempotencyKey.deleteMany({ where: { usuarioId: adminId } })
    await prisma.cargaEvaluacionInicial.deleteMany({
      where: { curso: { cliente: { nombre: "Cliente Notif Excel" } } },
    })
    await prisma.previewEvaluacionInicial.deleteMany({
      where: { curso: { cliente: { nombre: "Cliente Notif Excel" } } },
    })
    await prisma.curso.deleteMany({ where: { cliente: { nombre: "Cliente Notif Excel" } } })
    await prisma.cliente.deleteMany({ where: { nombre: "Cliente Notif Excel" } })

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
      await prisma.idempotencyKey.deleteMany({ where: { usuarioId: adminId } })
      await prisma.cargaEvaluacionInicial.deleteMany({
        where: { curso: { cliente: { nombre: "Cliente Notif Excel" } } },
      })
      await prisma.previewEvaluacionInicial.deleteMany({
        where: { curso: { cliente: { nombre: "Cliente Notif Excel" } } },
      })
      await prisma.curso.deleteMany({ where: { cliente: { nombre: "Cliente Notif Excel" } } })
      await prisma.cliente.deleteMany({ where: { nombre: "Cliente Notif Excel" } })
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
    await prisma.idempotencyKey.deleteMany({ where: { usuarioId: adminId } })
    await prisma.cargaEvaluacionInicial.deleteMany({
      where: { curso: { cliente: { nombre: "Cliente Notif Excel" } } },
    })
    await prisma.previewEvaluacionInicial.deleteMany({
      where: { curso: { cliente: { nombre: "Cliente Notif Excel" } } },
    })
    await prisma.curso.deleteMany({ where: { cliente: { nombre: "Cliente Notif Excel" } } })
  })

  it("aplicar Excel sin cambios emite EXCEL_CARGADO 1-a-1 al admin actor", async () => {
    const cursoId = await crearCursoBase(prisma, "Curso EXC_VACIO")
    const archivo = await prisma.archivo.create({
      data: {
        tipo: "EVALUACION_INICIAL_EXCEL",
        path: "test/excel-vacio.xlsx",
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        tamanioBytes: 0,
        subidoPorUsuarioId: adminId,
      },
      select: { id: true },
    })
    const preview = await prisma.previewEvaluacionInicial.create({
      data: {
        cursoId,
        archivoId: archivo.id,
        creadoPorUsuarioId: adminId,
        expiraEn: new Date(Date.now() + 30 * 60 * 1000),
        aplicadoEn: null,
        resumen: {},
        cambios: [],
        rechazos: [],
      },
      select: { id: true },
    })

    const { EvaluacionInicialModule } = (await import(
      join(DIST_DIR, "evaluacion-inicial", "evaluacion-inicial.module.js")
    )) as {
      // biome-ignore lint/style/useNamingConvention: la clase Nest es PascalCase.
      EvaluacionInicialModule: Type<unknown>
    }
    const { AplicarService } = (await import(
      join(DIST_DIR, "evaluacion-inicial", "aplicar.service.js")
    )) as {
      // biome-ignore lint/style/useNamingConvention: la clase Nest es PascalCase.
      AplicarService: new (
        ...args: unknown[]
      ) => {
        aplicar: (input: unknown) => Promise<{ replay: boolean; body: { cargaId: string } }>
      }
    }
    const svc = app.select(EvaluacionInicialModule).get(AplicarService)
    const ejecucion = await svc.aplicar({
      cursoId,
      previewId: preview.id,
      idempotencyKey: randomUUID(),
      usuarioId: adminId,
      body: { recalcularPlanes: false },
    })
    expect(ejecucion.replay).toBe(false)

    const notif = await prisma.notificacion.findFirst({
      where: { usuarioId: adminId, tipoEvento: "EXCEL_CARGADO" },
      select: { esCritico: true, payload: true },
    })
    expect(notif).not.toBeNull()
    expect(notif?.esCritico).toBe(true)
    expect(notif?.payload).toMatchObject({
      cursoId,
      cargaId: ejecucion.body.cargaId,
      skillsActualizadas: 0,
      colaboradoresActualizados: 0,
      planesMarcadosDesactualizados: 0,
    })
  })

  it("aplicar (replay) NO duplica la notificacion EXCEL_CARGADO", async () => {
    const cursoId = await crearCursoBase(prisma, "Curso EXC_REPLAY")
    const archivo = await prisma.archivo.create({
      data: {
        tipo: "EVALUACION_INICIAL_EXCEL",
        path: "test/excel-replay.xlsx",
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        tamanioBytes: 0,
        subidoPorUsuarioId: adminId,
      },
      select: { id: true },
    })
    const preview = await prisma.previewEvaluacionInicial.create({
      data: {
        cursoId,
        archivoId: archivo.id,
        creadoPorUsuarioId: adminId,
        expiraEn: new Date(Date.now() + 30 * 60 * 1000),
        aplicadoEn: null,
        resumen: {},
        cambios: [],
        rechazos: [],
      },
      select: { id: true },
    })

    const { EvaluacionInicialModule } = (await import(
      join(DIST_DIR, "evaluacion-inicial", "evaluacion-inicial.module.js")
    )) as {
      // biome-ignore lint/style/useNamingConvention: la clase Nest es PascalCase.
      EvaluacionInicialModule: Type<unknown>
    }
    const { AplicarService } = (await import(
      join(DIST_DIR, "evaluacion-inicial", "aplicar.service.js")
    )) as {
      // biome-ignore lint/style/useNamingConvention: la clase Nest es PascalCase.
      AplicarService: new (
        ...args: unknown[]
      ) => {
        aplicar: (input: unknown) => Promise<{ replay: boolean }>
      }
    }
    const svc = app.select(EvaluacionInicialModule).get(AplicarService)
    const key = randomUUID()
    await svc.aplicar({
      cursoId,
      previewId: preview.id,
      idempotencyKey: key,
      usuarioId: adminId,
      body: { recalcularPlanes: false },
    })
    const segunda = await svc.aplicar({
      cursoId,
      previewId: preview.id,
      idempotencyKey: key,
      usuarioId: adminId,
      body: { recalcularPlanes: false },
    })
    expect(segunda.replay).toBe(true)

    const total = await prisma.notificacion.count({
      where: { usuarioId: adminId, tipoEvento: "EXCEL_CARGADO" },
    })
    expect(total).toBe(1)
  })
})
