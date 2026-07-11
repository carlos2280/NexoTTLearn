import { contenidoGitEjercicioSchema } from "@nexott-learn/shared-types"
import { describe, expect, it } from "vitest"
import {
  type BorradorGit,
  type BorradorObjetivo,
  construirContenidoGit,
  leerInicialGit,
} from "./borrador-git"

const OBJETIVO_VACIO: BorradorObjetivo = {
  ramaActiva: "",
  ramasExisten: [],
  hayMergeEnMain: false,
  commitsMinimos: "",
}

function borrador(objetivo: Partial<BorradorObjetivo>): BorradorGit {
  return {
    enunciado: "Crea una rama y mézclala.",
    pista: "",
    objetivo: { ...OBJETIVO_VACIO, ...objetivo },
  }
}

describe("construirContenidoGit", () => {
  it("omite del objetivo los campos vacíos (rama, ramas, merge off, commits 0/vacío)", () => {
    const contenido = construirContenidoGit(borrador({}))
    expect(contenido.objetivo).toEqual({})
  })

  it("incluye solo los criterios definidos y descarta commits 0", () => {
    const contenido = construirContenidoGit(
      borrador({
        ramaActiva: "  feature/login  ",
        ramasExisten: ["main", "  ", "develop"],
        hayMergeEnMain: true,
        commitsMinimos: "0",
      }),
    )
    expect(contenido.objetivo).toEqual({
      ramaActiva: "feature/login",
      ramasExisten: ["main", "develop"],
      hayMergeEnMain: true,
    })
  })

  it("incluye commitsMinimos cuando es mayor que 0", () => {
    const contenido = construirContenidoGit(borrador({ commitsMinimos: "3" }))
    expect(contenido.objetivo).toEqual({ commitsMinimos: 3 })
  })

  it("acota commitsMinimos al máximo del contrato (100) y valida", () => {
    const contenido = construirContenidoGit(borrador({ commitsMinimos: "150" }))
    expect(contenido.objetivo).toEqual({ commitsMinimos: 100 })
    expect(contenidoGitEjercicioSchema.safeParse(contenido).success).toBe(true)
  })

  it("produce contenido válido contra el contrato del backend", () => {
    const contenido = construirContenidoGit(
      borrador({ ramaActiva: "main", hayMergeEnMain: true, commitsMinimos: "2" }),
    )
    expect(contenidoGitEjercicioSchema.safeParse(contenido).success).toBe(true)
  })
})

describe("leerInicialGit", () => {
  it("cae a valores vacíos cuando el contenido es null", () => {
    expect(leerInicialGit(null)).toEqual({
      enunciado: "",
      pista: "",
      objetivo: OBJETIVO_VACIO,
    })
  })

  it("hace round-trip de un objetivo completo (número → string editable)", () => {
    const contenido = {
      enunciado: "<p>Reto</p>",
      pista: "usa checkout -b",
      objetivo: {
        ramaActiva: "feature/x",
        ramasExisten: ["main", "feature/x"],
        hayMergeEnMain: true,
        commitsMinimos: 2,
      },
    }
    expect(leerInicialGit(contenido)).toEqual({
      enunciado: "<p>Reto</p>",
      pista: "usa checkout -b",
      objetivo: {
        ramaActiva: "feature/x",
        ramasExisten: ["main", "feature/x"],
        hayMergeEnMain: true,
        commitsMinimos: "2",
      },
    })
  })
})
