import { describe, expect, it } from "vitest"
import { MockAiProvider } from "./mock.provider"

describe("MockAiProvider", () => {
  const provider = new MockAiProvider()

  it("evaluarRepoCualitativo devuelve el informe rico con una dimension por eje pedido", async () => {
    const result = await provider.evaluarRepoCualitativo({
      contenidoRepo: "===== a.ts =====\nconst a = 1",
      profundidad: "SEMI_SENIOR",
      dimensiones: ["TypeScript", "Testing"],
    })
    expect(result.nota).toBe(80)
    expect(result.confianza).toBe("alta")
    expect(result.resumen).toMatch(/mock/i)
    expect(result.queNoReviso).toMatch(/no ejecuto el codigo/)
    expect(result.porDimension).toHaveLength(2)
    expect(result.porDimension.map((d) => d.dimension)).toEqual(["TypeScript", "Testing"])
    expect(result.porDimension.every((d) => d.nota === 80)).toBe(true)
  })

  it("evaluarRepoCualitativo sin ejes declarados devuelve porDimension vacio", async () => {
    const result = await provider.evaluarRepoCualitativo({
      contenidoRepo: "const a = 1",
      profundidad: "JUNIOR",
      dimensiones: [],
    })
    expect(result.porDimension).toEqual([])
  })

  it("evaluarRepoCualitativo devuelve un cumplimiento por cada criterio de la lista", async () => {
    const result = await provider.evaluarRepoCualitativo({
      contenidoRepo: "const a = 1",
      profundidad: "SEMI_SENIOR",
      dimensiones: [],
      criterios: ["README claro", "Estructura ordenada"],
    })
    expect(result.cumplimientoCriterios).toHaveLength(2)
    expect(result.cumplimientoCriterios?.map((c) => c.criterio)).toEqual([
      "README claro",
      "Estructura ordenada",
    ])
    expect(result.cumplimientoCriterios?.every((c) => c.cumple === "cumple")).toBe(true)
  })

  it("evaluarRepoCualitativo sin lista a evaluar devuelve cumplimientoCriterios vacio", async () => {
    const result = await provider.evaluarRepoCualitativo({
      contenidoRepo: "const a = 1",
      profundidad: "JUNIOR",
      dimensiones: [],
    })
    expect(result.cumplimientoCriterios).toEqual([])
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
