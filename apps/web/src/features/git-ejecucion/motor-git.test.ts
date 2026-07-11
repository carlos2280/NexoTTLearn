import { describe, expect, it } from "vitest"
import {
  RAMA_BASE,
  branch,
  checkout,
  commit,
  estadoInicial,
  merge,
  misionCumplida,
  tip,
} from "./motor-git"

describe("motor-git", () => {
  it("arranca con un commit raíz en main", () => {
    const e = estadoInicial()
    expect(e.head).toBe(RAMA_BASE)
    expect(e.commits).toHaveLength(1)
    expect(e.commits[0]?.padres).toHaveLength(0)
  })

  it("commit avanza el tip de la rama activa", () => {
    const e = estadoInicial()
    const r = commit(e, "Arregla el sensor")
    expect(r.error).toBe(false)
    expect(r.estado.commits).toHaveLength(2)
    expect(r.estado.ramas[RAMA_BASE]).toBe(r.estado.commits[1]?.id)
  })

  it("rechaza commit sin mensaje", () => {
    const r = commit(estadoInicial(), "   ")
    expect(r.error).toBe(true)
    expect(r.estado.commits).toHaveLength(1)
  })

  it("checkout -b crea la rama y mueve HEAD", () => {
    const r = checkout(estadoInicial(), "fix/sensor", true)
    expect(r.error).toBe(false)
    expect(r.estado.head).toBe("fix/sensor")
    expect(r.estado.ramas["fix/sensor"]).toBe(tip(estadoInicial()))
  })

  it("checkout a rama inexistente falla", () => {
    const r = checkout(estadoInicial(), "no-existe", false)
    expect(r.error).toBe(true)
  })

  it("branch duplicada falla", () => {
    const conRama = checkout(estadoInicial(), "fix/x", true).estado
    const r = branch(conRama, "fix/x")
    expect(r.error).toBe(true)
  })

  it("merge con divergencia crea un commit de dos padres", () => {
    let e = checkout(estadoInicial(), "fix/sensor", true).estado
    e = commit(e, "Corrige la lectura de la correa 3").estado
    e = checkout(e, RAMA_BASE, false).estado
    const r = merge(e, "fix/sensor")
    expect(r.error).toBe(false)
    const cabeza = r.estado.commits.at(-1)
    expect(cabeza?.padres).toHaveLength(2)
  })

  it("merge sin divergencia no crea commit (ya al día)", () => {
    const e = branch(estadoInicial(), "gemela").estado
    const r = merge(e, "gemela")
    expect(r.estado.commits).toHaveLength(1)
  })

  it("la misión se cumple tras branch → commit → merge a main", () => {
    let e = estadoInicial()
    expect(misionCumplida(e)).toBe(false)
    e = checkout(e, "fix/sensor-correa", true).estado
    e = commit(e, "Repara el sensor de la correa 3").estado
    expect(misionCumplida(e)).toBe(false) // aún en la rama
    e = checkout(e, RAMA_BASE, false).estado
    e = merge(e, "fix/sensor-correa").estado
    expect(misionCumplida(e)).toBe(true)
  })

  it("misión no se cumple si el merge quedó fuera de main", () => {
    let e = checkout(estadoInicial(), "rama-a", true).estado
    e = commit(e, "trabajo en A").estado
    e = checkout(e, RAMA_BASE, false).estado
    e = checkout(e, "rama-b", true).estado
    e = merge(e, "rama-a").estado // merge en rama-b, no en main
    expect(misionCumplida(e)).toBe(false)
  })
})
