import { describe, expect, it } from "vitest"
import { evaluarVeredicto } from "./evaluar-veredicto"

const APROBADO = 60

describe("evaluarVeredicto", () => {
  it("100% por primera vez → pleno y celebra", () => {
    const v = evaluarVeredicto({
      nota: 100,
      notaAprobado: APROBADO,
      notaPrevia: null,
      hayPistaOculta: false,
    })
    expect(v.estado).toBe("pleno")
    expect(v.celebrar).toBe(true)
    expect(v.mensaje).toBe("Lo lograste. Acabas de demostrar capacidad nueva.")
  })

  it("100% pero ya estaba pleno → pleno sin volver a celebrar", () => {
    const v = evaluarVeredicto({
      nota: 100,
      notaAprobado: APROBADO,
      notaPrevia: 100,
      hayPistaOculta: false,
    })
    expect(v.estado).toBe("pleno")
    expect(v.celebrar).toBe(false)
    expect(v.mensaje).toBe("Aprobado. Tu mejor intento sigue contando.")
  })

  it("aprobado parcial (≥60 y <100) → nunca dice 'Lo lograste' ni celebra", () => {
    const v = evaluarVeredicto({
      nota: 66.6,
      notaAprobado: APROBADO,
      notaPrevia: null,
      hayPistaOculta: true,
    })
    expect(v.estado).toBe("parcial")
    expect(v.celebrar).toBe(false)
    expect(v.mensaje).not.toContain("Lo lograste")
  })

  it("parcial CON pista oculta → menciona la pista", () => {
    const v = evaluarVeredicto({
      nota: 80,
      notaAprobado: APROBADO,
      notaPrevia: null,
      hayPistaOculta: true,
    })
    expect(v.mensaje).toBe(
      "Aprobado, pero aún falla algún caso oculto. Revisa la pista y afina tu solución para dominar el reto.",
    )
  })

  it("parcial SIN pista (fallo visible u oculto sin descripción) → no promete una pista", () => {
    const v = evaluarVeredicto({
      nota: 80,
      notaAprobado: APROBADO,
      notaPrevia: null,
      hayPistaOculta: false,
    })
    expect(v.mensaje).not.toContain("pista")
    expect(v.mensaje).toBe(
      "Aprobado, pero aún falla algún caso. Revisa los resultados y afina tu solución para dominar el reto.",
    )
  })

  it("justo en el umbral (60) es parcial, no reprobado", () => {
    expect(
      evaluarVeredicto({
        nota: 60,
        notaAprobado: APROBADO,
        notaPrevia: null,
        hayPistaOculta: false,
      }).estado,
    ).toBe("parcial")
  })

  it("por debajo del umbral → reprobado", () => {
    const v = evaluarVeredicto({
      nota: 33,
      notaAprobado: APROBADO,
      notaPrevia: null,
      hayPistaOculta: true,
    })
    expect(v.estado).toBe("reprobado")
    expect(v.celebrar).toBe(false)
    expect(v.mensaje).toContain("Aún no")
  })

  it("primer 100% viniendo de un parcial previo → celebra", () => {
    const v = evaluarVeredicto({
      nota: 100,
      notaAprobado: APROBADO,
      notaPrevia: 66,
      hayPistaOculta: false,
    })
    expect(v.celebrar).toBe(true)
  })
})
