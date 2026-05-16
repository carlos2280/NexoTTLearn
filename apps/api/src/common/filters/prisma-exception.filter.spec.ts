import { ArgumentsHost, HttpStatus } from "@nestjs/common"
import { Prisma } from "@prisma/client"
import { describe, expect, it, vi } from "vitest"
import { PrismaExceptionFilter } from "./prisma-exception.filter"

interface ResponseMock {
  readonly status: ReturnType<typeof vi.fn>
  readonly json: ReturnType<typeof vi.fn>
}

function makeHost(): { host: ArgumentsHost; res: ResponseMock } {
  const json = vi.fn()
  const status = vi.fn().mockReturnValue({ json })
  const res: ResponseMock = { status, json }
  const host = {
    switchToHttp: () => ({
      getResponse: () => res,
      getRequest: () => ({}),
      getNext: () => ({}),
    }),
  } as unknown as ArgumentsHost
  return { host, res }
}

function makePrismaError(code: string): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError("simulado", {
    code,
    clientVersion: "test",
  })
}

describe("PrismaExceptionFilter", () => {
  it("mapea P2002 a 409 CONFLICT", () => {
    const filter = new PrismaExceptionFilter()
    const { host, res } = makeHost()

    filter.catch(makePrismaError("P2002"), host)

    expect(res.status).toHaveBeenCalledWith(HttpStatus.CONFLICT)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: "CONFLICT" }))
  })

  it("mapea P2025 a 404 NO_ENCONTRADO", () => {
    const filter = new PrismaExceptionFilter()
    const { host, res } = makeHost()

    filter.catch(makePrismaError("P2025"), host)

    expect(res.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: "NO_ENCONTRADO" }))
  })

  it("mapea P2003 a 400 INVALID_BODY", () => {
    const filter = new PrismaExceptionFilter()
    const { host, res } = makeHost()

    filter.catch(makePrismaError("P2003"), host)

    expect(res.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: "INVALID_BODY" }))
  })

  it("mapea codigos desconocidos a 500 ERROR_INTERNO sin filtrar detalle", () => {
    const filter = new PrismaExceptionFilter()
    const { host, res } = makeHost()

    filter.catch(makePrismaError("P9999"), host)

    expect(res.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: "ERROR_INTERNO" }))
  })
})
