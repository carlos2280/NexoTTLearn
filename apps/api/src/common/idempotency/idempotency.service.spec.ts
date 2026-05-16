import { ConflictException } from "@nestjs/common"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { apiErrorCodes } from "../errors/api-error.codes"
import { PrismaService } from "../prisma/prisma.service"
import { IdempotencyService } from "./idempotency.service"

interface IdempotencyRow {
  scope: string
  key: string
  usuarioId: string
  requestHash: string
  responseStatus: number
  responseBody: unknown
}

function buildPrismaMock(store: Map<string, IdempotencyRow>) {
  const tx = {
    idempotencyKey: {
      // biome-ignore lint/suspicious/useAwait: mock impl que devuelve un valor sincrono; `async` mantiene la firma `Promise<>` de `Prisma.Delegate.findUnique`.
      findUnique: vi.fn().mockImplementation(async ({ where }) => {
        const compoundKey = `${where.scope_key_usuarioId.scope}|${where.scope_key_usuarioId.key}|${where.scope_key_usuarioId.usuarioId}`
        return store.get(compoundKey) ?? null
      }),
      // biome-ignore lint/suspicious/useAwait: idem — mock impl de `Prisma.Delegate.create`.
      create: vi.fn().mockImplementation(async ({ data }) => {
        const compoundKey = `${data.scope}|${data.key}|${data.usuarioId}`
        store.set(compoundKey, {
          scope: data.scope,
          key: data.key,
          usuarioId: data.usuarioId,
          requestHash: data.requestHash,
          responseStatus: data.responseStatus,
          responseBody: data.responseBody,
        })
        return { scope: data.scope, key: data.key, usuarioId: data.usuarioId }
      }),
    },
  }
  return {
    $transaction: vi
      .fn()
      .mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => await cb(tx)),
    tx,
  }
}

const SCOPE = "evaluacion-inicial.aplicar"
const USUARIO = "usr-1"
const KEY = "idem-001"

describe("IdempotencyService.runOnce", () => {
  let store: Map<string, IdempotencyRow>
  let prismaMock: ReturnType<typeof buildPrismaMock>
  let service: IdempotencyService

  beforeEach(() => {
    store = new Map()
    prismaMock = buildPrismaMock(store)
    service = new IdempotencyService(prismaMock as unknown as PrismaService)
  })

  it("primera llamada: ejecuta el ejecutor y persiste la fila idempotency", async () => {
    const ejecutor = vi.fn().mockResolvedValue({ status: 200, body: { ok: true } })

    const result = await service.runOnce({
      scope: SCOPE,
      key: KEY,
      usuarioId: USUARIO,
      requestPayload: { foo: 1 },
      ejecutor,
    })

    expect(result.replay).toBe(false)
    expect(result.status).toBe(200)
    expect(result.body).toEqual({ ok: true })
    expect(ejecutor).toHaveBeenCalledTimes(1)
    expect(prismaMock.tx.idempotencyKey.create).toHaveBeenCalledTimes(1)
  })

  it("segunda llamada con mismo hash devuelve replay sin invocar ejecutor", async () => {
    const ejecutor1 = vi.fn().mockResolvedValue({ status: 201, body: { id: "x" } })
    await service.runOnce({
      scope: SCOPE,
      key: KEY,
      usuarioId: USUARIO,
      requestPayload: { foo: 1, bar: 2 },
      ejecutor: ejecutor1,
    })

    const ejecutor2 = vi.fn()
    const replay = await service.runOnce({
      scope: SCOPE,
      key: KEY,
      usuarioId: USUARIO,
      requestPayload: { foo: 1, bar: 2 },
      ejecutor: ejecutor2,
    })

    expect(replay.replay).toBe(true)
    expect(replay.status).toBe(201)
    expect(replay.body).toEqual({ id: "x" })
    expect(ejecutor2).not.toHaveBeenCalled()
  })

  it("orden de claves del payload no afecta el hash (replay seguro)", async () => {
    const ejecutor1 = vi.fn().mockResolvedValue({ status: 200, body: 1 })
    await service.runOnce({
      scope: SCOPE,
      key: KEY,
      usuarioId: USUARIO,
      requestPayload: { a: 1, b: 2, c: 3 },
      ejecutor: ejecutor1,
    })

    const ejecutor2 = vi.fn()
    const replay = await service.runOnce({
      scope: SCOPE,
      key: KEY,
      usuarioId: USUARIO,
      requestPayload: { c: 3, a: 1, b: 2 },
      ejecutor: ejecutor2,
    })
    expect(replay.replay).toBe(true)
    expect(ejecutor2).not.toHaveBeenCalled()
  })

  it("misma key con body distinto lanza 409 CONFLICT_IDEMPOTENCY_KEY_REUSADA_CON_BODY_DISTINTO", async () => {
    await service.runOnce({
      scope: SCOPE,
      key: KEY,
      usuarioId: USUARIO,
      requestPayload: { foo: 1 },
      ejecutor: vi.fn().mockResolvedValue({ status: 200, body: 1 }),
    })

    let caught: unknown
    try {
      await service.runOnce({
        scope: SCOPE,
        key: KEY,
        usuarioId: USUARIO,
        requestPayload: { foo: 2 },
        ejecutor: vi.fn(),
      })
    } catch (error) {
      caught = error
    }
    expect(caught).toBeInstanceOf(ConflictException)
    const conflict = caught as ConflictException
    const resp = conflict.getResponse() as { code?: string }
    expect(resp.code).toBe(apiErrorCodes.conflictIdempotencyKeyReusadaConBodyDistinto)
  })

  it("distintos usuarios con misma scope+key no colisionan", async () => {
    await service.runOnce({
      scope: SCOPE,
      key: KEY,
      usuarioId: "usr-A",
      requestPayload: { foo: 1 },
      ejecutor: vi.fn().mockResolvedValue({ status: 200, body: "a" }),
    })
    const result = await service.runOnce({
      scope: SCOPE,
      key: KEY,
      usuarioId: "usr-B",
      requestPayload: { foo: 1 },
      ejecutor: vi.fn().mockResolvedValue({ status: 200, body: "b" }),
    })
    expect(result.replay).toBe(false)
    expect(result.body).toBe("b")
  })

  it("si el ejecutor lanza, la fila idempotency NO se persiste (rollback)", async () => {
    const ejecutor = vi.fn().mockRejectedValue(new Error("boom"))
    await expect(
      service.runOnce({
        scope: SCOPE,
        key: KEY,
        usuarioId: USUARIO,
        requestPayload: { foo: 1 },
        ejecutor,
      }),
    ).rejects.toThrow("boom")
    // Reintento idempotente: deberia volver a ejecutar (no replay).
    const ejecutor2 = vi.fn().mockResolvedValue({ status: 200, body: "ok" })
    const result = await service.runOnce({
      scope: SCOPE,
      key: KEY,
      usuarioId: USUARIO,
      requestPayload: { foo: 1 },
      ejecutor: ejecutor2,
    })
    expect(result.replay).toBe(false)
    expect(ejecutor2).toHaveBeenCalledTimes(1)
  })
})
