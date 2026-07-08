import { ConflictException, NotFoundException } from "@nestjs/common"
import { Test, type TestingModule } from "@nestjs/testing"
import type { ImportarCursoInput } from "@nexott-learn/shared-types"
import { Prisma } from "@prisma/client"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { apiErrorCodes } from "../../common/errors/api-error.codes"
import { PrismaService } from "../../common/prisma/prisma.service"
import { ImportarCursoService } from "./importar-curso.service"
import { parsearCursoMd } from "./parser-md"

vi.mock("./parser-md", async () => {
  const actual = await vi.importActual<typeof import("./parser-md")>("./parser-md")
  return {
    ...actual,
    parsearCursoMd: vi.fn(),
  }
})

interface MockTx {
  curso: { create: ReturnType<typeof vi.fn> }
  modulo: { create: ReturnType<typeof vi.fn> }
  seccion: { create: ReturnType<typeof vi.fn> }
  bloque: { create: ReturnType<typeof vi.fn> }
  cursoModuloHabilitado: { create: ReturnType<typeof vi.fn> }
}

interface MockPrisma {
  cliente: { findFirst: ReturnType<typeof vi.fn> }
  skill: { findMany: ReturnType<typeof vi.fn> }
  $transaction: ReturnType<typeof vi.fn>
}

function buildTxMock(): MockTx {
  return {
    curso: { create: vi.fn().mockResolvedValue({ id: "curso-1" }) },
    modulo: { create: vi.fn().mockResolvedValue({ id: "mod-1" }) },
    seccion: { create: vi.fn().mockResolvedValue({ id: "sec-1" }) },
    bloque: { create: vi.fn().mockResolvedValue({ id: "bloq-1" }) },
    cursoModuloHabilitado: { create: vi.fn().mockResolvedValue(undefined) },
  }
}

function buildPrismaMock(tx: MockTx): MockPrisma {
  const mock: MockPrisma = {
    cliente: { findFirst: vi.fn() },
    skill: { findMany: vi.fn().mockResolvedValue([]) },
    $transaction: vi.fn(),
  }
  mock.$transaction.mockImplementation(async (cb: (tx: MockTx) => Promise<string>) => await cb(tx))
  return mock
}

function buildParsedInput(): ImportarCursoInput {
  return {
    curso: {
      titulo: "Curso de prueba",
      cliente: "NTT Data Iberia",
      fechaInicio: "2026-01-01",
      fechaDeadline: "2026-12-31",
    },
    modulos: [
      {
        titulo: "Modulo uno",
        descripcion: "",
        secciones: [
          {
            titulo: "Seccion uno",
            bloques: [
              {
                tipo: "PARRAFO",
                contenido: { html: "<p>hola</p>", textoPlano: "hola", tiempoLecturaMin: 1 },
              },
            ],
          },
        ],
      },
    ],
  } as ImportarCursoInput
}

function buildParsedInputConCodigo(skillEtiqueta?: string): ImportarCursoInput {
  return {
    curso: {
      titulo: "Curso con reto",
      cliente: "NTT Data Iberia",
      fechaInicio: "2026-01-01",
      fechaDeadline: "2026-12-31",
    },
    modulos: [
      {
        titulo: "Modulo uno",
        descripcion: "",
        secciones: [
          {
            titulo: "Seccion uno",
            bloques: [
              {
                tipo: "CODIGO",
                contenidoReto: {
                  lenguaje: "typescript",
                  enunciado: "Suma dos numeros",
                  esqueletoInicial: "",
                  tiempoLimiteSeg: 30,
                },
                solucionReferencia: "",
                tests: [
                  { id: "t1", descripcion: "", entrada: "1 2", salidaEsperada: "3", visible: true },
                ],
                ...(skillEtiqueta ? { skillEtiqueta } : {}),
              },
            ],
          },
        ],
      },
    ],
  } as ImportarCursoInput
}

function buildParsedInputConSql(skillEtiqueta?: string): ImportarCursoInput {
  return {
    curso: {
      titulo: "Curso con SQL",
      cliente: "NTT Data Iberia",
      fechaInicio: "2026-01-01",
      fechaDeadline: "2026-12-31",
    },
    modulos: [
      {
        titulo: "Modulo uno",
        descripcion: "",
        secciones: [
          {
            titulo: "Seccion uno",
            bloques: [
              {
                tipo: "SQL",
                contenidoReto: {
                  enunciado: "Lista usuarios activos",
                  esquemaSemilla: "CREATE TABLE u (id int);",
                  consultaInicial: "",
                  tiempoLimiteSeg: 30,
                },
                tests: [
                  {
                    id: "t1",
                    descripcion: "",
                    visible: true,
                    esquemaSemilla: "",
                    consultaReferencia: "SELECT id FROM u",
                    ordenImporta: false,
                  },
                ],
                ...(skillEtiqueta ? { skillEtiqueta } : {}),
              },
            ],
          },
        ],
      },
    ],
  } as ImportarCursoInput
}

let tx: MockTx
let prisma: MockPrisma
let service: ImportarCursoService
let moduleRef: TestingModule

beforeEach(async () => {
  vi.mocked(parsearCursoMd).mockReset()
  tx = buildTxMock()
  prisma = buildPrismaMock(tx)
  moduleRef = await Test.createTestingModule({
    providers: [
      {
        provide: ImportarCursoService,
        useFactory: (p: PrismaService) => new ImportarCursoService(p),
        inject: [PrismaService],
      },
      { provide: PrismaService, useValue: prisma },
    ],
  }).compile()
  service = moduleRef.get(ImportarCursoService)
})

describe("ImportarCursoService.importar", () => {
  it("happy path: persiste curso + módulo + sección + bloque y devuelve contadores", async () => {
    vi.mocked(parsearCursoMd).mockReturnValue(buildParsedInput())
    prisma.cliente.findFirst.mockResolvedValue({ id: "cliente-1" })

    const res = await service.importar({ contenidoMd: "# Curso\n..." })

    expect(res).toEqual({
      cursoId: "curso-1",
      modulosCreados: 1,
      seccionesCreadas: 1,
      bloquesCreados: 1,
    })
    expect(tx.curso.create).toHaveBeenCalledTimes(1)
    expect(tx.modulo.create).toHaveBeenCalledTimes(1)
    expect(tx.seccion.create).toHaveBeenCalledTimes(1)
    expect(tx.bloque.create).toHaveBeenCalledTimes(1)
    expect(tx.cursoModuloHabilitado.create).toHaveBeenCalledTimes(1)
  })

  it("cliente no encontrado: lanza NotFoundException CLIENTE_NO_ENCONTRADO sin abrir transacción", async () => {
    vi.mocked(parsearCursoMd).mockReturnValue(buildParsedInput())
    prisma.cliente.findFirst.mockResolvedValue(null)

    try {
      await service.importar({ contenidoMd: "# Curso\n..." })
      throw new Error("expected throw")
    } catch (error) {
      expect(error).toBeInstanceOf(NotFoundException)
      const r = (error as NotFoundException).getResponse() as { code: string }
      expect(r.code).toBe(apiErrorCodes.clienteNoEncontrado)
    }
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })

  it("skill declarada: resuelve la etiqueta y setea skillQueMideId en el CODIGO_PREGUNTAS", async () => {
    vi.mocked(parsearCursoMd).mockReturnValue(buildParsedInputConCodigo("TS narrowing"))
    prisma.cliente.findFirst.mockResolvedValue({ id: "cliente-1" })
    prisma.skill.findMany.mockResolvedValue([{ id: "skill-1", etiquetaVisible: "TS narrowing" }])

    const res = await service.importar({ contenidoMd: "# Curso\n..." })

    expect(res.bloquesCreados).toBe(2)
    const primeraCreacion = tx.bloque.create.mock.calls[0]?.[0] as {
      data: { tipo: string; skillQueMideId: string | null }
    }
    expect(primeraCreacion.data.tipo).toBe("CODIGO_PREGUNTAS")
    expect(primeraCreacion.data.skillQueMideId).toBe("skill-1")
  })

  it("skill inexistente: lanza NotFoundException SKILL_NO_ENCONTRADA sin abrir transacción", async () => {
    vi.mocked(parsearCursoMd).mockReturnValue(buildParsedInputConCodigo("Skill fantasma"))
    prisma.cliente.findFirst.mockResolvedValue({ id: "cliente-1" })
    prisma.skill.findMany.mockResolvedValue([])

    try {
      await service.importar({ contenidoMd: "# Curso\n..." })
      throw new Error("expected throw")
    } catch (error) {
      expect(error).toBeInstanceOf(NotFoundException)
      const r = (error as NotFoundException).getResponse() as { code: string }
      expect(r.code).toBe(apiErrorCodes.skillNoEncontrada)
    }
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })

  it("bloque SQL: crea SQL_EJERCICIO + SQL_TESTS y setea skillQueMideId en el ejercicio", async () => {
    vi.mocked(parsearCursoMd).mockReturnValue(buildParsedInputConSql("Postgres · SELECT"))
    prisma.cliente.findFirst.mockResolvedValue({ id: "cliente-1" })
    prisma.skill.findMany.mockResolvedValue([
      { id: "skill-9", etiquetaVisible: "Postgres · SELECT" },
    ])

    const res = await service.importar({ contenidoMd: "# Curso\n..." })

    expect(res.bloquesCreados).toBe(2)
    const ejercicio = tx.bloque.create.mock.calls[0]?.[0] as {
      data: { tipo: string; esEvaluable: boolean; skillQueMideId: string | null }
    }
    const tests = tx.bloque.create.mock.calls[1]?.[0] as {
      data: { tipo: string; esEvaluable: boolean; contenido: { sqlEjercicioId: string } }
    }
    expect(ejercicio.data.tipo).toBe("SQL_EJERCICIO")
    expect(ejercicio.data.esEvaluable).toBe(true)
    expect(ejercicio.data.skillQueMideId).toBe("skill-9")
    expect(tests.data.tipo).toBe("SQL_TESTS")
    expect(tests.data.esEvaluable).toBe(false)
    expect(tests.data.contenido.sqlEjercicioId).toBe("bloq-1")
  })

  it("P2002 dentro de la transacción: se mapea a ConflictException CONFLICT", async () => {
    vi.mocked(parsearCursoMd).mockReturnValue(buildParsedInput())
    prisma.cliente.findFirst.mockResolvedValue({ id: "cliente-1" })
    prisma.$transaction.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique violation", {
        code: "P2002",
        clientVersion: "x",
      }),
    )

    try {
      await service.importar({ contenidoMd: "# Curso\n..." })
      throw new Error("expected throw")
    } catch (error) {
      expect(error).toBeInstanceOf(ConflictException)
      const r = (error as ConflictException).getResponse() as { code: string }
      expect(r.code).toBe(apiErrorCodes.conflict)
    }
  })
})
