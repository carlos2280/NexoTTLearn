import { ArgumentMetadata, BadRequestException } from "@nestjs/common"
import { describe, expect, it } from "vitest"
import { z } from "zod"
import { ZodValidationPipe } from "./zod-validation.pipe"

const schema = z.object({
  email: z.string().email(),
  edad: z.number().int().positive(),
})

interface ErrorBody {
  readonly code: string
  readonly message: string
  readonly details: Record<string, readonly string[]>
}

const BODY_META: ArgumentMetadata = { type: "body", metatype: undefined, data: undefined }
const QUERY_META: ArgumentMetadata = { type: "query", metatype: undefined, data: undefined }

describe("ZodValidationPipe", () => {
  it("devuelve el valor parseado cuando es valido", () => {
    const pipe = new ZodValidationPipe(schema)
    const result = pipe.transform({ email: "a@b.com", edad: 30 }, BODY_META)
    expect(result).toEqual({ email: "a@b.com", edad: 30 })
  })

  it("lanza BadRequestException con code INVALID_BODY cuando falla en @Body", () => {
    const pipe = new ZodValidationPipe(schema)

    try {
      pipe.transform({ email: "no-es-email", edad: -1 }, BODY_META)
      throw new Error("se esperaba que el pipe lanzara")
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException)
      const response = (error as BadRequestException).getResponse() as ErrorBody
      expect(response.code).toBe("INVALID_BODY")
      expect(response.message).toBeTypeOf("string")
      expect(response.details.email).toBeDefined()
      expect(response.details.edad).toBeDefined()
      expect(Array.isArray(response.details.email)).toBe(true)
    }
  })

  it("emite INVALID_QUERY cuando metadata.type es 'query'", () => {
    const pipe = new ZodValidationPipe(schema)

    try {
      pipe.transform({ email: "no-es-email", edad: -1 }, QUERY_META)
      throw new Error("se esperaba que el pipe lanzara")
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException)
      const response = (error as BadRequestException).getResponse() as ErrorBody
      expect(response.code).toBe("INVALID_QUERY")
      expect(response.message).toContain("consulta")
      expect(response.details.email).toBeDefined()
    }
  })

  it("agrupa multiples errores por path", () => {
    const schemaAnidado = z.object({
      perfil: z.object({
        nombre: z.string().min(1),
        edad: z.number().int(),
      }),
    })
    const pipe = new ZodValidationPipe(schemaAnidado)

    try {
      pipe.transform({ perfil: { nombre: "", edad: 1.5 } }, BODY_META)
      throw new Error("se esperaba que el pipe lanzara")
    } catch (error) {
      const response = (error as BadRequestException).getResponse() as ErrorBody
      expect(response.details["perfil.nombre"]).toBeDefined()
      expect(response.details["perfil.edad"]).toBeDefined()
    }
  })
})
