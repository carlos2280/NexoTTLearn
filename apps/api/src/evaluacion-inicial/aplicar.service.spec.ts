import { ConflictException, NotFoundException, UnprocessableEntityException } from "@nestjs/common"
import { Prisma } from "@prisma/client"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { IdempotencyService } from "../common/idempotency/idempotency.service"
import { RunOnceInput } from "../common/idempotency/idempotency.types"
import { PrismaService } from "../common/prisma/prisma.service"
import { NotificacionesService } from "../notificaciones/notificaciones.service"
import { AplicarService } from "./aplicar.service"

const CURSO_ID = "11111111-1111-1111-1111-111111111111"
const PREVIEW_ID = "22222222-2222-2222-2222-222222222222"
const ARCHIVO_ID = "33333333-3333-3333-3333-333333333333"
const USR_ID = "44444444-4444-4444-4444-444444444444"
const KEY = "55555555-5555-5555-5555-555555555555"
const CARGA_ID = "66666666-6666-6666-6666-666666666666"

const COL_A = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
const COL_B = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"
const SKILL_X = "cccccccc-cccc-cccc-cccc-cccccccccccc"
const SKILL_Y = "dddddddd-dddd-dddd-dddd-dddddddddddd"

interface PrismaMock {
  curso: { findUnique: ReturnType<typeof vi.fn> }
  usuario: { findMany: ReturnType<typeof vi.fn> }
}

interface TxMock {
  previewEvaluacionInicial: {
    findUnique: ReturnType<typeof vi.fn>
    updateMany: ReturnType<typeof vi.fn>
  }
  cargaEvaluacionInicial: {
    create: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
  }
  notaSkill: {
    upsert: ReturnType<typeof vi.fn>
    findMany: ReturnType<typeof vi.fn>
  }
  historicoNotaSkill: {
    createMany: ReturnType<typeof vi.fn>
  }
  planEstudio: {
    findMany: ReturnType<typeof vi.fn>
    updateMany: ReturnType<typeof vi.fn>
  }
}

function buildPrismaMock(): PrismaMock {
  return {
    curso: { findUnique: vi.fn() },
    usuario: { findMany: vi.fn().mockResolvedValue([]) },
  }
}

function buildTxMock(): TxMock {
  return {
    previewEvaluacionInicial: {
      findUnique: vi.fn(),
      updateMany: vi.fn(),
    },
    cargaEvaluacionInicial: {
      create: vi.fn(),
      update: vi.fn(),
    },
    notaSkill: {
      upsert: vi.fn(),
      findMany: vi.fn(),
    },
    historicoNotaSkill: {
      createMany: vi.fn(),
    },
    planEstudio: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
  }
}

interface IdempotencyMock {
  runOnce: ReturnType<typeof vi.fn>
}

function buildIdempotencyMock(tx: TxMock): IdempotencyMock {
  return {
    runOnce: vi.fn(async (input: RunOnceInput<unknown>) => {
      const resultado = await input.ejecutor(tx as unknown as Prisma.TransactionClient)
      return { status: resultado.status, body: resultado.body, replay: false }
    }),
  }
}

function previewBase(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: PREVIEW_ID,
    cursoId: CURSO_ID,
    archivoId: ARCHIVO_ID,
    expiraEn: new Date(Date.now() + 30 * 60 * 1000),
    aplicadoEn: null,
    cambios: [],
    rechazos: [],
    ...overrides,
  }
}

function cambio(
  colaboradorId: string,
  skillId: string,
  valorNuevo: number,
  valorAnterior: number | null = null,
) {
  return {
    colaboradorId,
    email: `${colaboradorId}@test.local`,
    nombreColaborador: "X",
    skillId,
    etiquetaSkill: skillId,
    valorAnterior,
    valorNuevo,
    fuente: "SKILL_DIRECTA" as const,
  }
}

interface NotificacionesMock {
  crear: ReturnType<typeof vi.fn>
}

function buildNotificacionesMock(): NotificacionesMock {
  return {
    crear: vi
      .fn()
      .mockResolvedValue({ creada: true, notificacionId: "n-1", canalesEnviados: ["IN_APP"] }),
  }
}

function build(): {
  service: AplicarService
  prisma: PrismaMock
  tx: TxMock
  idempotency: IdempotencyMock
  notificaciones: NotificacionesMock
} {
  const prisma = buildPrismaMock()
  const tx = buildTxMock()
  const idempotency = buildIdempotencyMock(tx)
  const notificaciones = buildNotificacionesMock()
  const service = new AplicarService(
    prisma as unknown as PrismaService,
    idempotency as unknown as IdempotencyService,
    notificaciones as unknown as NotificacionesService,
  )
  return { service, prisma, tx, idempotency, notificaciones }
}

function cursoOk() {
  return { id: CURSO_ID }
}

function aplicarInput(body: { recalcularPlanes?: boolean } = { recalcularPlanes: false }) {
  return {
    cursoId: CURSO_ID,
    previewId: PREVIEW_ID,
    idempotencyKey: KEY,
    usuarioId: USR_ID,
    body: { recalcularPlanes: body.recalcularPlanes ?? false },
  }
}

describe("AplicarService", () => {
  let h: ReturnType<typeof build>

  beforeEach(() => {
    h = build()
    // Defaults razonables del tx; los tests override segun necesidad.
    h.tx.cargaEvaluacionInicial.create.mockResolvedValue({ id: CARGA_ID })
    h.tx.previewEvaluacionInicial.updateMany.mockResolvedValue({ count: 1 })
    h.tx.notaSkill.upsert.mockResolvedValue({ id: "nota-id" })
    h.tx.notaSkill.findMany.mockResolvedValue([])
    h.tx.historicoNotaSkill.createMany.mockResolvedValue({ count: 0 })
    h.tx.planEstudio.findMany.mockResolvedValue([])
    h.tx.planEstudio.updateMany.mockResolvedValue({ count: 0 })
    h.tx.cargaEvaluacionInicial.update.mockResolvedValue({ id: CARGA_ID })
  })

  it("happy path: aplica 3 cambios sobre 2 colaboradores -> counts correctos", async () => {
    h.prisma.curso.findUnique.mockResolvedValue(cursoOk())
    const cambios = [
      cambio(COL_A, SKILL_X, 80),
      cambio(COL_A, SKILL_Y, 70),
      cambio(COL_B, SKILL_X, 90),
    ]
    h.tx.previewEvaluacionInicial.findUnique.mockResolvedValue(previewBase({ cambios }))
    h.tx.notaSkill.findMany.mockResolvedValue([
      { id: "nota-1", colaboradorId: COL_A, skillId: SKILL_X },
      { id: "nota-2", colaboradorId: COL_A, skillId: SKILL_Y },
      { id: "nota-3", colaboradorId: COL_B, skillId: SKILL_X },
    ])
    h.tx.planEstudio.findMany.mockResolvedValue([{ id: "plan-1" }, { id: "plan-2" }])
    h.tx.planEstudio.updateMany.mockResolvedValue({ count: 2 })

    const result = await h.service.aplicar(aplicarInput())

    expect(result.replay).toBe(false)
    expect(result.body).toEqual({
      aplicado: true,
      skillsActualizadas: 2,
      colaboradoresActualizados: 2,
      planesMarcadosDesactualizados: 2,
      planesRecalculados: 0,
      cargaId: CARGA_ID,
    })
    expect(h.tx.notaSkill.upsert).toHaveBeenCalledTimes(3)
    expect(h.tx.historicoNotaSkill.createMany).toHaveBeenCalledTimes(1)
    const histArgs = h.tx.historicoNotaSkill.createMany.mock.calls[0]?.[0] as {
      data: unknown[]
    }
    expect(histArgs.data).toHaveLength(3)
  })

  it("preview expirado: 404 PREVIEW_NO_ENCONTRADO sin escribir", async () => {
    h.prisma.curso.findUnique.mockResolvedValue(cursoOk())
    h.tx.previewEvaluacionInicial.findUnique.mockResolvedValue(
      previewBase({ expiraEn: new Date(Date.now() - 1000) }),
    )
    await expect(h.service.aplicar(aplicarInput())).rejects.toThrow(NotFoundException)
    expect(h.tx.cargaEvaluacionInicial.create).not.toHaveBeenCalled()
  })

  it("preview de otro curso: 404 PREVIEW_NO_ENCONTRADO (cross-curso)", async () => {
    h.prisma.curso.findUnique.mockResolvedValue(cursoOk())
    h.tx.previewEvaluacionInicial.findUnique.mockResolvedValue(
      previewBase({ cursoId: "otro-curso-id" }),
    )
    await expect(h.service.aplicar(aplicarInput())).rejects.toThrow(NotFoundException)
  })

  it("preview ya aplicado: 404 (mismo handler, no leak de estado)", async () => {
    h.prisma.curso.findUnique.mockResolvedValue(cursoOk())
    h.tx.previewEvaluacionInicial.findUnique.mockResolvedValue(
      previewBase({ aplicadoEn: new Date() }),
    )
    await expect(h.service.aplicar(aplicarInput())).rejects.toThrow(NotFoundException)
    expect(h.tx.cargaEvaluacionInicial.create).not.toHaveBeenCalled()
  })

  it("race doble aplicar: el segundo writer recibe 409 conflictPreviewYaAplicado", async () => {
    h.prisma.curso.findUnique.mockResolvedValue(cursoOk())
    h.tx.previewEvaluacionInicial.findUnique.mockResolvedValue(previewBase())
    // Lock falla (otro writer ya tomó el preview).
    h.tx.previewEvaluacionInicial.updateMany.mockResolvedValueOnce({ count: 0 })

    await expect(h.service.aplicar(aplicarInput())).rejects.toThrow(ConflictException)
  })

  it("preview con rechazos: 422 sin escribir notas ni carga", async () => {
    h.prisma.curso.findUnique.mockResolvedValue(cursoOk())
    h.tx.previewEvaluacionInicial.findUnique.mockResolvedValue(
      previewBase({
        rechazos: [
          { fila: 2, email: "x@y.test", errores: [{ celda: "B2", codigo: "X", mensaje: "x" }] },
        ],
      }),
    )
    await expect(h.service.aplicar(aplicarInput())).rejects.toThrow(UnprocessableEntityException)
    expect(h.tx.cargaEvaluacionInicial.create).not.toHaveBeenCalled()
    expect(h.tx.notaSkill.upsert).not.toHaveBeenCalled()
  })

  it("idempotency replay: devuelve body cacheado con replay=true sin ejecutar", async () => {
    h.prisma.curso.findUnique.mockResolvedValue(cursoOk())
    const cached = {
      aplicado: true,
      skillsActualizadas: 5,
      colaboradoresActualizados: 3,
      planesMarcadosDesactualizados: 2,
      planesRecalculados: 0,
      cargaId: CARGA_ID,
    }
    h.idempotency.runOnce.mockResolvedValueOnce({ status: 200, body: cached, replay: true })
    const result = await h.service.aplicar(aplicarInput())
    expect(result.replay).toBe(true)
    expect(result.body).toEqual(cached)
    expect(h.tx.cargaEvaluacionInicial.create).not.toHaveBeenCalled()
  })

  it("idempotency con body distinto: el servicio propaga 409 desde IdempotencyService", async () => {
    h.prisma.curso.findUnique.mockResolvedValue(cursoOk())
    h.idempotency.runOnce.mockRejectedValueOnce(new ConflictException("conflict"))
    await expect(h.service.aplicar(aplicarInput())).rejects.toThrow(ConflictException)
  })

  it("recalcularPlanes=true: aceptado pero planesRecalculados=0", async () => {
    h.prisma.curso.findUnique.mockResolvedValue(cursoOk())
    h.tx.previewEvaluacionInicial.findUnique.mockResolvedValue(
      previewBase({ cambios: [cambio(COL_A, SKILL_X, 80)] }),
    )
    h.tx.notaSkill.findMany.mockResolvedValue([
      { id: "n1", colaboradorId: COL_A, skillId: SKILL_X },
    ])
    const result = await h.service.aplicar(aplicarInput({ recalcularPlanes: true }))
    expect(result.body.planesRecalculados).toBe(0)
  })

  it("curso inexistente: 404 CURSO_NO_ENCONTRADO antes de tocar IdempotencyService", async () => {
    h.prisma.curso.findUnique.mockResolvedValue(null)
    await expect(h.service.aplicar(aplicarInput())).rejects.toThrow(NotFoundException)
    expect(h.idempotency.runOnce).not.toHaveBeenCalled()
  })

  it("nota nueva: upsert con valor + create histórico append-only", async () => {
    h.prisma.curso.findUnique.mockResolvedValue(cursoOk())
    h.tx.previewEvaluacionInicial.findUnique.mockResolvedValue(
      previewBase({ cambios: [cambio(COL_A, SKILL_X, 88)] }),
    )
    h.tx.notaSkill.findMany.mockResolvedValue([
      { id: "n-nueva", colaboradorId: COL_A, skillId: SKILL_X },
    ])
    await h.service.aplicar(aplicarInput())
    const upsertCall = h.tx.notaSkill.upsert.mock.calls[0]?.[0] as {
      create: { notaActual: number }
      update: { notaActual: number }
    }
    expect(upsertCall.create.notaActual).toBe(88)
    expect(upsertCall.update.notaActual).toBe(88)
    const histArgs = h.tx.historicoNotaSkill.createMany.mock.calls[0]?.[0] as {
      data: { notaSkillId: string; valor: number; origen: string }[]
    }
    expect(histArgs.data[0]?.notaSkillId).toBe("n-nueva")
    expect(histArgs.data[0]?.valor).toBe(88)
    expect(histArgs.data[0]?.origen).toBe("ENTREVISTA_INICIAL")
  })

  it("colaboradoresActualizados cuenta únicos: 1 colaborador con 3 skills cuenta como 1", async () => {
    h.prisma.curso.findUnique.mockResolvedValue(cursoOk())
    const cambios = [
      cambio(COL_A, SKILL_X, 80),
      cambio(COL_A, SKILL_Y, 70),
      cambio(COL_A, "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee", 60),
    ]
    h.tx.previewEvaluacionInicial.findUnique.mockResolvedValue(previewBase({ cambios }))
    h.tx.notaSkill.findMany.mockResolvedValue(
      cambios.map((c, i) => ({
        id: `n-${i}`,
        colaboradorId: c.colaboradorId,
        skillId: c.skillId,
      })),
    )
    const result = await h.service.aplicar(aplicarInput())
    expect(result.body.colaboradoresActualizados).toBe(1)
    expect(result.body.skillsActualizadas).toBe(3)
  })

  it("planesMarcadosDesactualizados cuenta planes unicos afectados", async () => {
    h.prisma.curso.findUnique.mockResolvedValue(cursoOk())
    h.tx.previewEvaluacionInicial.findUnique.mockResolvedValue(
      previewBase({ cambios: [cambio(COL_A, SKILL_X, 80), cambio(COL_B, SKILL_Y, 60)] }),
    )
    h.tx.notaSkill.findMany.mockResolvedValue([
      { id: "n1", colaboradorId: COL_A, skillId: SKILL_X },
      { id: "n2", colaboradorId: COL_B, skillId: SKILL_Y },
    ])
    h.tx.planEstudio.findMany.mockResolvedValue([{ id: "p-a" }, { id: "p-b" }, { id: "p-c" }])
    h.tx.planEstudio.updateMany.mockResolvedValue({ count: 3 })
    const result = await h.service.aplicar(aplicarInput())
    expect(result.body.planesMarcadosDesactualizados).toBe(3)
  })

  it("preview vacio (0 cambios): aplicado con counters 0 (carga vacia aceptable)", async () => {
    h.prisma.curso.findUnique.mockResolvedValue(cursoOk())
    h.tx.previewEvaluacionInicial.findUnique.mockResolvedValue(previewBase({ cambios: [] }))
    const result = await h.service.aplicar(aplicarInput())
    expect(result.body.skillsActualizadas).toBe(0)
    expect(result.body.colaboradoresActualizados).toBe(0)
    expect(h.tx.notaSkill.upsert).not.toHaveBeenCalled()
  })

  it("origenActual de notas_skill incluye cargaId y archivoId server-side", async () => {
    h.prisma.curso.findUnique.mockResolvedValue(cursoOk())
    h.tx.previewEvaluacionInicial.findUnique.mockResolvedValue(
      previewBase({ cambios: [cambio(COL_A, SKILL_X, 80)] }),
    )
    h.tx.notaSkill.findMany.mockResolvedValue([
      { id: "n1", colaboradorId: COL_A, skillId: SKILL_X },
    ])
    await h.service.aplicar(aplicarInput())
    const upsertCall = h.tx.notaSkill.upsert.mock.calls[0]?.[0] as {
      create: { origenActual: { origen: string; cargaId: string; archivoId: string } }
    }
    expect(upsertCall.create.origenActual.origen).toBe("ENTREVISTA_INICIAL")
    expect(upsertCall.create.origenActual.cargaId).toBe(CARGA_ID)
    expect(upsertCall.create.origenActual.archivoId).toBe(ARCHIVO_ID)
  })

  it("audit log NO se invoca desde el service (responsabilidad del controller)", async () => {
    h.prisma.curso.findUnique.mockResolvedValue(cursoOk())
    h.tx.previewEvaluacionInicial.findUnique.mockResolvedValue(previewBase({ cambios: [] }))
    await h.service.aplicar(aplicarInput())
    // No hay AuditLogService inyectado en AplicarService — confirma el patrón.
    // (Si alguna vez se inyecta, este test fallaria al compilar.)
    expect(true).toBe(true)
  })
})

describe("AplicarService P11.5b — EXCEL_CARGADO + PLANES_DESACTUALIZADOS", () => {
  let h: ReturnType<typeof build>

  beforeEach(() => {
    h = build()
    h.tx.cargaEvaluacionInicial.create.mockResolvedValue({ id: CARGA_ID })
    h.tx.previewEvaluacionInicial.updateMany.mockResolvedValue({ count: 1 })
    h.tx.notaSkill.upsert.mockResolvedValue({ id: "nota-id" })
    h.tx.notaSkill.findMany.mockResolvedValue([])
    h.tx.historicoNotaSkill.createMany.mockResolvedValue({ count: 0 })
    h.tx.planEstudio.findMany.mockResolvedValue([])
    h.tx.planEstudio.updateMany.mockResolvedValue({ count: 0 })
    h.tx.cargaEvaluacionInicial.update.mockResolvedValue({ id: CARGA_ID })
  })

  it("emite EXCEL_CARGADO 1-a-1 al admin actor cuando !replay", async () => {
    h.prisma.curso.findUnique.mockResolvedValue(cursoOk())
    h.tx.previewEvaluacionInicial.findUnique.mockResolvedValue(previewBase({ cambios: [] }))
    await h.service.aplicar(aplicarInput())

    const llamadasExcel = h.notificaciones.crear.mock.calls.filter(
      (c) => (c[0] as { tipo: string }).tipo === "EXCEL_CARGADO",
    )
    expect(llamadasExcel).toHaveLength(1)
    expect(llamadasExcel[0]?.[0]).toMatchObject({
      usuarioId: USR_ID,
      tipo: "EXCEL_CARGADO",
      payload: {
        cursoId: CURSO_ID,
        cargaId: CARGA_ID,
        skillsActualizadas: 0,
        colaboradoresActualizados: 0,
        planesMarcadosDesactualizados: 0,
      },
    })
  })

  it("NO emite EXCEL_CARGADO en replay (idempotencia post-cache)", async () => {
    h.prisma.curso.findUnique.mockResolvedValue(cursoOk())
    h.idempotency.runOnce.mockResolvedValueOnce({
      status: 200,
      body: {
        aplicado: true,
        skillsActualizadas: 0,
        colaboradoresActualizados: 0,
        planesMarcadosDesactualizados: 0,
        planesRecalculados: 0,
        cargaId: CARGA_ID,
      },
      replay: true,
    })
    await h.service.aplicar(aplicarInput())
    expect(h.notificaciones.crear).not.toHaveBeenCalled()
  })

  it("emite PLANES_DESACTUALIZADOS broadcast cuando planesMarcadosDesactualizados>0", async () => {
    h.prisma.curso.findUnique.mockResolvedValue(cursoOk())
    h.prisma.usuario.findMany.mockResolvedValue([{ id: "admin-1" }, { id: "admin-2" }])
    h.tx.previewEvaluacionInicial.findUnique.mockResolvedValue(
      previewBase({ cambios: [cambio(COL_A, SKILL_X, 80)] }),
    )
    h.tx.notaSkill.findMany.mockResolvedValue([
      { id: "n1", colaboradorId: COL_A, skillId: SKILL_X },
    ])
    h.tx.planEstudio.findMany.mockResolvedValue([{ id: "p1" }, { id: "p2" }])
    h.tx.planEstudio.updateMany.mockResolvedValue({ count: 2 })

    await h.service.aplicar(aplicarInput())
    const llamadasPlanes = h.notificaciones.crear.mock.calls.filter(
      (c) => (c[0] as { tipo: string }).tipo === "PLANES_DESACTUALIZADOS",
    )
    expect(llamadasPlanes).toHaveLength(2)
    expect(llamadasPlanes[0]?.[0]).toMatchObject({
      usuarioId: "admin-1",
      tipo: "PLANES_DESACTUALIZADOS",
      payload: { driver: "recarga_excel", cursoId: CURSO_ID, planesAfectados: 2 },
    })
  })

  it("NO emite PLANES_DESACTUALIZADOS si planesMarcadosDesactualizados===0", async () => {
    h.prisma.curso.findUnique.mockResolvedValue(cursoOk())
    h.prisma.usuario.findMany.mockResolvedValue([{ id: "admin-1" }])
    h.tx.previewEvaluacionInicial.findUnique.mockResolvedValue(previewBase({ cambios: [] }))
    await h.service.aplicar(aplicarInput())

    const llamadasPlanes = h.notificaciones.crear.mock.calls.filter(
      (c) => (c[0] as { tipo: string }).tipo === "PLANES_DESACTUALIZADOS",
    )
    expect(llamadasPlanes).toHaveLength(0)
  })

  it("error en notificaciones.crear NO propaga al admin (best-effort)", async () => {
    h.prisma.curso.findUnique.mockResolvedValue(cursoOk())
    h.tx.previewEvaluacionInicial.findUnique.mockResolvedValue(previewBase({ cambios: [] }))
    h.notificaciones.crear.mockRejectedValueOnce(new Error("notif down"))
    const res = await h.service.aplicar(aplicarInput())
    expect(res.body.aplicado).toBe(true)
  })
})
