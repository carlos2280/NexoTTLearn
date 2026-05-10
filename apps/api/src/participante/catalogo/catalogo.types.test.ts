// Tests de bandaDuracion. Funcion pura.

import { describe, expect, it } from "vitest"
import { bandaDuracion } from "./catalogo.types"

describe("bandaDuracion", () => {
  it("null cuando el texto es null", () => {
    expect(bandaDuracion(null)).toBeNull()
  })

  it("null cuando el texto no tiene numeros", () => {
    expect(bandaDuracion("varias horas")).toBeNull()
  })

  it("CORTA para horas < 5", () => {
    expect(bandaDuracion("4 horas")).toBe("CORTA")
    expect(bandaDuracion("2.5h")).toBe("CORTA")
    expect(bandaDuracion("1 hora")).toBe("CORTA")
  })

  it("MEDIA para horas en [5, 15]", () => {
    expect(bandaDuracion("5 horas")).toBe("MEDIA")
    expect(bandaDuracion("10 horas")).toBe("MEDIA")
    expect(bandaDuracion("15h")).toBe("MEDIA")
  })

  it("LARGA para horas > 15", () => {
    expect(bandaDuracion("16 horas")).toBe("LARGA")
    expect(bandaDuracion("40 horas")).toBe("LARGA")
  })

  it("convierte dias a horas multiplicando por 8", () => {
    expect(bandaDuracion("1 dia")).toBe("MEDIA") // 8h
    expect(bandaDuracion("3 dias")).toBe("LARGA") // 24h
    expect(bandaDuracion("0.5 dia")).toBe("CORTA") // 4h
  })

  it("acepta numeros con coma decimal", () => {
    expect(bandaDuracion("4,5 horas")).toBe("CORTA")
    expect(bandaDuracion("12,5 horas")).toBe("MEDIA")
  })

  it("null cuando el numero es 0 o negativo", () => {
    expect(bandaDuracion("0 horas")).toBeNull()
  })
})
