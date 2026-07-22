import { ApiError } from "@/shared/api/api-error"
import { describe, expect, it } from "vitest"
import { extraerPrecondicionesFallidas } from "./precondiciones-publicacion"

describe("extraerPrecondicionesFallidas", () => {
  it("mapea las precondiciones del 422 del backend, con detalle de suma", () => {
    const err = new ApiError(
      422,
      "conflict_curso_no_publicable",
      "El curso no cumple las precondiciones para publicarse.",
      {
        validacionesFallidas: [
          { codigo: "cliente_no_encontrado", mensaje: "El curso debe tener un cliente declarado." },
          {
            codigo: "validacion_peso_no_suma_100",
            mensaje: "La suma de pesos de areas debe ser 100.",
            detalles: { contexto: "AREAS", sumaActual: 80 },
          },
        ],
      },
    )

    const res = extraerPrecondicionesFallidas(err)

    expect(res).toHaveLength(2)
    expect(res[0]?.mensaje).toBe("El curso debe tener un cliente declarado.")
    expect(res[0]?.detalle).toBeUndefined()
    expect(res[1]?.detalle).toBe("Suma actual: 80.")
  })

  it("resume las skills sin cobertura por su etiqueta visible", () => {
    const err = new ApiError(422, "conflict_curso_no_publicable", "no publicable", {
      validacionesFallidas: [
        {
          codigo: "validacion_skill_sin_cobertura",
          mensaje: "Cada skill exigida debe estar cubierta por al menos un modulo habilitado.",
          detalles: {
            skills: [
              { skillId: "1", etiquetaVisible: "React" },
              { skillId: "2", etiquetaVisible: "SQL" },
            ],
          },
        },
      ],
    })

    expect(extraerPrecondicionesFallidas(err)[0]?.detalle).toBe("Skills sin cubrir: React, SQL.")
  })

  it("deja detalle undefined cuando el detalles no tiene suma ni skills reconocibles", () => {
    const err = new ApiError(422, "conflict_curso_no_publicable", "no publicable", {
      validacionesFallidas: [
        {
          codigo: "validacion_curso_fechas",
          mensaje: "fechaInicio debe ser anterior a fechaDeadline.",
          detalles: { campo: "fechaInicio" },
        },
      ],
    })

    expect(extraerPrecondicionesFallidas(err)[0]?.detalle).toBeUndefined()
  })

  it("filtra las skills sin etiquetaVisible y omite el detalle si no queda ninguna", () => {
    const err = new ApiError(422, "conflict_curso_no_publicable", "no publicable", {
      validacionesFallidas: [
        {
          codigo: "validacion_skill_sin_cobertura",
          mensaje: "Cada skill exigida debe estar cubierta.",
          detalles: { skills: [{ skillId: "1" }, "texto suelto"] },
        },
      ],
    })

    expect(extraerPrecondicionesFallidas(err)[0]?.detalle).toBeUndefined()
  })

  it("devuelve [] cuando el error no es un ApiError", () => {
    expect(extraerPrecondicionesFallidas(new Error("boom"))).toEqual([])
    expect(extraerPrecondicionesFallidas(null)).toEqual([])
    expect(extraerPrecondicionesFallidas(undefined)).toEqual([])
  })

  it("devuelve [] cuando el ApiError no trae validacionesFallidas (ej. 409 de estado)", () => {
    const err = new ApiError(409, "conflict_curso_estado", "Estado invalido", {
      estadoActual: "ACTIVO",
    })
    expect(extraerPrecondicionesFallidas(err)).toEqual([])
  })
})
