import { Workbook } from "exceljs"
import { beforeEach, describe, expect, it } from "vitest"
import { apiErrorCodes } from "../common/errors/api-error.codes"
import {
  AreaExigidaCursoTemplate,
  ColaboradorAsignadoValido,
  FilaParseadaRechazada,
  FilaParseadaValida,
  ParserEsperado,
  SkillExigidaCursoTemplate,
} from "./evaluacion-inicial.types"
import { ExcelParserService } from "./excel-parser.service"

const SKILL_1: SkillExigidaCursoTemplate = {
  skillId: "skill-1",
  etiquetaVisible: "python.fastapi",
  areaId: "area-1",
}
const SKILL_2: SkillExigidaCursoTemplate = {
  skillId: "skill-2",
  etiquetaVisible: "git.rebase",
  areaId: "area-2",
}
const AREA_1: AreaExigidaCursoTemplate = { areaId: "area-1", nombre: "Backend" }
const AREA_2: AreaExigidaCursoTemplate = { areaId: "area-2", nombre: "Tooling" }
const SKILLS_POR_AREA = new Map<string, readonly string[]>([
  ["area-1", ["skill-1"]],
  ["area-2", ["skill-2"]],
])
const COL_ALICE: ColaboradorAsignadoValido = { colaboradorId: "col-1", nombre: "Alice" }
const COL_BOB: ColaboradorAsignadoValido = { colaboradorId: "col-2", nombre: "Bob" }

function buildEsperado(): ParserEsperado {
  return {
    skillsExigidas: [SKILL_1, SKILL_2],
    areasExigidas: [AREA_1, AREA_2],
    skillsPorArea: SKILLS_POR_AREA,
    emailsValidos: new Map([
      ["alice@nttdata.test", COL_ALICE],
      ["bob@nttdata.test", COL_BOB],
    ]),
  }
}

const HEADERS_OK = [
  "email",
  "nombre",
  "[SKILL:skill-1|python.fastapi]",
  "[SKILL:skill-2|git.rebase]",
  "[AREA:area-1|Backend]",
  "[AREA:area-2|Tooling]",
]

async function workbookConFilas(
  headers: readonly string[],
  filas: readonly (readonly (string | number | null)[])[],
  opciones?: { readonly hoja?: string },
): Promise<Buffer> {
  const workbook = new Workbook()
  const hoja = workbook.addWorksheet(opciones?.hoja ?? "Notas")
  hoja.addRow([...headers])
  for (const fila of filas) {
    hoja.addRow([...fila])
  }
  const ab = await workbook.xlsx.writeBuffer()
  return Buffer.from(ab as ArrayBuffer)
}

describe("ExcelParserService.parsear", () => {
  let service: ExcelParserService

  beforeEach(() => {
    service = new ExcelParserService()
  })

  it("workbook valido completo: todas las filas son VALIDA y los valores se mapean", async () => {
    const buffer = await workbookConFilas(HEADERS_OK, [
      ["alice@nttdata.test", "Alice", 80, 60, 75, null],
      ["bob@nttdata.test", "Bob", null, 90, null, 85],
    ])
    const res = await service.parsear({ buffer, esperado: buildEsperado() })

    expect(res.encabezadosFaltantes).toHaveLength(0)
    expect(res.encabezadosInesperados).toHaveLength(0)
    expect(res.filas).toHaveLength(2)
    const fila1 = res.filas[0] as FilaParseadaValida
    expect(fila1.tipo).toBe("VALIDA")
    expect(fila1.colaboradorId).toBe("col-1")
    expect(fila1.valoresSkill.get("skill-1")).toBe(80)
    expect(fila1.valoresSkill.get("skill-2")).toBe(60)
    expect(fila1.valoresArea.get("area-1")).toBe(75)
    expect(fila1.valoresArea.get("area-2")).toBeNull()
  })

  it("worksheet 'Notas' ausente: encabezadosFaltantes incluye todos los esperados", async () => {
    const buffer = await workbookConFilas(HEADERS_OK, [], { hoja: "OtroNombre" })
    const res = await service.parsear({ buffer, esperado: buildEsperado() })
    expect(res.filas).toHaveLength(0)
    expect(res.encabezadosFaltantes).toContain("email")
    expect(res.encabezadosFaltantes).toContain("nombre")
    expect(res.encabezadosFaltantes).toContain("[SKILL:skill-1|python.fastapi]")
    expect(res.encabezadosFaltantes).toContain("[AREA:area-1|Backend]")
  })

  it("header esperado faltante: reporta la lista exacta", async () => {
    const headersIncompletos = HEADERS_OK.filter((h) => h !== "[SKILL:skill-2|git.rebase]")
    const buffer = await workbookConFilas(headersIncompletos, [
      ["alice@nttdata.test", "Alice", 80, 75, null],
    ])
    const res = await service.parsear({ buffer, esperado: buildEsperado() })
    expect(res.filas).toHaveLength(0)
    expect(res.encabezadosFaltantes).toEqual(["[SKILL:skill-2|git.rebase]"])
  })

  it("header malformado/inesperado: lo reporta como inesperado y bloquea parsing", async () => {
    const buffer = await workbookConFilas(
      [...HEADERS_OK, "comentario-libre"],
      [["alice@nttdata.test", "Alice", 80, 60, 75, null, "x"]],
    )
    const res = await service.parsear({ buffer, esperado: buildEsperado() })
    expect(res.filas).toHaveLength(0)
    expect(res.encabezadosInesperados).toContain("comentario-libre")
  })

  it("header SKILL con id desconocido: lo reporta como inesperado", async () => {
    const buffer = await workbookConFilas(
      [
        "email",
        "nombre",
        "[SKILL:skill-1|python.fastapi]",
        "[SKILL:skill-2|git.rebase]",
        "[SKILL:skill-X|fantasma]",
        "[AREA:area-1|Backend]",
        "[AREA:area-2|Tooling]",
      ],
      [["alice@nttdata.test", "Alice", 80, 60, 99, 75, null]],
    )
    const res = await service.parsear({ buffer, esperado: buildEsperado() })
    expect(res.filas).toHaveLength(0)
    expect(res.encabezadosInesperados).toContain("[SKILL:skill-X|fantasma]")
  })

  it("email malformado: fila RECHAZADA con validacionExcelEmailFormatoInvalido", async () => {
    const buffer = await workbookConFilas(HEADERS_OK, [["no-es-email", "Alice", 80, 60, 75, null]])
    const res = await service.parsear({ buffer, esperado: buildEsperado() })
    expect(res.filas).toHaveLength(1)
    const fila = res.filas[0] as FilaParseadaRechazada
    expect(fila.tipo).toBe("RECHAZADA")
    expect(fila.errores[0]?.codigo).toBe(apiErrorCodes.validacionExcelEmailFormatoInvalido)
  })

  it("email no asignado al curso: fila RECHAZADA con validacionExcelEmailNoAsignado", async () => {
    const buffer = await workbookConFilas(HEADERS_OK, [
      ["foreign@nttdata.test", "Foreign", 80, 60, 75, null],
    ])
    const res = await service.parsear({ buffer, esperado: buildEsperado() })
    expect(res.filas).toHaveLength(1)
    const fila = res.filas[0] as FilaParseadaRechazada
    expect(fila.tipo).toBe("RECHAZADA")
    expect(fila.errores.map((e) => e.codigo)).toContain(
      apiErrorCodes.validacionExcelEmailNoAsignado,
    )
  })

  it("email duplicado en archivo: la segunda fila se rechaza", async () => {
    const buffer = await workbookConFilas(HEADERS_OK, [
      ["alice@nttdata.test", "Alice", 80, 60, 75, null],
      ["alice@nttdata.test", "Alice 2", 90, 70, null, 88],
    ])
    const res = await service.parsear({ buffer, esperado: buildEsperado() })
    expect(res.filas).toHaveLength(2)
    expect(res.filas[0]?.tipo).toBe("VALIDA")
    const segunda = res.filas[1] as FilaParseadaRechazada
    expect(segunda.tipo).toBe("RECHAZADA")
    expect(segunda.errores.map((e) => e.codigo)).toContain(
      apiErrorCodes.validacionExcelEmailDuplicadoEnArchivo,
    )
  })

  it("nota fuera de rango (-1, 101): error por celda con validacionExcelNotaFueraRango", async () => {
    const buffer = await workbookConFilas(HEADERS_OK, [
      ["alice@nttdata.test", "Alice", -1, 101, 50, null],
    ])
    const res = await service.parsear({ buffer, esperado: buildEsperado() })
    const fila = res.filas[0] as FilaParseadaRechazada
    expect(fila.tipo).toBe("RECHAZADA")
    const codigos = fila.errores.map((e) => e.codigo)
    expect(codigos.filter((c) => c === apiErrorCodes.validacionExcelNotaFueraRango)).toHaveLength(2)
  })

  it("nota no numerica ('hola'): error con validacionExcelNotaNoNumerica", async () => {
    const buffer = await workbookConFilas(HEADERS_OK, [
      ["alice@nttdata.test", "Alice", "hola", 60, 75, null],
    ])
    const res = await service.parsear({ buffer, esperado: buildEsperado() })
    const fila = res.filas[0] as FilaParseadaRechazada
    expect(fila.tipo).toBe("RECHAZADA")
    expect(fila.errores.map((e) => e.codigo)).toContain(apiErrorCodes.validacionExcelNotaNoNumerica)
  })

  it("celda vacia se interpreta como null (no error)", async () => {
    const buffer = await workbookConFilas(HEADERS_OK, [
      ["alice@nttdata.test", "Alice", null, null, null, null],
    ])
    const res = await service.parsear({ buffer, esperado: buildEsperado() })
    const fila = res.filas[0] as FilaParseadaValida
    expect(fila.tipo).toBe("VALIDA")
    expect(fila.valoresSkill.get("skill-1")).toBeNull()
    expect(fila.valoresArea.get("area-1")).toBeNull()
  })

  it("decimal valido (75.5): conservado", async () => {
    const buffer = await workbookConFilas(HEADERS_OK, [
      ["alice@nttdata.test", "Alice", 75.5, 60, 50, null],
    ])
    const res = await service.parsear({ buffer, esperado: buildEsperado() })
    const fila = res.filas[0] as FilaParseadaValida
    expect(fila.valoresSkill.get("skill-1")).toBe(75.5)
  })

  it("fila con todas las celdas vacias pero email valido: VALIDA con mapas vacios de valores", async () => {
    const buffer = await workbookConFilas(HEADERS_OK, [
      ["alice@nttdata.test", "Alice", null, null, null, null],
    ])
    const res = await service.parsear({ buffer, esperado: buildEsperado() })
    const fila = res.filas[0] as FilaParseadaValida
    expect(fila.tipo).toBe("VALIDA")
    expect(fila.valoresSkill.size).toBe(2)
    expect(fila.valoresArea.size).toBe(2)
    for (const v of fila.valoresSkill.values()) {
      expect(v).toBeNull()
    }
    for (const v of fila.valoresArea.values()) {
      expect(v).toBeNull()
    }
  })
})
