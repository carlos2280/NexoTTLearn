import type { AuditoriaResumen } from "@nexott-learn/shared-types"
import { describe, expect, it } from "vitest"
import { LIMITE_FILAS_EXPORTACION, exportarAuditoriaACsv } from "./auditoria-export.helpers"

function buildFila(overrides: Partial<AuditoriaResumen> = {}): AuditoriaResumen {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    actorUsuarioId: "22222222-2222-2222-2222-222222222222",
    actorEmail: "admin@nttdata.test",
    actorNombre: "Admin Prueba",
    accion: "LOGIN_OK",
    recursoTipo: null,
    recursoId: null,
    exito: true,
    metadata: { contexto: "test" },
    ip: "127.0.0.1",
    userAgent: "Mozilla/5.0",
    createdAt: "2026-05-13T12:00:00.000Z",
    ...overrides,
  }
}

describe("exportarAuditoriaACsv", () => {
  it("primera fila es el header con las 9 columnas en orden fijo", () => {
    const csv = exportarAuditoriaACsv([])
    const headerLine = csv.split("\n")[0]
    expect(headerLine).toBe(
      "id,actorEmail,actorNombre,accion,recursoTipo,recursoId,exito,ip,createdAt",
    )
  })

  it("no incluye metadata ni userAgent en columnas (R-S12-5)", () => {
    const csv = exportarAuditoriaACsv([
      buildFila({ metadata: { dato: "sensible" }, userAgent: "ua-no-exportable" }),
    ])
    expect(csv).not.toContain("metadata")
    expect(csv).not.toContain("userAgent")
    expect(csv).not.toContain("dato")
    expect(csv).not.toContain("sensible")
    expect(csv).not.toContain("ua-no-exportable")
  })

  it("renderiza una fila con valores planos sin escape", () => {
    const csv = exportarAuditoriaACsv([buildFila()])
    const linea = csv.split("\n")[1]
    expect(linea).toBe(
      [
        "11111111-1111-1111-1111-111111111111",
        "admin@nttdata.test",
        "Admin Prueba",
        "LOGIN_OK",
        "",
        "",
        "true",
        "127.0.0.1",
        "2026-05-13T12:00:00.000Z",
      ].join(","),
    )
  })

  it("escapa comillas dobles duplicando el caracter (RFC4180)", () => {
    const csv = exportarAuditoriaACsv([buildFila({ actorNombre: 'Nombre "con" comillas' })])
    expect(csv).toContain('"Nombre ""con"" comillas"')
  })

  it("rodea con comillas valores con comas", () => {
    const csv = exportarAuditoriaACsv([buildFila({ actorNombre: "Apellido, Nombre" })])
    expect(csv).toContain('"Apellido, Nombre"')
  })

  it("rodea con comillas valores con saltos de linea", () => {
    const csv = exportarAuditoriaACsv([buildFila({ actorNombre: "linea1\nlinea2" })])
    expect(csv).toContain('"linea1\nlinea2"')
  })

  it("renderiza null como cadena vacia para campos opcionales", () => {
    const csv = exportarAuditoriaACsv([
      buildFila({
        actorUsuarioId: null,
        actorEmail: null,
        actorNombre: null,
        recursoTipo: null,
        recursoId: null,
        ip: null,
      }),
    ])
    const linea = csv.split("\n")[1]
    expect(linea).toBe(
      [
        "11111111-1111-1111-1111-111111111111",
        "",
        "",
        "LOGIN_OK",
        "",
        "",
        "true",
        "",
        "2026-05-13T12:00:00.000Z",
      ].join(","),
    )
  })

  it("rinde exito=false como literal `false`", () => {
    const csv = exportarAuditoriaACsv([buildFila({ exito: false })])
    expect(csv).toContain(",false,")
  })

  it("expone el limite defensivo de 50000 filas para el controller (D-S12-A5)", () => {
    expect(LIMITE_FILAS_EXPORTACION).toBe(50_000)
  })
})
