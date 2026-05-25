import { HttpStatus } from "@nestjs/common"
import { Response } from "express"
import { describe, expect, it, vi } from "vitest"
import { HealthController } from "./health.controller"
import { HealthService } from "./health.service"

interface HealthServiceMock {
  readonly chequearBaseDatos: ReturnType<typeof vi.fn>
}

function buildHealthServiceMock(impl: () => Promise<"ok" | "down">): HealthServiceMock {
  return { chequearBaseDatos: vi.fn().mockImplementation(impl) }
}

function buildResponseMock(): Response {
  const res = { status: vi.fn() }
  return res as unknown as Response
}

describe("HealthController", () => {
  it("responde { status: ok, database: ok } cuando el service reporta ok", async () => {
    const service = buildHealthServiceMock(() => Promise.resolve("ok"))
    const controller = new HealthController(service as unknown as HealthService)
    const res = buildResponseMock()

    const result = await controller.check(res)

    expect(result).toEqual({ status: "ok", database: "ok" })
    expect(service.chequearBaseDatos).toHaveBeenCalledTimes(1)
    expect(res.status).not.toHaveBeenCalled()
  })

  it("responde database: down y forza 503 cuando el service reporta down", async () => {
    const service = buildHealthServiceMock(() => Promise.resolve("down"))
    const controller = new HealthController(service as unknown as HealthService)
    const res = buildResponseMock()

    const result = await controller.check(res)

    expect(result).toEqual({ status: "degraded", database: "down" })
    expect(res.status).toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE)
  })
})
