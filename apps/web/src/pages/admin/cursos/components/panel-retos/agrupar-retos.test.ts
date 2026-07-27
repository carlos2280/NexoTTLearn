import type { BloqueEvaluableAdminItem, TipoBloque } from "@nexott-learn/shared-types"
import { describe, expect, it } from "vitest"
import { agruparRetosPorModulo, aplanarRetos, resumirGrupo } from "./agrupar-retos"
import type { EstadoReto } from "./retos.types"

function bloque(overrides: {
  readonly bloqueId: string
  readonly tipo?: TipoBloque
  readonly moduloId?: string
  readonly moduloTitulo?: string
  readonly seccionTitulo?: string
  readonly seccionOrden?: number
  readonly orden?: number
}): BloqueEvaluableAdminItem {
  return {
    bloqueId: overrides.bloqueId,
    orden: overrides.orden ?? 1,
    tipo: overrides.tipo ?? "CODIGO_PREGUNTAS",
    version: 1,
    umbralAprobacion: 60,
    modulo: { id: overrides.moduloId ?? "m1", titulo: overrides.moduloTitulo ?? "Modulo 1" },
    seccion: {
      id: `s-${overrides.bloqueId}`,
      titulo: overrides.seccionTitulo ?? "Seccion",
      orden: overrides.seccionOrden ?? 1,
    },
    skill: null,
    stats: { colaboradoresConIntento: 0, totalIntentos: 0, aprobados: 0, notaMedia: null },
  }
}

describe("agruparRetosPorModulo", () => {
  it("se queda solo con los retos de codigo", () => {
    const grupos = agruparRetosPorModulo([
      bloque({ bloqueId: "reto" }),
      bloque({ bloqueId: "quiz", tipo: "QUIZ" }),
      bloque({ bloqueId: "sql", tipo: "SQL_EJERCICIO" }),
      bloque({ bloqueId: "tests", tipo: "CODIGO_TESTS" }),
    ])

    expect(grupos).toHaveLength(1)
    expect(grupos[0]?.retos.map((r) => r.bloqueId)).toEqual(["reto"])
  })

  it("agrupa por modulo respetando el orden de primera aparicion", () => {
    const grupos = agruparRetosPorModulo([
      bloque({ bloqueId: "b1", moduloId: "z", moduloTitulo: "Zeta" }),
      bloque({ bloqueId: "b2", moduloId: "a", moduloTitulo: "Alfa" }),
      bloque({ bloqueId: "b3", moduloId: "z", moduloTitulo: "Zeta" }),
    ])

    // Zeta va primero porque aparecio primero, no por orden alfabetico.
    expect(grupos.map((g) => g.moduloId)).toEqual(["z", "a"])
    expect(grupos[0]?.retos).toHaveLength(2)
  })

  it("ordena por el orden REAL de la seccion y luego por el del bloque", () => {
    const grupos = agruparRetosPorModulo([
      bloque({ bloqueId: "s2-b1", seccionOrden: 2, orden: 1 }),
      bloque({ bloqueId: "s1-b2", seccionOrden: 1, orden: 2 }),
      bloque({ bloqueId: "s1-b1", seccionOrden: 1, orden: 1 }),
    ])

    expect(grupos[0]?.retos.map((r) => r.bloqueId)).toEqual(["s1-b1", "s1-b2", "s2-b1"])
  })

  it("usa el orden numerico, no el titulo: la seccion 10 va despues de la 2", () => {
    const grupos = agruparRetosPorModulo([
      bloque({ bloqueId: "diez", seccionTitulo: "10. Cierre", seccionOrden: 10 }),
      bloque({ bloqueId: "dos", seccionTitulo: "2. Arranque", seccionOrden: 2 }),
    ])

    expect(grupos[0]?.retos.map((r) => r.bloqueId)).toEqual(["dos", "diez"])
  })

  it("devuelve vacio cuando el curso no tiene retos de codigo", () => {
    expect(agruparRetosPorModulo([bloque({ bloqueId: "q", tipo: "QUIZ" })])).toEqual([])
  })
})

describe("aplanarRetos", () => {
  it("aplana en el mismo orden en que se muestran los grupos", () => {
    const grupos = agruparRetosPorModulo([
      bloque({ bloqueId: "b1", moduloId: "m1" }),
      bloque({ bloqueId: "b2", moduloId: "m2" }),
    ])

    expect(aplanarRetos(grupos).map((r) => r.bloqueId)).toEqual(["b1", "b2"])
  })
})

describe("resumirGrupo", () => {
  const retos = agruparRetosPorModulo([
    bloque({ bloqueId: "a" }),
    bloque({ bloqueId: "b" }),
    bloque({ bloqueId: "c" }),
    bloque({ bloqueId: "d" }),
  ])[0]?.retos

  it("cuenta ok, rotos y sin validar", () => {
    const estados = new Map<string, EstadoReto>([
      ["a", { tipo: "ok", totales: 3 }],
      ["b", { tipo: "no-ejecuta", detalle: "boom" }],
      ["c", { tipo: "error", mensaje: "worker" }],
    ])

    expect(resumirGrupo(retos ?? [], estados)).toEqual({
      total: 4,
      ok: 1,
      rotos: 2,
      sinValidar: 1,
      noAplica: 0,
    })
  })

  it("un reto no autocorregible por su lenguaje va a noAplica, no a rotos ni a ok", () => {
    const estados = new Map<string, EstadoReto>([
      ["a", { tipo: "no-validable", codigo: "lenguaje", motivo: "java" }],
    ])

    const resumen = resumirGrupo(retos ?? [], estados)
    expect(resumen.rotos).toBe(0)
    expect(resumen.ok).toBe(0)
    expect(resumen.noAplica).toBe(1)
    expect(resumen.sinValidar).toBe(3)
  })

  it("un reto sin pruebas SI cuenta como roto", () => {
    const estados = new Map<string, EstadoReto>([
      ["a", { tipo: "no-validable", codigo: "sin-tests", motivo: "x" }],
    ])

    expect(resumirGrupo(retos ?? [], estados).rotos).toBe(1)
  })

  it("trata como sin validar lo que aun no se toco", () => {
    expect(resumirGrupo(retos ?? [], new Map())).toEqual({
      total: 4,
      ok: 0,
      rotos: 0,
      sinValidar: 4,
      noAplica: 0,
    })
  })

  it("las cuatro categorias siempre suman el total: sin esa invariante el chip miente", () => {
    const estados = new Map<string, EstadoReto>([
      ["a", { tipo: "ok", totales: 1 }],
      ["b", { tipo: "no-validable", codigo: "lenguaje", motivo: "java" }],
      [
        "c",
        {
          tipo: "falla",
          resumen: { ok: false, totales: 2, pasados: 1, fallidos: [], noEjecuta: false },
        },
      ],
    ])

    const r = resumirGrupo(retos ?? [], estados)
    expect(r.ok + r.rotos + r.sinValidar + r.noAplica).toBe(r.total)
  })
})
