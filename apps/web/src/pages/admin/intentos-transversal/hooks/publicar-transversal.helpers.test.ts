import { describe, expect, it } from "vitest"
import { derivarPublicacion } from "./publicar-transversal.helpers"

const base = { notaCalculada: 60, umbral: 70 }

describe("derivarPublicacion", () => {
  it("sin cambios: publica la calculada, body vacío, sin ajuste", () => {
    const r = derivarPublicacion({ ...base, notaStr: "60", motivo: "" })
    expect(r.ajustada).toBe(false)
    expect(r.body).toEqual({})
    expect(r.puedePublicar).toBe(true)
    expect(r.errorMotivo).toBeNull()
  })

  it("cambia la nota sin motivo: bloquea, pide motivo y el body queda vacío", () => {
    const r = derivarPublicacion({ ...base, notaStr: "75", motivo: "" })
    expect(r.ajustada).toBe(true)
    expect(r.errorMotivo).not.toBeNull()
    expect(r.puedePublicar).toBe(false)
    // Seguro por construcción: sin motivo válido, el body no lleva el ajuste.
    expect(r.body).toEqual({})
  })

  it("motivo demasiado largo (>500): error de motivo y no publica", () => {
    const r = derivarPublicacion({ ...base, notaStr: "75", motivo: "a".repeat(501) })
    expect(r.errorMotivo).not.toBeNull()
    expect(r.puedePublicar).toBe(false)
    expect(r.body).toEqual({})
  })

  it("cambia la nota con motivo: ajusta y arma el body con ambos", () => {
    const r = derivarPublicacion({ ...base, notaStr: "75", motivo: "  Justificado  " })
    expect(r.ajustada).toBe(true)
    expect(r.puedePublicar).toBe(true)
    expect(r.body).toEqual({ notaAjustada: 75, motivoAjuste: "Justificado" })
  })

  it("la IA no pudo calcular (null): fijar a mano cuenta como ajuste y exige motivo", () => {
    const sinMotivo = derivarPublicacion({
      notaCalculada: null,
      umbral: 70,
      notaStr: "55",
      motivo: "",
    })
    expect(sinMotivo.ajustada).toBe(true)
    expect(sinMotivo.puedePublicar).toBe(false)
    const conMotivo = derivarPublicacion({
      notaCalculada: null,
      umbral: 70,
      notaStr: "55",
      motivo: "Evaluado a mano",
    })
    expect(conMotivo.body).toEqual({ notaAjustada: 55, motivoAjuste: "Evaluado a mano" })
  })

  it("ajuste a 0 con motivo: es ajuste y el body lleva notaAjustada 0", () => {
    const r = derivarPublicacion({ ...base, notaStr: "0", motivo: "Entrega vacía" })
    expect(r.ajustada).toBe(true)
    expect(r.body).toEqual({ notaAjustada: 0, motivoAjuste: "Entrega vacía" })
    expect(r.aprobaria).toBe(false)
  })

  it("nota vacía o fuera de rango: error de nota, no publica", () => {
    expect(derivarPublicacion({ ...base, notaStr: "", motivo: "" }).errorNota).not.toBeNull()
    expect(derivarPublicacion({ ...base, notaStr: "101", motivo: "x" }).errorNota).not.toBeNull()
    expect(derivarPublicacion({ ...base, notaStr: "-1", motivo: "x" }).errorNota).not.toBeNull()
    expect(derivarPublicacion({ ...base, notaStr: "abc", motivo: "x" }).errorNota).not.toBeNull()
  })

  it("aprobaria refleja la nota final vs umbral", () => {
    expect(derivarPublicacion({ ...base, notaStr: "70", motivo: "sube" }).aprobaria).toBe(true)
    expect(derivarPublicacion({ ...base, notaStr: "69", motivo: "baja" }).aprobaria).toBe(false)
  })
})
