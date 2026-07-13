import { describe, expect, it } from "vitest"
import { parsearComando } from "./parsear-comando"

describe("parsearComando", () => {
  it("parsea commit con mensaje entre comillas dobles", () => {
    expect(parsearComando('git commit -m "Repara el sensor"')).toEqual({
      tipo: "commit",
      mensaje: "Repara el sensor",
    })
  })

  it("parsea commit con comillas simples y espacios", () => {
    expect(parsearComando("git commit -m 'arreglo la correa 3'")).toEqual({
      tipo: "commit",
      mensaje: "arreglo la correa 3",
    })
  })

  it("commit sin -m es error", () => {
    const r = parsearComando("git commit")
    expect(r.tipo).toBe("error")
  })

  it("checkout -b marca crear=true", () => {
    expect(parsearComando("git checkout -b fix/sensor")).toEqual({
      tipo: "checkout",
      nombre: "fix/sensor",
      crear: true,
    })
  })

  it("switch -c equivale a checkout -b", () => {
    expect(parsearComando("git switch -c fix/sensor")).toEqual({
      tipo: "checkout",
      nombre: "fix/sensor",
      crear: true,
    })
  })

  it("merge exige nombre de rama", () => {
    expect(parsearComando("git merge").tipo).toBe("error")
    expect(parsearComando("git merge fix/sensor")).toEqual({ tipo: "merge", nombre: "fix/sensor" })
  })

  it("log y status no llevan argumentos", () => {
    expect(parsearComando("git log")).toEqual({ tipo: "log" })
    expect(parsearComando("git status")).toEqual({ tipo: "status" })
  })

  it("comando que no empieza con git es error", () => {
    expect(parsearComando("ls -la").tipo).toBe("error")
  })

  it("subcomando desconocido es error legible", () => {
    const r = parsearComando("git rebase")
    expect(r.tipo).toBe("error")
    expect(r.tipo === "error" && r.mensaje).toContain("rebase")
  })

  it("línea vacía es error sin mensaje (no ensucia el terminal)", () => {
    expect(parsearComando("   ")).toEqual({ tipo: "error", mensaje: "" })
  })
})
