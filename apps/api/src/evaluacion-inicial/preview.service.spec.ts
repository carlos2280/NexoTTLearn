import { ConflictException, NotFoundException, UnprocessableEntityException } from "@nestjs/common"
import { previewCambiosArraySchema, previewResumenSchema } from "@nexott-learn/shared-types"
import { Prisma, RolUsuario } from "@prisma/client"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { apiErrorCodes } from "../common/errors/api-error.codes"
import { PrismaService } from "../common/prisma/prisma.service"
import { StorageService } from "../common/storage/storage.service"
import { SesionUsuario } from "../common/types/sesion.types"
import { FilaParseada, ParserResultado } from "./evaluacion-inicial.types"
import { ExcelParserService } from "./excel-parser.service"
import { PreviewService } from "./preview.service"

const CURSO_ID = "curso-1"
const ADMIN_ID = "usr-admin"
const SESION_ADMIN: SesionUsuario = { usuarioId: ADMIN_ID, rol: RolUsuario.ADMIN }
const MIME_XLSX = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
// Magic bytes OOXML (`PK\x03\x04`) + padding para superar la guarda de longitud
// minima del check de magic bytes en `PreviewService.crearPreview`.
const BUFFER_XLSX_OK = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x00, 0x00, 0x00, 0x00])

interface PrismaMock {
  curso: { findUnique: ReturnType<typeof vi.fn> }
  asignacionCurso: { findMany: ReturnType<typeof vi.fn> }
  notaSkill: { findMany: ReturnType<typeof vi.fn> }
  previewEvaluacionInicial: {
    create: ReturnType<typeof vi.fn>
    findUnique: ReturnType<typeof vi.fn>
    findFirst: ReturnType<typeof vi.fn>
    deleteMany: ReturnType<typeof vi.fn>
  }
}

function buildPrismaMock(): PrismaMock {
  return {
    curso: { findUnique: vi.fn() },
    asignacionCurso: { findMany: vi.fn() },
    notaSkill: { findMany: vi.fn() },
    previewEvaluacionInicial: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      deleteMany: vi.fn(),
    },
  }
}

interface ParserMock {
  parsear: ReturnType<typeof vi.fn>
}
interface StorageMock {
  guardar: ReturnType<typeof vi.fn>
}

function buildParserMock(result: ParserResultado): ParserMock {
  return { parsear: vi.fn().mockResolvedValue(result) }
}
function buildStorageMock(archivoId = "arch-1"): StorageMock {
  return {
    guardar: vi.fn().mockResolvedValue({
      archivoId,
      path: `EVALUACION_INICIAL_EXCEL/2026/05/${archivoId}.xlsx`,
    }),
  }
}

const SKILL_BACKEND: {
  skillId: string
  skill: { id: string; etiquetaVisible: string; areaId: string }
} = {
  skillId: "skill-1",
  skill: { id: "skill-1", etiquetaVisible: "python.fastapi", areaId: "area-1" },
}
const SKILL_TOOLING: {
  skillId: string
  skill: { id: string; etiquetaVisible: string; areaId: string }
} = {
  skillId: "skill-2",
  skill: { id: "skill-2", etiquetaVisible: "git.rebase", areaId: "area-2" },
}
const AREA_BACKEND: { areaId: string; area: { id: string; nombre: string } } = {
  areaId: "area-1",
  area: { id: "area-1", nombre: "Backend" },
}
const AREA_TOOLING: { areaId: string; area: { id: string; nombre: string } } = {
  areaId: "area-2",
  area: { id: "area-2", nombre: "Tooling" },
}

function cursoOk() {
  return {
    id: CURSO_ID,
    titulo: "Backend Avanzado",
    estado: "BORRADOR",
    areasExigidas: [AREA_BACKEND, AREA_TOOLING],
    skillsExigidas: [SKILL_BACKEND, SKILL_TOOLING],
  }
}

function asignacionesOk() {
  return [
    {
      colaboradorId: "col-1",
      colaborador: { id: "col-1", email: "alice@nttdata.test", nombre: "Alice" },
    },
    {
      colaboradorId: "col-2",
      colaborador: { id: "col-2", email: "bob@nttdata.test", nombre: "Bob" },
    },
  ]
}

function filaValida(
  email: string,
  colaboradorId: string,
  nombre: string,
  valoresSkill: readonly [string, number | null][],
  valoresArea: readonly [string, number | null][],
  numero = 2,
): FilaParseada {
  return {
    tipo: "VALIDA",
    numero,
    email,
    colaboradorId,
    nombre,
    valoresSkill: new Map(valoresSkill),
    valoresArea: new Map(valoresArea),
  }
}

function previewCreado(id: string) {
  return { id }
}

describe("PreviewService.crearPreview", () => {
  let prisma: PrismaMock
  let parser: ParserMock
  let storage: StorageMock
  let service: PreviewService

  function instanciar(parserResult?: ParserResultado): void {
    parser = buildParserMock(
      parserResult ?? { filas: [], encabezadosFaltantes: [], encabezadosInesperados: [] },
    )
    storage = buildStorageMock()
    service = new PreviewService(
      prisma as unknown as PrismaService,
      parser as unknown as ExcelParserService,
      storage as unknown as StorageService,
    )
  }

  beforeEach(() => {
    prisma = buildPrismaMock()
    prisma.previewEvaluacionInicial.create.mockResolvedValue(previewCreado("prev-1"))
  })

  it("MIME invalido: 400 invalidBody", async () => {
    instanciar()
    let caught: unknown
    try {
      await service.crearPreview({
        cursoId: CURSO_ID,
        buffer: Buffer.from(""),
        mimeType: "application/pdf",
        tamanioBytes: 100,
        nombreOriginal: "test.xlsx",
        sesion: SESION_ADMIN,
      })
    } catch (error) {
      caught = error
    }
    expect((caught as { getResponse: () => { code: string } }).getResponse().code).toBe(
      apiErrorCodes.invalidBody,
    )
  })

  it("curso inexistente: 404 cursoNoEncontrado", async () => {
    prisma.curso.findUnique.mockResolvedValue(null)
    instanciar()
    let caught: unknown
    try {
      await service.crearPreview({
        cursoId: CURSO_ID,
        buffer: BUFFER_XLSX_OK,
        mimeType: MIME_XLSX,
        tamanioBytes: 100,
        nombreOriginal: "test.xlsx",
        sesion: SESION_ADMIN,
      })
    } catch (error) {
      caught = error
    }
    expect(caught).toBeInstanceOf(NotFoundException)
    expect((caught as NotFoundException).getResponse()).toMatchObject({
      code: apiErrorCodes.cursoNoEncontrado,
    })
  })

  it("curso sin areas ni skills: 409 conflictCursoNoPublicable", async () => {
    prisma.curso.findUnique.mockResolvedValue({
      ...cursoOk(),
      areasExigidas: [],
      skillsExigidas: [],
    })
    instanciar()
    let caught: unknown
    try {
      await service.crearPreview({
        cursoId: CURSO_ID,
        buffer: BUFFER_XLSX_OK,
        mimeType: MIME_XLSX,
        tamanioBytes: 100,
        nombreOriginal: "test.xlsx",
        sesion: SESION_ADMIN,
      })
    } catch (error) {
      caught = error
    }
    expect(caught).toBeInstanceOf(ConflictException)
    expect((caught as ConflictException).getResponse()).toMatchObject({
      code: apiErrorCodes.conflictCursoNoPublicable,
    })
  })

  it("curso sin asignados: 409 conflictCursoNoPublicable", async () => {
    prisma.curso.findUnique.mockResolvedValue(cursoOk())
    prisma.asignacionCurso.findMany.mockResolvedValue([])
    instanciar()
    let caught: unknown
    try {
      await service.crearPreview({
        cursoId: CURSO_ID,
        buffer: BUFFER_XLSX_OK,
        mimeType: MIME_XLSX,
        tamanioBytes: 100,
        nombreOriginal: "test.xlsx",
        sesion: SESION_ADMIN,
      })
    } catch (error) {
      caught = error
    }
    expect(caught).toBeInstanceOf(ConflictException)
  })

  it("encabezados invalidos: 422 validacionExcelEncabezados con details", async () => {
    prisma.curso.findUnique.mockResolvedValue(cursoOk())
    prisma.asignacionCurso.findMany.mockResolvedValue(asignacionesOk())
    instanciar({
      filas: [],
      encabezadosFaltantes: ["[SKILL:skill-1|python.fastapi]"],
      encabezadosInesperados: ["columna-rara"],
    })
    let caught: unknown
    try {
      await service.crearPreview({
        cursoId: CURSO_ID,
        buffer: BUFFER_XLSX_OK,
        mimeType: MIME_XLSX,
        tamanioBytes: 100,
        nombreOriginal: "test.xlsx",
        sesion: SESION_ADMIN,
      })
    } catch (error) {
      caught = error
    }
    expect(caught).toBeInstanceOf(UnprocessableEntityException)
    const resp = (caught as UnprocessableEntityException).getResponse() as {
      code: string
      details: { encabezadosFaltantes: string[]; encabezadosInesperados: string[] }
    }
    expect(resp.code).toBe(apiErrorCodes.validacionExcelEncabezados)
    expect(resp.details.encabezadosFaltantes).toEqual(["[SKILL:skill-1|python.fastapi]"])
    expect(resp.details.encabezadosInesperados).toEqual(["columna-rara"])
  })

  it("SKILL_DIRECTA: emite fuente SKILL_DIRECTA", async () => {
    prisma.curso.findUnique.mockResolvedValue(cursoOk())
    prisma.asignacionCurso.findMany.mockResolvedValue(asignacionesOk())
    prisma.notaSkill.findMany.mockResolvedValue([])
    instanciar({
      filas: [
        filaValida(
          "alice@nttdata.test",
          "col-1",
          "Alice",
          [
            ["skill-1", 80],
            ["skill-2", null],
          ],
          [
            ["area-1", null],
            ["area-2", null],
          ],
        ),
      ],
      encabezadosFaltantes: [],
      encabezadosInesperados: [],
    })

    const res = await service.crearPreview({
      cursoId: CURSO_ID,
      buffer: BUFFER_XLSX_OK,
      mimeType: MIME_XLSX,
      tamanioBytes: 1,
      nombreOriginal: "test.xlsx",
      sesion: SESION_ADMIN,
    })

    expect(res.cambios).toHaveLength(1)
    const cambio = res.cambios[0]
    expect(cambio?.skillId).toBe("skill-1")
    expect(cambio?.fuente).toBe("SKILL_DIRECTA")
    expect(cambio?.valorAnterior).toBeNull()
    expect(cambio?.valorNuevo).toBe(80)
  })

  it("AREA_HEREDADA: hereda a las skills exigidas del area cuando no hay SKILL_DIRECTA", async () => {
    prisma.curso.findUnique.mockResolvedValue(cursoOk())
    prisma.asignacionCurso.findMany.mockResolvedValue(asignacionesOk())
    prisma.notaSkill.findMany.mockResolvedValue([])
    instanciar({
      filas: [
        filaValida(
          "alice@nttdata.test",
          "col-1",
          "Alice",
          [
            ["skill-1", null],
            ["skill-2", null],
          ],
          [
            ["area-1", 70],
            ["area-2", null],
          ],
        ),
      ],
      encabezadosFaltantes: [],
      encabezadosInesperados: [],
    })

    const res = await service.crearPreview({
      cursoId: CURSO_ID,
      buffer: BUFFER_XLSX_OK,
      mimeType: MIME_XLSX,
      tamanioBytes: 1,
      nombreOriginal: "test.xlsx",
      sesion: SESION_ADMIN,
    })

    expect(res.cambios).toHaveLength(1)
    expect(res.cambios[0]?.skillId).toBe("skill-1")
    expect(res.cambios[0]?.fuente).toBe("AREA_HEREDADA")
    expect(res.cambios[0]?.valorNuevo).toBe(70)
  })

  it("SKILL_DIRECTA gana sobre AREA_HEREDADA para esa skill", async () => {
    prisma.curso.findUnique.mockResolvedValue(cursoOk())
    prisma.asignacionCurso.findMany.mockResolvedValue(asignacionesOk())
    prisma.notaSkill.findMany.mockResolvedValue([])
    instanciar({
      filas: [
        filaValida(
          "alice@nttdata.test",
          "col-1",
          "Alice",
          [
            ["skill-1", 95],
            ["skill-2", null],
          ],
          [
            ["area-1", 60],
            ["area-2", null],
          ],
        ),
      ],
      encabezadosFaltantes: [],
      encabezadosInesperados: [],
    })

    const res = await service.crearPreview({
      cursoId: CURSO_ID,
      buffer: BUFFER_XLSX_OK,
      mimeType: MIME_XLSX,
      tamanioBytes: 1,
      nombreOriginal: "test.xlsx",
      sesion: SESION_ADMIN,
    })

    expect(res.cambios).toHaveLength(1)
    expect(res.cambios[0]?.fuente).toBe("SKILL_DIRECTA")
    expect(res.cambios[0]?.valorNuevo).toBe(95)
  })

  it("Sin cambio si valorNuevo === valorAnterior (Decimal equivalente)", async () => {
    prisma.curso.findUnique.mockResolvedValue(cursoOk())
    prisma.asignacionCurso.findMany.mockResolvedValue(asignacionesOk())
    prisma.notaSkill.findMany.mockResolvedValue([
      {
        colaboradorId: "col-1",
        skillId: "skill-1",
        notaActual: new Prisma.Decimal(80),
      },
    ])
    instanciar({
      filas: [
        filaValida(
          "alice@nttdata.test",
          "col-1",
          "Alice",
          [
            ["skill-1", 80],
            ["skill-2", null],
          ],
          [
            ["area-1", null],
            ["area-2", null],
          ],
        ),
      ],
      encabezadosFaltantes: [],
      encabezadosInesperados: [],
    })

    const res = await service.crearPreview({
      cursoId: CURSO_ID,
      buffer: BUFFER_XLSX_OK,
      mimeType: MIME_XLSX,
      tamanioBytes: 1,
      nombreOriginal: "test.xlsx",
      sesion: SESION_ADMIN,
    })

    expect(res.cambios).toHaveLength(0)
    expect(res.resumen.filasValidas).toBe(1)
  })

  it("Emite cambio si valor previo != valor nuevo, con valorAnterior persistido", async () => {
    prisma.curso.findUnique.mockResolvedValue(cursoOk())
    prisma.asignacionCurso.findMany.mockResolvedValue(asignacionesOk())
    prisma.notaSkill.findMany.mockResolvedValue([
      {
        colaboradorId: "col-1",
        skillId: "skill-1",
        notaActual: new Prisma.Decimal(60),
      },
    ])
    instanciar({
      filas: [
        filaValida(
          "alice@nttdata.test",
          "col-1",
          "Alice",
          [
            ["skill-1", 80],
            ["skill-2", null],
          ],
          [
            ["area-1", null],
            ["area-2", null],
          ],
        ),
      ],
      encabezadosFaltantes: [],
      encabezadosInesperados: [],
    })

    const res = await service.crearPreview({
      cursoId: CURSO_ID,
      buffer: BUFFER_XLSX_OK,
      mimeType: MIME_XLSX,
      tamanioBytes: 1,
      nombreOriginal: "test.xlsx",
      sesion: SESION_ADMIN,
    })

    expect(res.cambios).toHaveLength(1)
    expect(res.cambios[0]?.valorAnterior).toBe(60)
    expect(res.cambios[0]?.valorNuevo).toBe(80)
  })

  it("Mixto valido + rechazado: 201 con resumen mixto", async () => {
    prisma.curso.findUnique.mockResolvedValue(cursoOk())
    prisma.asignacionCurso.findMany.mockResolvedValue(asignacionesOk())
    prisma.notaSkill.findMany.mockResolvedValue([])
    instanciar({
      filas: [
        filaValida(
          "alice@nttdata.test",
          "col-1",
          "Alice",
          [
            ["skill-1", 80],
            ["skill-2", null],
          ],
          [
            ["area-1", null],
            ["area-2", null],
          ],
        ),
        {
          tipo: "RECHAZADA",
          numero: 3,
          email: "no@x.com",
          errores: [
            {
              celda: "A3",
              codigo: apiErrorCodes.validacionExcelEmailNoAsignado,
              mensaje: "no asignado",
            },
          ],
        },
      ],
      encabezadosFaltantes: [],
      encabezadosInesperados: [],
    })

    const res = await service.crearPreview({
      cursoId: CURSO_ID,
      buffer: BUFFER_XLSX_OK,
      mimeType: MIME_XLSX,
      tamanioBytes: 1,
      nombreOriginal: "test.xlsx",
      sesion: SESION_ADMIN,
    })

    expect(res.resumen.filasTotales).toBe(2)
    expect(res.resumen.filasValidas).toBe(1)
    expect(res.resumen.filasRechazadas).toBe(1)
    expect(res.cambios).toHaveLength(1)
    expect(res.rechazos).toHaveLength(1)
    expect(res.rechazos[0]?.errores[0]?.codigo).toBe(apiErrorCodes.validacionExcelEmailNoAsignado)
  })

  it("Persiste preview con expiraEn 30 min y aplicadoEn null", async () => {
    prisma.curso.findUnique.mockResolvedValue(cursoOk())
    prisma.asignacionCurso.findMany.mockResolvedValue(asignacionesOk())
    prisma.notaSkill.findMany.mockResolvedValue([])
    instanciar({
      filas: [
        filaValida(
          "alice@nttdata.test",
          "col-1",
          "Alice",
          [
            ["skill-1", 80],
            ["skill-2", null],
          ],
          [
            ["area-1", null],
            ["area-2", null],
          ],
        ),
      ],
      encabezadosFaltantes: [],
      encabezadosInesperados: [],
    })

    const antes = Date.now()
    const res = await service.crearPreview({
      cursoId: CURSO_ID,
      buffer: BUFFER_XLSX_OK,
      mimeType: MIME_XLSX,
      tamanioBytes: 1,
      nombreOriginal: "test.xlsx",
      sesion: SESION_ADMIN,
    })
    const despues = Date.now()

    expect(res.previewId).toBe("prev-1")
    expect(res.archivoId).toBe("arch-1")
    const expiraMs = new Date(res.expiraEn).getTime()
    expect(expiraMs).toBeGreaterThanOrEqual(antes + 29 * 60 * 1000)
    expect(expiraMs).toBeLessThanOrEqual(despues + 31 * 60 * 1000)

    expect(prisma.previewEvaluacionInicial.create).toHaveBeenCalledTimes(1)
    const call = prisma.previewEvaluacionInicial.create.mock.calls[0]?.[0] as {
      data: { aplicadoPorCargaId?: unknown; resumen: unknown; cambios: unknown; rechazos: unknown }
    }
    expect(call.data.aplicadoPorCargaId).toBeUndefined()
  })

  it("buffer sin magic bytes (0x504b0304): 400 invalidBody, no llama al parser", async () => {
    prisma.curso.findUnique.mockResolvedValue(cursoOk())
    prisma.asignacionCurso.findMany.mockResolvedValue(asignacionesOk())
    instanciar({ filas: [], encabezadosFaltantes: [], encabezadosInesperados: [] })
    const bufferSinMagic = Buffer.from([0x25, 0x50, 0x44, 0x46]) // "%PDF"
    let caught: unknown
    try {
      await service.crearPreview({
        cursoId: CURSO_ID,
        buffer: bufferSinMagic,
        mimeType: MIME_XLSX,
        tamanioBytes: bufferSinMagic.length,
        nombreOriginal: "test.xlsx",
        sesion: SESION_ADMIN,
      })
    } catch (error) {
      caught = error
    }
    expect((caught as { getResponse: () => { code: string } }).getResponse().code).toBe(
      apiErrorCodes.invalidBody,
    )
    expect(parser.parsear).not.toHaveBeenCalled()
  })

  it("parser lanza excepcion: 400 invalidBody (mapea exceljs corrupto, no 500)", async () => {
    prisma.curso.findUnique.mockResolvedValue(cursoOk())
    prisma.asignacionCurso.findMany.mockResolvedValue(asignacionesOk())
    parser = {
      parsear: vi.fn().mockRejectedValue(new Error("OOXML inválido")),
    }
    storage = buildStorageMock()
    service = new PreviewService(
      prisma as unknown as PrismaService,
      parser as unknown as ExcelParserService,
      storage as unknown as StorageService,
    )
    let caught: unknown
    try {
      await service.crearPreview({
        cursoId: CURSO_ID,
        buffer: BUFFER_XLSX_OK,
        mimeType: MIME_XLSX,
        tamanioBytes: BUFFER_XLSX_OK.length,
        nombreOriginal: "test.xlsx",
        sesion: SESION_ADMIN,
      })
    } catch (error) {
      caught = error
    }
    const resp = (
      caught as { getResponse: () => { code: string; details?: { causa?: string } } }
    ).getResponse()
    expect(resp.code).toBe(apiErrorCodes.invalidBody)
    expect(resp.details?.causa).toContain("OOXML")
  })

  it("storage.guardar recibe metadata sin PII", async () => {
    prisma.curso.findUnique.mockResolvedValue(cursoOk())
    prisma.asignacionCurso.findMany.mockResolvedValue(asignacionesOk())
    prisma.notaSkill.findMany.mockResolvedValue([])
    instanciar({
      filas: [
        filaValida(
          "alice@nttdata.test",
          "col-1",
          "Alice",
          [
            ["skill-1", 80],
            ["skill-2", null],
          ],
          [
            ["area-1", null],
            ["area-2", null],
          ],
        ),
      ],
      encabezadosFaltantes: [],
      encabezadosInesperados: [],
    })
    await service.crearPreview({
      cursoId: CURSO_ID,
      buffer: BUFFER_XLSX_OK,
      mimeType: MIME_XLSX,
      tamanioBytes: 1,
      nombreOriginal: "test.xlsx",
      sesion: SESION_ADMIN,
    })
    const arg = storage.guardar.mock.calls[0]?.[0] as { metadata: Record<string, unknown> }
    expect(arg.metadata).toMatchObject({
      cursoId: CURSO_ID,
      nombreOriginal: "test.xlsx",
    })
    expect(JSON.stringify(arg.metadata)).not.toContain("alice@nttdata.test")
  })
})

describe("PreviewService.descartarPreview", () => {
  let prisma: PrismaMock
  let service: PreviewService

  beforeEach(() => {
    prisma = buildPrismaMock()
    const parser = buildParserMock({
      filas: [],
      encabezadosFaltantes: [],
      encabezadosInesperados: [],
    })
    const storage = buildStorageMock()
    service = new PreviewService(
      prisma as unknown as PrismaService,
      parser as unknown as ExcelParserService,
      storage as unknown as StorageService,
    )
  })

  it("happy path: borra preview no aplicado y devuelve archivoId", async () => {
    prisma.previewEvaluacionInicial.findFirst.mockResolvedValue({
      id: "prev-1",
      cursoId: CURSO_ID,
      aplicadoEn: null,
      archivoId: "arch-1",
    })
    prisma.previewEvaluacionInicial.deleteMany.mockResolvedValue({ count: 1 })

    const res = await service.descartarPreview(CURSO_ID, "prev-1")
    expect(res.archivoId).toBe("arch-1")
    expect(prisma.previewEvaluacionInicial.deleteMany).toHaveBeenCalledWith({
      where: { id: "prev-1", cursoId: CURSO_ID, aplicadoEn: null },
    })
  })

  it("preview inexistente: 404 previewNoEncontrado", async () => {
    prisma.previewEvaluacionInicial.findFirst.mockResolvedValue(null)
    let caught: unknown
    try {
      await service.descartarPreview(CURSO_ID, "prev-1")
    } catch (error) {
      caught = error
    }
    expect(caught).toBeInstanceOf(NotFoundException)
    expect((caught as NotFoundException).getResponse()).toMatchObject({
      code: apiErrorCodes.previewNoEncontrado,
    })
  })

  it("preview de otro curso: 404 previewNoEncontrado (no revelar existencia)", async () => {
    // findFirst filtra por (id, cursoId): un preview de otro curso => null.
    prisma.previewEvaluacionInicial.findFirst.mockResolvedValue(null)
    let caught: unknown
    try {
      await service.descartarPreview(CURSO_ID, "prev-1")
    } catch (error) {
      caught = error
    }
    expect(caught).toBeInstanceOf(NotFoundException)
  })

  it("preview ya aplicado: 409 conflictPreviewYaAplicado (deleteMany count=0)", async () => {
    prisma.previewEvaluacionInicial.findFirst.mockResolvedValue({
      id: "prev-1",
      cursoId: CURSO_ID,
      aplicadoEn: new Date(),
      archivoId: "arch-1",
    })
    prisma.previewEvaluacionInicial.deleteMany.mockResolvedValue({ count: 0 })
    let caught: unknown
    try {
      await service.descartarPreview(CURSO_ID, "prev-1")
    } catch (error) {
      caught = error
    }
    expect(caught).toBeInstanceOf(ConflictException)
    expect((caught as ConflictException).getResponse()).toMatchObject({
      code: apiErrorCodes.conflictPreviewYaAplicado,
    })
  })

  it("preview existente pero de otro curso: 404 previewNoEncontrado (cross-curso)", async () => {
    // findFirst con where: { id, cursoId } => null si cursoId diverge.
    prisma.previewEvaluacionInicial.findFirst.mockResolvedValue(null)
    let caught: unknown
    try {
      await service.descartarPreview(CURSO_ID, "prev-1")
    } catch (error) {
      caught = error
    }
    expect(caught).toBeInstanceOf(NotFoundException)
    expect((caught as NotFoundException).getResponse()).toMatchObject({
      code: apiErrorCodes.previewNoEncontrado,
    })
    expect(prisma.previewEvaluacionInicial.deleteMany).not.toHaveBeenCalled()
  })

  it("race deleteMany count===0: 409 conflictPreviewYaAplicado", async () => {
    prisma.previewEvaluacionInicial.findFirst.mockResolvedValue({
      id: "prev-1",
      cursoId: CURSO_ID,
      aplicadoEn: null,
      archivoId: "arch-1",
    })
    prisma.previewEvaluacionInicial.deleteMany.mockResolvedValue({ count: 0 })
    let caught: unknown
    try {
      await service.descartarPreview(CURSO_ID, "prev-1")
    } catch (error) {
      caught = error
    }
    expect(caught).toBeInstanceOf(ConflictException)
    expect((caught as ConflictException).getResponse()).toMatchObject({
      code: apiErrorCodes.conflictPreviewYaAplicado,
    })
  })
})

describe("preview schemas Zod (defensa antes de persistir Json)", () => {
  it("previewResumenSchema rechaza filasTotales como string", () => {
    const resultado = previewResumenSchema.safeParse({
      filasTotales: "no-numero",
      filasValidas: 0,
      filasRechazadas: 0,
      skillsAfectadas: 0,
      colaboradoresAfectados: 0,
    })
    expect(resultado.success).toBe(false)
  })

  it("previewCambiosArraySchema rechaza fuente desconocida", () => {
    const resultado = previewCambiosArraySchema.safeParse([
      {
        colaboradorId: "col-1",
        email: "x@x.com",
        nombreColaborador: "X",
        skillId: "skill-1",
        etiquetaSkill: "etiqueta",
        valorAnterior: null,
        valorNuevo: 80,
        fuente: "INVENTADA",
      },
    ])
    expect(resultado.success).toBe(false)
  })
})
