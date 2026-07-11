import type { ObjetivoGit } from "@nexott-learn/shared-types"
import { describe, expect, it } from "vitest"
import { ejecutarComando } from "./ejecutar-comando"
import { type EstadoGit, estadoInicial } from "./motor-git"
import { objetivoCumplido } from "./objetivo-git"

/** Aplica en cadena varias líneas de terminal sobre el estado inicial. */
function correr(...lineas: readonly string[]): EstadoGit {
  return lineas.reduce((estado, linea) => ejecutarComando(estado, linea).estado, estadoInicial())
}

describe("objetivoCumplido", () => {
  it("cumple ramaActiva cuando HEAD coincide", () => {
    const objetivo: ObjetivoGit = { ramaActiva: "main" }
    expect(objetivoCumplido(estadoInicial(), objetivo)).toBe(true)
    const enRama = correr("git checkout -b fix/x")
    expect(objetivoCumplido(enRama, objetivo)).toBe(false)
  })

  it("cumple ramasExisten cuando todas existen", () => {
    const estado = correr("git branch fix/a", "git branch fix/b")
    expect(objetivoCumplido(estado, { ramasExisten: ["fix/a", "fix/b"] })).toBe(true)
    expect(objetivoCumplido(estado, { ramasExisten: ["fix/a", "no-existe"] })).toBe(false)
  })

  it("cumple commitsMinimos contando los commits del alumno (sin la raíz)", () => {
    const estado = correr('git commit -m "uno"', 'git commit -m "dos"')
    expect(objetivoCumplido(estado, { commitsMinimos: 2 })).toBe(true)
    expect(objetivoCumplido(estado, { commitsMinimos: 3 })).toBe(false)
  })

  it("cumple hayMergeEnMain tras branch → commit → merge a main", () => {
    const objetivo: ObjetivoGit = { ramaActiva: "main", hayMergeEnMain: true }
    const parcial = correr("git checkout -b fix/correa", 'git commit -m "arregla"')
    expect(objetivoCumplido(parcial, objetivo)).toBe(false)
    const completo = correr(
      "git checkout -b fix/correa",
      'git commit -m "arregla"',
      "git checkout main",
      "git merge fix/correa",
    )
    expect(objetivoCumplido(completo, objetivo)).toBe(true)
  })

  it("combina varios criterios con AND", () => {
    const objetivo: ObjetivoGit = {
      ramaActiva: "main",
      ramasExisten: ["fix/correa"],
      hayMergeEnMain: true,
      commitsMinimos: 1,
    }
    const completo = correr(
      "git checkout -b fix/correa",
      'git commit -m "arregla"',
      "git checkout main",
      "git merge fix/correa",
    )
    expect(objetivoCumplido(completo, objetivo)).toBe(true)
  })
})

describe("ejecutarComando", () => {
  it("marca reconocido=false ante una línea que no es git", () => {
    const r = ejecutarComando(estadoInicial(), "ls -la")
    expect(r.reconocido).toBe(false)
    expect(r.error).toBe(true)
  })

  it("aplica un commit y avanza el estado", () => {
    const r = ejecutarComando(estadoInicial(), 'git commit -m "hola"')
    expect(r.reconocido).toBe(true)
    expect(r.error).toBe(false)
    expect(r.estado.commits).toHaveLength(2)
  })
})
