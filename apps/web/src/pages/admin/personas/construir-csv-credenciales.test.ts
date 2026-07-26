import { describe, expect, it } from "vitest"
import { construirCsvCredenciales } from "./construir-csv-credenciales"

describe("construirCsvCredenciales", () => {
  it("genera CSV con BOM, cabecera nombre,email,password y una fila por creado", () => {
    const csv = construirCsvCredenciales([
      { nombre: "Ana", email: "ana@x.com", passwordTemporal: "Abc12345!xyz" },
    ])
    expect(csv.charCodeAt(0)).toBe(0xfeff)
    const lineas = csv.slice(1).split("\r\n")
    expect(lineas[0]).toBe("nombre,email,password")
    expect(lineas[1]).toBe("Ana,ana@x.com,Abc12345!xyz")
  })

  it("escapa campos con coma o comillas (RFC 4180)", () => {
    const csv = construirCsvCredenciales([
      { nombre: "Pérez, Ana", email: "a@x.com", passwordTemporal: 'p"q' },
    ])
    expect(csv).toContain('"Pérez, Ana",a@x.com,"p""q"')
  })

  it("lista vacía: solo la cabecera", () => {
    const csv = construirCsvCredenciales([])
    expect(csv.slice(1)).toBe("nombre,email,password\r\n")
  })

  it("neutraliza fórmulas CSV (nombre que empieza por =) con comilla simple", () => {
    const csv = construirCsvCredenciales([
      { nombre: "=HYPERLINK(1)", email: "a@x.com", passwordTemporal: "Abc12345!xyz" },
    ])
    // El '=' inicial se prefija con ' → Excel ya no lo interpreta como fórmula.
    expect(csv).toContain("'=HYPERLINK(1),a@x.com,Abc12345!xyz")
  })
})
