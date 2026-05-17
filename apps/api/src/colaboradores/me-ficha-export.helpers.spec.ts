import type { FichaResponse } from "@nexott-learn/shared-types"
import { describe, expect, it } from "vitest"
import {
  aplanarFichaPorArea,
  aplanarFichaSkills,
  fichaACsv,
  fichaAPdf,
  slugNombreColaborador,
} from "./me-ficha-export.helpers"

const FICHA: FichaResponse = {
  colaboradorId: "11111111-1111-1111-1111-111111111111",
  skills: [
    {
      skillId: "s1",
      etiquetaVisible: "React",
      areaId: "a1",
      areaNombre: "Frontend",
      notaActual: 8.5,
      origenActual: { tipo: "BLOQUE" },
    },
    {
      skillId: "s2",
      etiquetaVisible: "Postgres",
      areaId: "a2",
      areaNombre: "Backend",
      notaActual: null,
      origenActual: null,
    },
  ],
  porArea: [
    { areaId: "a1", nombre: "Frontend", promedio: 8.5, skillsConNota: 1, skillsTotales: 1 },
    { areaId: "a2", nombre: "Backend", promedio: null, skillsConNota: 0, skillsTotales: 1 },
  ],
}

describe("me-ficha-export helpers", () => {
  it("aplanarFichaSkills mapea origen.tipo y formatea nota null como vacio", () => {
    const filas = aplanarFichaSkills(FICHA)
    expect(filas[0]).toEqual({
      area: "Frontend",
      skill: "React",
      notaActual: "8.50",
      origen: "BLOQUE",
    })
    expect(filas[1]).toEqual({
      area: "Backend",
      skill: "Postgres",
      notaActual: "",
      origen: "",
    })
  })

  it("aplanarFichaPorArea formatea promedio null como vacio", () => {
    const filas = aplanarFichaPorArea(FICHA)
    expect(filas[0]?.promedio).toBe("8.50")
    expect(filas[1]?.promedio).toBe("")
  })

  it("fichaACsv contiene el id del colaborador y ambas secciones", () => {
    const csv = fichaACsv(FICHA)
    expect(csv).toContain(FICHA.colaboradorId)
    expect(csv).toContain("Resumen por area")
    expect(csv).toContain("Detalle por skill")
    expect(csv).toContain("React")
    expect(csv).toContain("Postgres")
    expect(csv.endsWith("\n")).toBe(true)
  })

  it("fichaACsv arranca con BOM UTF-8 para que Excel ESP lo detecte", () => {
    const csv = fichaACsv(FICHA)
    expect(csv.charCodeAt(0)).toBe(0xfeff)
  })

  describe("slugNombreColaborador", () => {
    it("normaliza diacriticos y espacios", () => {
      expect(slugNombreColaborador("Camila Soto Pérez")).toBe("camila-soto-perez")
    })
    it("colapsa caracteres especiales en un solo guion", () => {
      expect(slugNombreColaborador("María del Carmen / O'Brien")).toBe("maria-del-carmen-o-brien")
    })
    it("recorta guiones al inicio y al final", () => {
      expect(slugNombreColaborador("  --José Luis--  ")).toBe("jose-luis")
    })
    it("fallback `colaborador` cuando el slug queda vacio", () => {
      expect(slugNombreColaborador("---")).toBe("colaborador")
      expect(slugNombreColaborador("")).toBe("colaborador")
    })
  })

  it("fichaAPdf devuelve Buffer no vacio empezando por magic %PDF", async () => {
    const buffer = await fichaAPdf(FICHA)
    expect(Buffer.isBuffer(buffer)).toBe(true)
    expect(buffer.byteLength).toBeGreaterThan(100)
    expect(buffer.subarray(0, 4).toString()).toBe("%PDF")
  })
})
