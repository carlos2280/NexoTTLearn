import type { BloqueDetalleResponse, TipoBloque } from "@nexott-learn/shared-types"
import { describe, expect, it } from "vitest"
import { emparejarReto } from "./emparejar-reto"

const RETO_ID = "11111111-1111-4111-8111-111111111111"

function bloqueDetalle(
  id: string,
  tipo: TipoBloque,
  contenido: Record<string, unknown> | null,
): BloqueDetalleResponse {
  return {
    id,
    seccionId: "sec",
    tipo,
    orden: 1,
    estado: "ACTIVO",
    esEvaluable: tipo === "CODIGO_PREGUNTAS",
    version: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    contenido,
  } as BloqueDetalleResponse
}

function pregunta(lenguaje = "typescript", tiempoLimiteSeg = 45) {
  return bloqueDetalle(RETO_ID, "CODIGO_PREGUNTAS", {
    lenguaje,
    enunciado: "Suma dos numeros",
    esqueletoInicial: "",
    tiempoLimiteSeg,
  })
}

function tests(solucionReferencia = "console.log(1)", codigoPreguntasId = RETO_ID) {
  return bloqueDetalle("22222222-2222-4222-8222-222222222222", "CODIGO_TESTS", {
    codigoPreguntasId,
    solucionReferencia,
    tests: [{ id: "t1", descripcion: "", entrada: "1 2", salidaEsperada: "3", visible: true }],
  })
}

describe("emparejarReto", () => {
  it("empareja el reto con su bloque de tests hermano", () => {
    const resultado = emparejarReto([pregunta(), tests()], RETO_ID)

    expect(resultado.ok).toBe(true)
    if (resultado.ok) {
      expect(resultado.reto.lenguaje).toBe("typescript")
      expect(resultado.reto.solucionReferencia).toBe("console.log(1)")
      expect(resultado.reto.tests).toHaveLength(1)
      // El tiempo limite es el REAL del reto, no una constante.
      expect(resultado.reto.tiempoLimiteSeg).toBe(45)
    }
  })

  it("ignora un CODIGO_TESTS que apunta a otro reto", () => {
    const deOtro = tests("console.log(9)", "33333333-3333-4333-8333-333333333333")
    const resultado = emparejarReto([pregunta(), deOtro], RETO_ID)

    expect(resultado).toEqual({
      ok: false,
      codigo: "sin-tests",
      motivo: "El reto no tiene un bloque de pruebas enlazado.",
    })
  })

  it("separa el lenguaje no soportado del contenido roto", () => {
    const resultado = emparejarReto([pregunta("java"), tests()], RETO_ID)

    expect(resultado.ok).toBe(false)
    if (!resultado.ok) {
      // El codigo es lo que luego decide si cuenta como "a revisar" o no.
      expect(resultado.codigo).toBe("lenguaje")
      expect(resultado.motivo).toContain("java")
    }
  })

  it("avisa cuando falta la solucion de referencia", () => {
    const resultado = emparejarReto([pregunta(), tests("   ")], RETO_ID)

    expect(resultado).toEqual({
      ok: false,
      codigo: "sin-solucion",
      motivo: "El reto no tiene solución de referencia escrita.",
    })
  })

  it("avisa cuando el reto ya no esta en la seccion", () => {
    const resultado = emparejarReto([tests()], RETO_ID)

    expect(resultado).toEqual({
      ok: false,
      codigo: "ausente",
      motivo: "El reto ya no está activo en su sección.",
    })
  })

  it("avisa cuando el contenido del reto no tiene el formato esperado", () => {
    const roto = bloqueDetalle(RETO_ID, "CODIGO_PREGUNTAS", { lenguaje: "typescript" })
    const resultado = emparejarReto([roto, tests()], RETO_ID)

    expect(resultado).toEqual({
      ok: false,
      codigo: "formato",
      motivo: "El contenido del reto no tiene el formato esperado.",
    })
  })
})
