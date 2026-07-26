import { describe, expect, it } from "vitest"
import { parsearLoteColaboradores } from "./parsear-lote"

describe("parsearLoteColaboradores", () => {
  it("parsea líneas email, nombre y normaliza el email a minúsculas", () => {
    const { filas, errores } = parsearLoteColaboradores(
      "Ana@Emeal.NTTData.com, Ana Pérez\nbeto@emeal.nttdata.com, Beto Soto",
    )
    expect(errores).toHaveLength(0)
    expect(filas).toEqual([
      { email: "ana@emeal.nttdata.com", nombre: "Ana Pérez" },
      { email: "beto@emeal.nttdata.com", nombre: "Beto Soto" },
    ])
  })

  it("acepta tab y punto y coma como separador (pegar desde Excel)", () => {
    const { filas } = parsearLoteColaboradores("ana@x.com\tAna\nbeto@x.com;Beto")
    expect(filas).toEqual([
      { email: "ana@x.com", nombre: "Ana" },
      { email: "beto@x.com", nombre: "Beto" },
    ])
  })

  it("ignora líneas vacías y una cabecera 'email, nombre'", () => {
    const { filas, errores } = parsearLoteColaboradores("email, nombre\n\nana@x.com, Ana\n\n")
    expect(errores).toHaveLength(0)
    expect(filas).toEqual([{ email: "ana@x.com", nombre: "Ana" }])
  })

  it("conserva comas dentro del nombre (corta solo en el primer separador)", () => {
    const { filas } = parsearLoteColaboradores("ana@x.com, Pérez, Ana")
    expect(filas).toEqual([{ email: "ana@x.com", nombre: "Pérez, Ana" }])
  })

  it("reporta email inválido, nombre faltante y línea sin separador", () => {
    const { filas, errores } = parsearLoteColaboradores("no-es-email, Ana\nbeto@x.com,\nsolotexto")
    expect(filas).toHaveLength(0)
    expect(errores).toHaveLength(3)
    expect(errores[0]).toContain("Línea 1")
    expect(errores[1]).toContain("Línea 2")
    expect(errores[2]).toContain("Línea 3")
  })
})
