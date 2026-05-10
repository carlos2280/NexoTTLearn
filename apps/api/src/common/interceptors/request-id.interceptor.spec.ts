import { CallHandler, ExecutionContext } from "@nestjs/common"
import { Request, Response } from "express"
import { of } from "rxjs"
import { describe, expect, it, vi } from "vitest"
import { RequestIdInterceptor } from "./request-id.interceptor"

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

interface CtxResult {
  readonly context: ExecutionContext
  readonly request: Partial<Request>
  readonly response: { setHeader: ReturnType<typeof vi.fn> }
}

function buildContext(headerEntrante?: string): CtxResult {
  const headers: Record<string, string | undefined> = {}
  if (headerEntrante !== undefined) {
    headers["x-request-id"] = headerEntrante
  }
  const request: Partial<Request> = { headers: headers as Request["headers"] }
  const response = { setHeader: vi.fn() }
  const context = {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response as unknown as Response,
      getNext: () => ({}),
    }),
  } as unknown as ExecutionContext
  return { context, request, response }
}

function buildHandler(): CallHandler {
  return { handle: () => of("ok") }
}

describe("RequestIdInterceptor", () => {
  it("genera un UUID cuando no llega header X-Request-Id", () => {
    const interceptor = new RequestIdInterceptor()
    const { context, request, response } = buildContext()

    interceptor.intercept(context, buildHandler())

    const generado = request.headers?.["x-request-id"]
    expect(typeof generado).toBe("string")
    expect(generado).toMatch(UUID_REGEX)
    expect(response.setHeader).toHaveBeenCalledWith("X-Request-Id", generado)
  })

  it("respeta el header X-Request-Id entrante y lo refleja en la respuesta", () => {
    const interceptor = new RequestIdInterceptor()
    const entrante = "req-123-correlacion"
    const { context, request, response } = buildContext(entrante)

    interceptor.intercept(context, buildHandler())

    expect(request.headers?.["x-request-id"]).toBe(entrante)
    expect(response.setHeader).toHaveBeenCalledWith("X-Request-Id", entrante)
  })
})
