import { describe, expect, it } from "vitest"
import { MockAiProvider } from "./mock.provider"

describe("MockAiProvider", () => {
  const provider = new MockAiProvider()

  it("evaluarRepoCualitativo devuelve respuesta determinista con confianza alta", async () => {
    const result = await provider.evaluarRepoCualitativo({
      repoUrl: "https://github.com/foo/bar",
      profundidad: "SEMI_SENIOR",
    })
    expect(result.nota).toBe(80)
    expect(result.comentario).toBe("mock cualitativa")
    expect(result.confianza).toBe("alta")
  })

  it("mantenerTurnoComprension turnos < 3 entrega siguientePregunta sin finalizar", async () => {
    const result = await provider.mantenerTurnoComprension({
      repoUrl: "https://github.com/foo/bar",
      profundidad: "JUNIOR",
      turnoIndex: 1,
      transcripcionPrevia: [],
    })
    expect(result.finalizado).toBe(false)
    expect(result.nota).toBeNull()
    expect(result.siguientePregunta).toContain("mock pregunta")
  })

  it("mantenerTurnoComprension al turno 3 finaliza con nota 72", async () => {
    const result = await provider.mantenerTurnoComprension({
      repoUrl: "https://github.com/foo/bar",
      profundidad: "SENIOR",
      turnoIndex: 3,
      transcripcionPrevia: [],
    })
    expect(result.finalizado).toBe(true)
    expect(result.nota).toBe(72)
    expect(result.siguientePregunta).toBeNull()
  })

  it("mantenerTurnoEntrevista turnos cortos no finalizan", async () => {
    const result = await provider.mantenerTurnoEntrevista({
      profundidad: "JUNIOR",
      turnoIndex: 1,
      mensajeColaborador: "hola",
    })
    expect(result.finalizado).toBe(false)
    expect(result.respuestaIa).toMatch(/mock respuesta/)
  })

  it("mantenerTurnoEntrevista al turno 4 cierra la conversacion", async () => {
    const result = await provider.mantenerTurnoEntrevista({
      profundidad: "SENIOR",
      turnoIndex: 4,
      mensajeColaborador: "ok",
    })
    expect(result.finalizado).toBe(true)
    expect(result.respuestaIa).toMatch(/cierre/)
  })

  it("providerName es la cadena literal 'mock'", () => {
    expect(provider.providerName).toBe("mock")
  })
})
