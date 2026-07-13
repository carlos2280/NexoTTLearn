import { describe, expect, it } from "vitest"
import { construirMensajesCualitativa } from "./cualitativa.prompt"

describe("construirMensajesCualitativa", () => {
  it("incluye el contenido del repo envuelto entre marcadores con nonce", () => {
    const contenidoRepo = "===== index.ts =====\nconst UNICO_MARCADOR_TEST = 42"
    const { user } = construirMensajesCualitativa({
      contenidoRepo,
      profundidad: "SEMI_SENIOR",
      dimensiones: [],
    })

    expect(user).toContain("UNICO_MARCADOR_TEST")
    // El inicio y el fin usan el MISMO nonce (mismo bloque).
    const inicio = user.match(/<<<REPO ([\w-]+)>>>/)
    const fin = user.match(/<<<FIN REPO ([\w-]+)>>>/)
    expect(inicio).not.toBeNull()
    expect(fin).not.toBeNull()
    expect(inicio?.[1]).toBe(fin?.[1])
  })

  it("marca el contenido como DATO no confiable (anti prompt-injection)", () => {
    const { user, system } = construirMensajesCualitativa({
      contenidoRepo: "x",
      profundidad: "JUNIOR",
      dimensiones: [],
    })
    expect(user).toMatch(/DATO del/i)
    expect(user).toMatch(/no ejecutes el codigo/i)
    expect(system[0]?.text).toMatch(/evaluador tecnico imparcial/i)
  })

  it("usa un nonce distinto en cada invocación", () => {
    const a = construirMensajesCualitativa({
      contenidoRepo: "x",
      profundidad: "JUNIOR",
      dimensiones: [],
    })
    const b = construirMensajesCualitativa({
      contenidoRepo: "x",
      profundidad: "JUNIOR",
      dimensiones: [],
    })
    expect(a.user).not.toBe(b.user)
  })

  it("lista las dimensiones pedidas como ejes a puntuar", () => {
    const { system } = construirMensajesCualitativa({
      contenidoRepo: "x",
      profundidad: "SEMI_SENIOR",
      dimensiones: ["TypeScript estricto", "Testing"],
    })
    const textoSystem = system.map((b) => b.text).join("\n")
    expect(textoSystem).toMatch(/Dimensiones a puntuar/i)
    expect(textoSystem).toContain("TypeScript estricto")
    expect(textoSystem).toContain("Testing")
  })
})
