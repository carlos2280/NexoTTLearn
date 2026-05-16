import { beforeEach, describe, expect, it } from "vitest"
import { ExportService } from "./export.service"
import type { ColumnaDef } from "./export.types"

interface FilaDemo {
  nombre: string
  valor: number
}

const COLUMNAS: ColumnaDef<FilaDemo>[] = [
  { key: "nombre", header: "Metrica" },
  { key: "valor", header: "Valor", formato: "numero" },
]

const ROWS: FilaDemo[] = [
  { nombre: "presentados", valor: 47 },
  { nombre: "aptos", valor: 38 },
]

describe("ExportService", () => {
  let service: ExportService

  beforeEach(() => {
    service = new ExportService()
  })

  describe("aCsv", () => {
    it("genera CSV con cabecera + filas en UTF-8", async () => {
      const result = await service.aCsv(ROWS, COLUMNAS)
      expect(result.extension).toBe("csv")
      expect(result.mime).toMatch(/text\/csv/)
      const texto = result.buffer.toString("utf-8")
      expect(texto.split("\n")[0]).toBe("Metrica,Valor")
      expect(texto).toContain("presentados,47")
    })

    it("escapa comillas y comas embebidas", async () => {
      const result = await service.aCsv([{ nombre: 'Tiene, "coma"', valor: 1 }], COLUMNAS)
      const texto = result.buffer.toString("utf-8")
      expect(texto).toContain('"Tiene, ""coma"""')
    })
  })

  describe("aXlsx", () => {
    it("genera un buffer XLSX no vacio con mime correcto", async () => {
      const result = await service.aXlsx(ROWS, COLUMNAS, "Demo")
      expect(result.extension).toBe("xlsx")
      expect(result.mime).toContain("spreadsheetml")
      expect(result.buffer.length).toBeGreaterThan(100)
    })
  })

  describe("aPdf", () => {
    it("genera un buffer PDF no vacio con mime correcto", async () => {
      const result = await service.aPdf("Reporte Demo", COLUMNAS, ROWS)
      expect(result.extension).toBe("pdf")
      expect(result.mime).toBe("application/pdf")
      expect(result.buffer.length).toBeGreaterThan(100)
      // PDF magic header
      expect(result.buffer.subarray(0, 4).toString()).toBe("%PDF")
    })
  })
})
