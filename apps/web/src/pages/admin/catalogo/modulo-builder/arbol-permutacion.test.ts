import type { BloqueResponse, SeccionResponse, TipoBloque } from "@nexott-learn/shared-types"
import { describe, expect, it } from "vitest"
import { PREFIX_BLQ, PREFIX_SEC, permutarBloques, permutarSecciones } from "./arbol-permutacion"
import type { SeccionConBloques } from "./types"

function seccion(id: string, orden: number): SeccionResponse {
  return {
    id,
    moduloId: "mod-1",
    titulo: `Seccion ${id}`,
    orden,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  }
}

function bloque(id: string, tipo: TipoBloque, orden: number, seccionId: string): BloqueResponse {
  return {
    id,
    seccionId,
    orden,
    tipo,
    esEvaluable: false,
    skillQueMideId: null,
    estado: "ACTIVO",
    version: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  }
}

function nodo(
  idSeccion: string,
  orden: number,
  bloques: readonly BloqueResponse[],
): SeccionConBloques {
  return { seccion: seccion(idSeccion, orden), bloques }
}

const sec = (id: string) => `${PREFIX_SEC}${id}`
const blq = (id: string) => `${PREFIX_BLQ}${id}`

describe("permutarSecciones", () => {
  const arbol: readonly SeccionConBloques[] = [nodo("a", 1, []), nodo("b", 2, []), nodo("c", 3, [])]

  it("mueve una seccion a otra posicion y renumera 1..N", () => {
    // Mover "c" sobre "a" -> [c, a, b]
    expect(permutarSecciones(arbol, sec("c"), sec("a"))).toEqual([
      { seccionId: "c", orden: 1 },
      { seccionId: "a", orden: 2 },
      { seccionId: "b", orden: 3 },
    ])
  })

  it("devuelve null si el drag no es entre dos secciones", () => {
    expect(permutarSecciones(arbol, blq("x"), sec("a"))).toBeNull()
    expect(permutarSecciones(arbol, sec("a"), blq("x"))).toBeNull()
  })

  it("devuelve null si el origen y el destino son la misma seccion", () => {
    expect(permutarSecciones(arbol, sec("a"), sec("a"))).toBeNull()
  })

  it("devuelve null si alguna seccion no existe en el arbol", () => {
    expect(permutarSecciones(arbol, sec("a"), sec("zzz"))).toBeNull()
  })
})

describe("permutarBloques", () => {
  const arbol: readonly SeccionConBloques[] = [
    nodo("s1", 1, [
      bloque("p", "PARRAFO", 1, "s1"),
      bloque("rA", "CODIGO_PREGUNTAS", 2, "s1"),
      bloque("tA", "CODIGO_TESTS", 3, "s1"),
      bloque("rB", "CODIGO_PREGUNTAS", 4, "s1"),
      bloque("tB", "CODIGO_TESTS", 5, "s1"),
    ]),
    nodo("s2", 2, [bloque("q", "PARRAFO", 1, "s2")]),
  ]

  it("reordena visibles y mantiene cada test pegado a su reto", () => {
    // Mover Reto B (rB) sobre Reto A (rA): visibles -> [p, rB, rA]
    expect(permutarBloques(arbol, blq("rB"), blq("rA"))).toEqual({
      seccionId: "s1",
      permutacion: [
        { bloqueId: "p", orden: 1 },
        { bloqueId: "rB", orden: 2 },
        { bloqueId: "tB", orden: 3 },
        { bloqueId: "rA", orden: 4 },
        { bloqueId: "tA", orden: 5 },
      ],
    })
  })

  it("devuelve null si el drag no es entre dos bloques", () => {
    expect(permutarBloques(arbol, sec("s1"), blq("p"))).toBeNull()
    expect(permutarBloques(arbol, blq("p"), sec("s1"))).toBeNull()
  })

  it("devuelve null al cruzar de seccion (no se permite cross-section)", () => {
    expect(permutarBloques(arbol, blq("p"), blq("q"))).toBeNull()
  })

  it("devuelve null si origen y destino son el mismo bloque", () => {
    expect(permutarBloques(arbol, blq("rA"), blq("rA"))).toBeNull()
  })

  it("devuelve null si un bloque no existe", () => {
    expect(permutarBloques(arbol, blq("p"), blq("no-existe"))).toBeNull()
  })
})
