import { describe, expect, it } from "vitest"
import { construirAvisoReto, construirInformeCurso, resumirCorrida } from "./reporte-reto"
import type { EstadoReto, GrupoModulo } from "./retos.types"

const CONTEXTO = {
  cursoTitulo: "Frontend desde Cero",
  moduloTitulo: "Módulo 03 — JavaScript moderno aplicado",
  seccionTitulo: "Async/await sin morir en el intento",
  bloqueOrden: 2,
}

const NO_ARRANCA: EstadoReto = { tipo: "no-ejecuta", detalle: "SyntaxError" }

function grupos(): readonly GrupoModulo[] {
  return [
    {
      moduloId: "m1",
      titulo: "Módulo 01 — Git sin pánico",
      retos: [
        { bloqueId: "a", orden: 1, seccionId: "s1", seccionTitulo: "Ramas", seccionOrden: 1 },
      ],
    },
    {
      moduloId: "m3",
      titulo: CONTEXTO.moduloTitulo,
      retos: [
        { bloqueId: "b", orden: 1, seccionId: "s2", seccionTitulo: "Arrays", seccionOrden: 1 },
        {
          bloqueId: "c",
          orden: 2,
          seccionId: "s3",
          seccionTitulo: CONTEXTO.seccionTitulo,
          seccionOrden: 2,
        },
      ],
    },
  ]
}

describe("construirAvisoReto", () => {
  it("lleva curso, modulo y seccion para que el mensaje se explique solo", () => {
    const aviso = construirAvisoReto(CONTEXTO, NO_ARRANCA)

    expect(aviso).toContain("Frontend desde Cero")
    expect(aviso).toContain("Módulo 03 — JavaScript moderno aplicado")
    expect(aviso).toContain("Async/await sin morir en el intento")
  })

  it("incluye que paso, que significa y que hacer", () => {
    const aviso = construirAvisoReto(CONTEXTO, NO_ARRANCA)

    expect(aviso).toContain("Qué pasó:")
    expect(aviso).toContain("Qué significa:")
    expect(aviso).toContain("Qué hacer:")
  })

  it("funciona con un estado sin detalle sin dejar secciones vacias", () => {
    const aviso = construirAvisoReto(CONTEXTO, { tipo: "ok", totales: 3 })

    expect(aviso).toContain("Sin problemas")
    expect(aviso).not.toContain("Qué pasó:")
  })
})

describe("resumirCorrida", () => {
  it("cuenta ok, a revisar y sin validar sobre todos los modulos", () => {
    const estados = new Map<string, EstadoReto>([
      ["a", { tipo: "ok", totales: 2 }],
      ["b", NO_ARRANCA],
    ])

    expect(resumirCorrida(grupos(), estados)).toEqual({
      total: 3,
      ok: 1,
      aRevisar: 1,
      sinValidar: 1,
      noAplica: 0,
    })
  })

  it("no cuenta como 'a revisar' lo que solo es de un lenguaje no soportado", () => {
    const estados = new Map<string, EstadoReto>([
      ["a", { tipo: "no-validable", codigo: "lenguaje", motivo: "java" }],
    ])

    const resumen = resumirCorrida(grupos(), estados)
    expect(resumen.aRevisar).toBe(0)
    expect(resumen.ok).toBe(0)
    expect(resumen.noAplica).toBe(1)
  })
})

describe("construirInformeCurso", () => {
  it("lista solo los retos que piden accion, agrupados por modulo", () => {
    const estados = new Map<string, EstadoReto>([
      ["a", { tipo: "ok", totales: 2 }],
      ["b", { tipo: "ok", totales: 2 }],
      ["c", NO_ARRANCA],
    ])

    const informe = construirInformeCurso("Frontend desde Cero", grupos(), estados)

    expect(informe).toContain("3 retos revisados: 2 sin problemas, 1 a revisar.")
    // El modulo sano no aparece: un informe de 92 lineas donde 90 dicen "ok" no lo lee nadie.
    expect(informe).not.toContain("Módulo 01 — Git sin pánico")
    expect(informe).toContain(CONTEXTO.moduloTitulo)
    expect(informe).toContain(CONTEXTO.seccionTitulo)
  })

  it("lo dice explicito cuando no hay nada que arreglar", () => {
    const estados = new Map<string, EstadoReto>([
      ["a", { tipo: "ok", totales: 1 }],
      ["b", { tipo: "ok", totales: 1 }],
      ["c", { tipo: "ok", totales: 1 }],
    ])

    expect(construirInformeCurso("Frontend desde Cero", grupos(), estados)).toContain(
      "No hay retos que necesiten arreglo.",
    )
  })
})
