import { ApiError } from "@/shared/api/api-error"
import { describe, expect, it } from "vitest"
import { cursosDuplicadosDelError } from "./curso-duplicado"

describe("cursosDuplicadosDelError", () => {
  const existente = { id: "c1", titulo: "Azure Básico", estado: "ACTIVO" }

  it("409 CURSO_TITULO_DUPLICADO: devuelve los cursos existentes", () => {
    const err = new ApiError(409, "CURSO_TITULO_DUPLICADO", "Ya existe", {
      cursosExistentes: [existente],
    })
    expect(cursosDuplicadosDelError(err)).toEqual([existente])
  })

  it("otro error o sin detalles: null (se muestra como error normal)", () => {
    expect(cursosDuplicadosDelError(new ApiError(409, "CONFLICT", "x"))).toBeNull()
    expect(
      cursosDuplicadosDelError(new ApiError(409, "CURSO_TITULO_DUPLICADO", "x", { otra: 1 })),
    ).toBeNull()
    expect(cursosDuplicadosDelError(new Error("red"))).toBeNull()
    expect(cursosDuplicadosDelError(null)).toBeNull()
  })
})
