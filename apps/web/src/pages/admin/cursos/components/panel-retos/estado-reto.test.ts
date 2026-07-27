import type { ResumenValidacion } from "@/features/codigo-ejecucion"
import { describe, expect, it } from "vitest"
import {
  detalleDeEstado,
  estadoDesdeResumen,
  etiquetaDeEstado,
  requiereAccion,
} from "./estado-reto"

function resumen(overrides: Partial<ResumenValidacion> = {}): ResumenValidacion {
  return { ok: false, totales: 3, pasados: 1, fallidos: [], noEjecuta: false, ...overrides }
}

describe("estadoDesdeResumen", () => {
  it("marca ok cuando la solucion pasa todas las pruebas", () => {
    expect(estadoDesdeResumen(resumen({ ok: true, pasados: 3 }))).toEqual({
      tipo: "ok",
      totales: 3,
    })
  })

  it("distingue 'no ejecuta' de 'falla pruebas'", () => {
    const estado = estadoDesdeResumen(
      resumen({
        noEjecuta: true,
        fallidos: [{ numero: 1, estado: "fallo", stderr: "  SyntaxError  " }],
      }),
    )

    expect(estado).toEqual({ tipo: "no-ejecuta", detalle: "SyntaxError" })
  })

  it("reporta falla con el resumen completo cuando si ejecuto", () => {
    const r = resumen({ fallidos: [{ numero: 2, estado: "fallo", stderr: "" }] })
    expect(estadoDesdeResumen(r)).toEqual({ tipo: "falla", resumen: r })
  })
})

describe("etiquetaDeEstado", () => {
  it("el texto describe el estado sin depender del color ni usar jerga", () => {
    expect(etiquetaDeEstado({ tipo: "pendiente" }).texto).toBe("Sin validar")
    expect(etiquetaDeEstado({ tipo: "ok", totales: 2 }).texto).toBe("Sin problemas")
    expect(etiquetaDeEstado({ tipo: "no-ejecuta", detalle: "" }).texto).toBe("No arranca")
  })

  it("cuenta cuantas pruebas fallan", () => {
    const estado = estadoDesdeResumen(
      resumen({ fallidos: [{ numero: 1, estado: "fallo", stderr: "" }] }),
    )
    expect(etiquetaDeEstado(estado).texto).toBe("Falla 1 de 3")
  })

  it("separa 'no se puede validar' (lenguaje) de 'falta configuracion' (contenido)", () => {
    const porLenguaje = etiquetaDeEstado({ tipo: "no-validable", codigo: "lenguaje", motivo: "x" })
    const porFalta = etiquetaDeEstado({ tipo: "no-validable", codigo: "sin-tests", motivo: "x" })

    expect(porLenguaje).toEqual({ texto: "No se puede validar", tono: "neutro" })
    expect(porFalta).toEqual({ texto: "Falta configuración", tono: "warning" })
  })
})

describe("detalleDeEstado", () => {
  it("explica en tres capas: que paso, que significa y que hacer", () => {
    const detalle = detalleDeEstado(
      estadoDesdeResumen(resumen({ fallidos: [{ numero: 1, estado: "fallo", stderr: "" }] })),
    )

    expect(detalle?.quePaso).toContain("no pasa 1 de 3")
    expect(detalle?.queSignifica).toContain("alumno")
    expect(detalle?.queHacer).toContain("editor del módulo")
  })

  it("describe el timeout en palabras, no como jerga", () => {
    const detalle = detalleDeEstado(
      estadoDesdeResumen(
        resumen({
          fallidos: [
            { numero: 1, estado: "fallo", stderr: "" },
            { numero: 3, estado: "timeout", stderr: "" },
          ],
        }),
      ),
    )

    expect(detalle?.quePaso).toContain("#3, que se quedó colgada")
  })

  it("no inventa detalle para los estados sanos", () => {
    expect(detalleDeEstado({ tipo: "ok", totales: 1 })).toBeNull()
    expect(detalleDeEstado({ tipo: "validando" })).toBeNull()
    expect(detalleDeEstado({ tipo: "pendiente" })).toBeNull()
  })

  it("un lenguaje no soportado NO es culpa del reto", () => {
    const detalle = detalleDeEstado({
      tipo: "no-validable",
      codigo: "lenguaje",
      motivo: 'El reto está en "java".',
    })

    expect(detalle?.requiereAccion).toBe(false)
    expect(detalle?.queSignifica).toContain("No es un problema del reto")
  })

  it("un reto sin pruebas SI es un problema que bloquea al alumno", () => {
    const detalle = detalleDeEstado({
      tipo: "no-validable",
      codigo: "sin-tests",
      motivo: "El reto no tiene un bloque de pruebas enlazado.",
    })

    expect(detalle?.requiereAccion).toBe(true)
    expect(detalle?.queSignifica).toContain("no se le puede aprobar nunca")
  })
})

describe("requiereAccion", () => {
  it("es el criterio unico de 'a revisar'", () => {
    expect(requiereAccion({ tipo: "ok", totales: 1 })).toBe(false)
    expect(requiereAccion({ tipo: "pendiente" })).toBe(false)
    expect(requiereAccion({ tipo: "no-validable", codigo: "lenguaje", motivo: "x" })).toBe(false)
    expect(requiereAccion({ tipo: "no-ejecuta", detalle: "" })).toBe(true)
    expect(requiereAccion({ tipo: "error", mensaje: "x" })).toBe(true)
    expect(requiereAccion({ tipo: "no-validable", codigo: "sin-solucion", motivo: "x" })).toBe(true)
  })
})
