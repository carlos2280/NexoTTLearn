import { ApiError } from "@/shared/api/api-error"
import { describe, expect, it } from "vitest"
import { resolverMensajeErrorCierre } from "./resolver-mensaje-error-cierre"

describe("resolverMensajeErrorCierre", () => {
  it("sin error devuelve null (la pagina no pinta el banner)", () => {
    expect(resolverMensajeErrorCierre(null)).toBeNull()
  })

  it("ApiError 409 SNAPSHOT_CIERRE_NO_DISPONIBLE -> warning con copy especifico", () => {
    const err = new ApiError(409, "SNAPSHOT_CIERRE_NO_DISPONIBLE", "x")
    const mensaje = resolverMensajeErrorCierre(err)
    expect(mensaje?.tone).toBe("warning")
    expect(mensaje?.texto).toContain("aún no ha generado la fotografía")
  })

  it("ApiError 409 SNAPSHOT_CIERRE_FORMATO_NO_SOPORTADO -> warning con copy especifico", () => {
    const err = new ApiError(409, "SNAPSHOT_CIERRE_FORMATO_NO_SOPORTADO", "x")
    const mensaje = resolverMensajeErrorCierre(err)
    expect(mensaje?.tone).toBe("warning")
    expect(mensaje?.texto).toContain("formato antiguo")
  })

  it("ApiError 409 VEREDICTO_CIERRE_NO_DISPONIBLE -> warning con copy especifico (IMP-1)", () => {
    const err = new ApiError(409, "VEREDICTO_CIERRE_NO_DISPONIBLE", "x")
    const mensaje = resolverMensajeErrorCierre(err)
    expect(mensaje?.tone).toBe("warning")
    expect(mensaje?.texto).toContain("veredicto final disponible")
  })

  it("ApiError 409 con code desconocido -> danger generico (fallback)", () => {
    const err = new ApiError(409, "ALGO_QUE_NUNCA_VIMOS", "x")
    const mensaje = resolverMensajeErrorCierre(err)
    expect(mensaje?.tone).toBe("danger")
    expect(mensaje?.texto).toContain("No pudimos cargar")
  })

  it("ApiError 500 -> danger generico (sin importar el code)", () => {
    const err = new ApiError(500, "ERROR_INTERNO", "x")
    const mensaje = resolverMensajeErrorCierre(err)
    expect(mensaje?.tone).toBe("danger")
  })

  it("Error generico (no ApiError) -> danger generico", () => {
    expect(resolverMensajeErrorCierre(new Error("network"))?.tone).toBe("danger")
  })
})
