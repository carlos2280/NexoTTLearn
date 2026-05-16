import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { ArchivoTipo } from "@prisma/client"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { apiErrorCodes } from "../errors/api-error.codes"
import { PrismaService } from "../prisma/prisma.service"
import { StorageService } from "./storage.service"

interface MockArchivoRecord {
  id: string
  path: string
  mimeType: string
  tipo: ArchivoTipo
  tamanioBytes: number
}

interface PrismaMock {
  archivo: {
    create: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
    findUnique: ReturnType<typeof vi.fn>
    delete: ReturnType<typeof vi.fn>
  }
  $transaction: ReturnType<typeof vi.fn>
}

let storageRoot: string

function buildPrismaMock(): { prisma: PrismaMock; store: Map<string, MockArchivoRecord> } {
  const store = new Map<string, MockArchivoRecord>()
  let seq = 0
  const prisma: PrismaMock = {
    archivo: {
      // biome-ignore lint/suspicious/useAwait: mock impl sincrono que respeta la firma `Promise<>` de `Prisma.Delegate.create`.
      create: vi.fn().mockImplementation(async ({ data }) => {
        seq += 1
        const id = `archivo-${seq}`
        const record: MockArchivoRecord = {
          id,
          path: data.path ?? "",
          mimeType: data.mimeType,
          tipo: data.tipo,
          tamanioBytes: data.tamanioBytes,
        }
        store.set(id, record)
        return { id }
      }),
      // biome-ignore lint/suspicious/useAwait: idem — mock impl de `Prisma.Delegate.update`.
      update: vi.fn().mockImplementation(async ({ where, data }) => {
        const rec = store.get(where.id)
        if (!rec) {
          throw new Error("not found")
        }
        if (typeof data.path === "string") {
          rec.path = data.path
        }
        return { id: rec.id }
      }),
      // biome-ignore lint/suspicious/useAwait: idem — mock impl de `Prisma.Delegate.findUnique`.
      findUnique: vi.fn().mockImplementation(async ({ where }) => {
        const rec = store.get(where.id)
        if (!rec) {
          return null
        }
        return {
          id: rec.id,
          tipo: rec.tipo,
          path: rec.path,
          mimeType: rec.mimeType,
          tamanioBytes: rec.tamanioBytes,
        }
      }),
      // biome-ignore lint/suspicious/useAwait: idem — mock impl de `Prisma.Delegate.delete`.
      delete: vi.fn().mockImplementation(async ({ where }) => {
        store.delete(where.id)
        return { id: where.id }
      }),
    },
    $transaction: vi.fn(),
  } as PrismaMock
  prisma.$transaction.mockImplementation(async (cb: (tx: PrismaMock) => unknown) => cb(prisma))
  return { prisma, store }
}

function buildConfig(): ConfigService {
  return {
    get: vi.fn().mockReturnValue(storageRoot),
  } as unknown as ConfigService
}

describe("StorageService", () => {
  beforeEach(() => {
    storageRoot = mkdtempSync(join(tmpdir(), "storage-test-"))
  })

  afterEach(() => {
    if (existsSync(storageRoot)) {
      rmSync(storageRoot, { recursive: true, force: true })
    }
  })

  it("round-trip: guardar y leer devuelven el mismo buffer", async () => {
    const { prisma } = buildPrismaMock()
    const service = new StorageService(prisma as unknown as PrismaService, buildConfig())

    const contenido = Buffer.from("hola-evaluacion-inicial", "utf-8")
    const { archivoId, path } = await service.guardar({
      contenido,
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      tipo: ArchivoTipo.EVALUACION_INICIAL_EXCEL,
      subidoPorUsuarioId: "usr-1",
    })

    expect(archivoId).toMatch(/^archivo-/)
    expect(path).toContain("EVALUACION_INICIAL_EXCEL/")
    expect(path).toContain(`${archivoId}.xlsx`)

    const leido = await service.leer(archivoId)
    expect(leido.contenido.equals(contenido)).toBe(true)
    expect(leido.mimeType).toBe("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")

    const absoluto = resolve(storageRoot, path)
    expect(readFileSync(absoluto).equals(contenido)).toBe(true)
  })

  it("borrar elimina el archivo fisico y el registro", async () => {
    const { prisma, store } = buildPrismaMock()
    const service = new StorageService(prisma as unknown as PrismaService, buildConfig())

    const { archivoId, path } = await service.guardar({
      contenido: Buffer.from("data"),
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      tipo: ArchivoTipo.EVALUACION_INICIAL_EXCEL,
      subidoPorUsuarioId: "usr-1",
    })
    expect(existsSync(resolve(storageRoot, path))).toBe(true)

    await service.borrar(archivoId)

    expect(existsSync(resolve(storageRoot, path))).toBe(false)
    expect(store.has(archivoId)).toBe(false)
  })

  it("leer lanza NotFoundException si el archivo no existe", async () => {
    const { prisma } = buildPrismaMock()
    const service = new StorageService(prisma as unknown as PrismaService, buildConfig())

    await expect(service.leer("inexistente")).rejects.toBeInstanceOf(NotFoundException)
  })

  it("anti path-traversal: leer rechaza paths que escapan de STORAGE_ROOT", async () => {
    const { prisma } = buildPrismaMock()
    const service = new StorageService(prisma as unknown as PrismaService, buildConfig())

    // Insertamos en el mock un registro con path malicioso simulando datos corruptos.
    const { archivoId } = await service.guardar({
      contenido: Buffer.from("ok"),
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      tipo: ArchivoTipo.EVALUACION_INICIAL_EXCEL,
      subidoPorUsuarioId: "usr-1",
    })
    // Sobrescribimos manualmente el path en el mock store mediante update.
    prisma.archivo.findUnique.mockResolvedValueOnce({
      id: archivoId,
      tipo: ArchivoTipo.EVALUACION_INICIAL_EXCEL,
      path: "../../../etc/passwd",
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      tamanioBytes: 0,
    })

    let caught: unknown
    try {
      await service.leer(archivoId)
    } catch (error) {
      caught = error
    }
    expect(caught).toBeInstanceOf(InternalServerErrorException)
    const exception = caught as InternalServerErrorException
    const resp = exception.getResponse() as { code?: string }
    expect(resp.code).toBe(apiErrorCodes.archivoPathInvalido)
  })

  it("borrar es idempotente: si el archivo no existe no falla", async () => {
    const { prisma } = buildPrismaMock()
    const service = new StorageService(prisma as unknown as PrismaService, buildConfig())

    await expect(service.borrar("inexistente")).resolves.toBeUndefined()
  })

  it("borrar tolera ausencia fisica del archivo (registro queda eliminado)", async () => {
    const { prisma, store } = buildPrismaMock()
    const service = new StorageService(prisma as unknown as PrismaService, buildConfig())

    const { archivoId, path } = await service.guardar({
      contenido: Buffer.from("data"),
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      tipo: ArchivoTipo.EVALUACION_INICIAL_EXCEL,
      subidoPorUsuarioId: "usr-1",
    })
    rmSync(resolve(storageRoot, path), { force: true })

    await service.borrar(archivoId)
    expect(store.has(archivoId)).toBe(false)
  })

  it("crea subdirectorios anidados por tipo/anio/mes", async () => {
    const { prisma } = buildPrismaMock()
    const service = new StorageService(prisma as unknown as PrismaService, buildConfig())

    const { path } = await service.guardar({
      contenido: Buffer.from("data"),
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      tipo: ArchivoTipo.EVALUACION_INICIAL_EXCEL,
      subidoPorUsuarioId: "usr-1",
    })

    const partes = path.split("/")
    expect(partes[0]).toBe("EVALUACION_INICIAL_EXCEL")
    expect(partes[1]).toMatch(/^\d{4}$/)
    expect(partes[2]).toMatch(/^\d{2}$/)
    expect(partes[3]).toMatch(/^archivo-\d+\.xlsx$/)
  })

  it("writeFile falla => fila NO persiste (rollback)", async () => {
    const { prisma, store } = buildPrismaMock()
    // El $transaction debe propagar el error pero ANTES eliminar lo creado
    // (simulamos rollback recortando el store si el callback lanza).
    prisma.$transaction.mockImplementation(async (cb: (tx: PrismaMock) => unknown) => {
      const snapshot = new Set(store.keys())
      try {
        return await cb(prisma)
      } catch (err) {
        for (const k of [...store.keys()]) {
          if (!snapshot.has(k)) {
            store.delete(k)
          }
        }
        throw err
      }
    })

    const service = new StorageService(prisma as unknown as PrismaService, buildConfig())
    // Forzamos fallo en writeFile haciendo que el storageRoot apunte a un
    // path no escribible: redefinimos el config para un path invalido como
    // archivo en lugar de directorio.
    writeFileSync(join(storageRoot, "BLOQUEADO"), "x")
    const storageBloqueado = join(storageRoot, "BLOQUEADO", "subdir-invalido")
    const cfgBloqueado = {
      get: vi.fn().mockReturnValue(storageBloqueado),
    } as unknown as ConfigService
    const serviceBloqueado = new StorageService(prisma as unknown as PrismaService, cfgBloqueado)

    await expect(
      serviceBloqueado.guardar({
        contenido: Buffer.from("data"),
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        tipo: ArchivoTipo.EVALUACION_INICIAL_EXCEL,
        subidoPorUsuarioId: "usr-1",
      }),
    ).rejects.toThrow()
    // El store fue saneado por el rollback simulado.
    expect(store.size).toBe(0)
    expect(service).toBeDefined()
  })

  it("guardar con metadata valida: ok", async () => {
    const { prisma } = buildPrismaMock()
    const service = new StorageService(prisma as unknown as PrismaService, buildConfig())

    const { archivoId } = await service.guardar({
      contenido: Buffer.from("data"),
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      tipo: ArchivoTipo.EVALUACION_INICIAL_EXCEL,
      subidoPorUsuarioId: "11111111-1111-4111-8111-111111111111",
      metadata: {
        tipo: ArchivoTipo.EVALUACION_INICIAL_EXCEL,
        nombreOriginal: "evaluacion.xlsx",
        cursoId: "22222222-2222-4222-8222-222222222222",
        subidoPorUsuarioId: "11111111-1111-4111-8111-111111111111",
      },
    })
    expect(archivoId).toMatch(/^archivo-/)
  })

  it("guardar con metadata sin nombreOriginal: 400 invalidBody", async () => {
    const { prisma } = buildPrismaMock()
    const service = new StorageService(prisma as unknown as PrismaService, buildConfig())

    let caught: unknown
    try {
      await service.guardar({
        contenido: Buffer.from("data"),
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        tipo: ArchivoTipo.EVALUACION_INICIAL_EXCEL,
        subidoPorUsuarioId: "11111111-1111-4111-8111-111111111111",
        metadata: {
          tipo: ArchivoTipo.EVALUACION_INICIAL_EXCEL,
          cursoId: "22222222-2222-4222-8222-222222222222",
          subidoPorUsuarioId: "11111111-1111-4111-8111-111111111111",
        },
      })
    } catch (error) {
      caught = error
    }
    expect(caught).toBeInstanceOf(BadRequestException)
    const resp = (caught as BadRequestException).getResponse() as { code?: string }
    expect(resp.code).toBe(apiErrorCodes.invalidBody)
  })

  // Sanity check de que el helper de fs.mkdir crea recursivamente.
  it("escribe sobre directorios pre-existentes sin fallar", async () => {
    const { prisma } = buildPrismaMock()
    const service = new StorageService(prisma as unknown as PrismaService, buildConfig())

    mkdirSync(join(storageRoot, "EVALUACION_INICIAL_EXCEL"), { recursive: true })
    writeFileSync(join(storageRoot, "EVALUACION_INICIAL_EXCEL", "marker"), "x")

    const { archivoId } = await service.guardar({
      contenido: Buffer.from("data"),
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      tipo: ArchivoTipo.EVALUACION_INICIAL_EXCEL,
      subidoPorUsuarioId: "usr-1",
    })
    expect(archivoId).toBeTruthy()
  })
})
