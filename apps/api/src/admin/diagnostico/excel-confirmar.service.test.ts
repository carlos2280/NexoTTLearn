import { describe, expect, it, vi } from "vitest"
import type { PrismaService } from "../../common/prisma/prisma.service"
import { ExcelConfirmarService } from "./excel-confirmar.service"
import type { CacheEntryFila } from "./excel-upload-cache.service"
import { ExcelUploadCacheService } from "./excel-upload-cache.service"

const CURSO_ID = "11111111-1111-1111-1111-111111111111"
const OTRO_CURSO_ID = "22222222-2222-2222-2222-222222222222"
const ACTOR_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
const UPLOAD_ID = "uuuuuuuu-uuuu-uuuu-uuuu-uuuuuuuuuuuu"

interface PrismaTxMock {
  evaluacionInicial: {
    findUnique: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
  }
  logActividad: { create: ReturnType<typeof vi.fn> }
}

interface PrismaMock {
  inscripcion: { findMany: ReturnType<typeof vi.fn> }
  $transaction: ReturnType<typeof vi.fn>
  _tx: PrismaTxMock
}

function buildPrisma(): PrismaMock {
  const tx: PrismaTxMock = {
    evaluacionInicial: {
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    logActividad: { create: vi.fn() },
  }
  const $transaction = vi.fn(async (cb: (tx: PrismaTxMock) => Promise<unknown>) => cb(tx))
  return { inscripcion: { findMany: vi.fn() }, $transaction, _tx: tx }
}

function buildService() {
  const prisma = buildPrisma()
  const cache = new ExcelUploadCacheService()
  const service = new ExcelConfirmarService(prisma as unknown as PrismaService, cache)
  return { service, prisma, cache }
}

function fila(
  email: string,
  estado: CacheEntryFila["estado"],
  notas: ReadonlyArray<{ areaId: string; valor: number | null }>,
): CacheEntryFila {
  return { email, nombre: email, notas, estado, mensajes: [] }
}

describe("ExcelConfirmarService", () => {
  it("aplica filas ok+warning, ignora errores y devuelve contadores", async () => {
    const { service, prisma, cache } = buildService()
    cache.set(UPLOAD_ID, CURSO_ID, [
      fila("ana@ntt.com", "ok", [
        { areaId: "a-1", valor: 80 },
        { areaId: "a-2", valor: 90 },
      ]),
      fila("luis@ntt.com", "warning", [
        { areaId: "a-1", valor: 100 },
        { areaId: "a-2", valor: null },
      ]),
      fila("err@ntt.com", "error", [{ areaId: "a-1", valor: 50 }]),
    ])
    prisma.inscripcion.findMany.mockResolvedValue([
      { id: "i-ana", participante: { email: "ana@ntt.com" } },
      { id: "i-luis", participante: { email: "luis@ntt.com" } },
    ])
    prisma._tx.evaluacionInicial.findUnique.mockResolvedValue(null)
    prisma._tx.evaluacionInicial.create.mockImplementation(
      async (args: { data: Record<string, unknown> }) => ({
        id: `ev-${args.data.areaId}`,
        inscripcionId: args.data.inscripcionId,
        areaId: args.data.areaId,
        puntaje: args.data.puntaje,
        observaciones: null,
        capturadaPorId: args.data.capturadaPorId,
        capturadaAt: new Date(),
        updatedAt: new Date(),
        area: { nombre: "X" },
      }),
    )

    const r = await service.confirmar({
      cursoId: CURSO_ID,
      uploadId: UPLOAD_ID,
      actorId: ACTOR_ID,
    })

    expect(r).toEqual({ aplicadas: 2, ignoradas: 1 })
    // 2 areas para ana + 1 para luis = 3 creates totales.
    expect(prisma._tx.evaluacionInicial.create).toHaveBeenCalledTimes(3)
    expect(prisma._tx.logActividad.create).toHaveBeenCalledTimes(3)
    // uploadId invalidado tras exito.
    expect(cache.get(UPLOAD_ID, CURSO_ID)).toBeNull()
    cache.onModuleDestroy()
  })

  it("404 si uploadId no existe", async () => {
    const { service, cache } = buildService()
    await expect(
      service.confirmar({ cursoId: CURSO_ID, uploadId: UPLOAD_ID, actorId: ACTOR_ID }),
    ).rejects.toThrow(/expirado o inexistente/i)
    cache.onModuleDestroy()
  })

  it("404 si uploadId pertenece a otro curso", async () => {
    const { service, cache } = buildService()
    cache.set(UPLOAD_ID, OTRO_CURSO_ID, [fila("a@b.com", "ok", [])])
    await expect(
      service.confirmar({ cursoId: CURSO_ID, uploadId: UPLOAD_ID, actorId: ACTOR_ID }),
    ).rejects.toThrow(/expirado o inexistente/i)
    cache.onModuleDestroy()
  })

  it("idempotencia: re-confirmar mismo uploadId devuelve 404", async () => {
    const { service, prisma, cache } = buildService()
    cache.set(UPLOAD_ID, CURSO_ID, [fila("ana@ntt.com", "ok", [{ areaId: "a-1", valor: 80 }])])
    prisma.inscripcion.findMany.mockResolvedValue([
      { id: "i-ana", participante: { email: "ana@ntt.com" } },
    ])
    prisma._tx.evaluacionInicial.findUnique.mockResolvedValue(null)
    prisma._tx.evaluacionInicial.create.mockResolvedValue({
      id: "ev-1",
      inscripcionId: "i-ana",
      areaId: "a-1",
      puntaje: 80,
      observaciones: null,
      capturadaPorId: ACTOR_ID,
      capturadaAt: new Date(),
      updatedAt: new Date(),
      area: { nombre: "X" },
    })

    await service.confirmar({ cursoId: CURSO_ID, uploadId: UPLOAD_ID, actorId: ACTOR_ID })
    await expect(
      service.confirmar({ cursoId: CURSO_ID, uploadId: UPLOAD_ID, actorId: ACTOR_ID }),
    ).rejects.toThrow(/expirado o inexistente/i)
    cache.onModuleDestroy()
  })

  it("ignora silenciosamente fila cuyo email ya no tiene inscripcion activa", async () => {
    const { service, prisma, cache } = buildService()
    cache.set(UPLOAD_ID, CURSO_ID, [fila("ghost@ntt.com", "ok", [{ areaId: "a-1", valor: 80 }])])
    prisma.inscripcion.findMany.mockResolvedValue([])

    const r = await service.confirmar({
      cursoId: CURSO_ID,
      uploadId: UPLOAD_ID,
      actorId: ACTOR_ID,
    })
    expect(r).toEqual({ aplicadas: 0, ignoradas: 1 })
    expect(prisma._tx.evaluacionInicial.create).not.toHaveBeenCalled()
    cache.onModuleDestroy()
  })

  it("update si la captura ya existia (preserva snapshot antes/despues)", async () => {
    const { service, prisma, cache } = buildService()
    cache.set(UPLOAD_ID, CURSO_ID, [fila("ana@ntt.com", "ok", [{ areaId: "a-1", valor: 90 }])])
    prisma.inscripcion.findMany.mockResolvedValue([
      { id: "i-ana", participante: { email: "ana@ntt.com" } },
    ])
    prisma._tx.evaluacionInicial.findUnique.mockResolvedValue({
      id: "ev-1",
      inscripcionId: "i-ana",
      areaId: "a-1",
      puntaje: 50,
      observaciones: null,
      capturadaPorId: ACTOR_ID,
      capturadaAt: new Date(),
      updatedAt: new Date(),
      area: { nombre: "X" },
    })
    prisma._tx.evaluacionInicial.update.mockResolvedValue({
      id: "ev-1",
      inscripcionId: "i-ana",
      areaId: "a-1",
      puntaje: 90,
      observaciones: null,
      capturadaPorId: ACTOR_ID,
      capturadaAt: new Date(),
      updatedAt: new Date(),
      area: { nombre: "X" },
    })

    const r = await service.confirmar({
      cursoId: CURSO_ID,
      uploadId: UPLOAD_ID,
      actorId: ACTOR_ID,
    })
    expect(r.aplicadas).toBe(1)
    expect(prisma._tx.evaluacionInicial.update).toHaveBeenCalledTimes(1)
    expect(prisma._tx.evaluacionInicial.create).not.toHaveBeenCalled()
    cache.onModuleDestroy()
  })
})
