import { describe, expect, it } from "vitest"
import { construirInputVoluntarios, descripcionVoluntarios } from "./config-voluntarios.helpers"

describe("construirInputVoluntarios", () => {
  it("al habilitar envia solo toggleVoluntarios=true", () => {
    expect(construirInputVoluntarios(true)).toEqual({ toggleVoluntarios: true })
  })

  it("al deshabilitar envia solo toggleVoluntarios=false", () => {
    expect(construirInputVoluntarios(false)).toEqual({ toggleVoluntarios: false })
  })

  it("no arrastra ningun otro campo del curso", () => {
    expect(Object.keys(construirInputVoluntarios(true))).toEqual(["toggleVoluntarios"])
  })
})

describe("descripcionVoluntarios", () => {
  it("habilitado: cualquier colaborador se autoinscribe", () => {
    expect(descripcionVoluntarios(true)).toMatch(/por su cuenta/u)
  })

  it("deshabilitado: solo los asignados", () => {
    expect(descripcionVoluntarios(false)).toMatch(/asignados/u)
  })
})
