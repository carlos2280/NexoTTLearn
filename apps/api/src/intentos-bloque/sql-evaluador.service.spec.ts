import { BadRequestException, InternalServerErrorException } from "@nestjs/common"
import { Test, type TestingModule } from "@nestjs/testing"
import type { ResultadoTestSqlReportado } from "@nexott-learn/shared-types"
import { describe, expect, it, vi } from "vitest"
import { PrismaService } from "../common/prisma/prisma.service"
import { SqlEvaluadorService } from "./sql-evaluador.service"

const BLOQUE_EJERCICIO_ID = "b0000000-0000-0000-0000-000000000020"
const BLOQUE_TESTS_ID = "b0000000-0000-0000-0000-000000000021"
const SECCION_ID = "22222222-2222-2222-2222-222222222222"

const CONTENIDO_EJERCICIO_OK = {
  enunciado: "Lista los ids de usuarios activos.",
  esquemaSemilla: "CREATE TABLE u (id int, activo boolean);",
  consultaInicial: "",
  tiempoLimiteSeg: 30,
}

const TESTS_OK = [
  {
    id: "t1",
    descripcion: "caso base",
    visible: true,
    esquemaSemilla: "",
    consultaReferencia: "SELECT id FROM u WHERE activo",
    ordenImporta: false,
  },
  {
    id: "t2",
    descripcion: "otra semilla",
    visible: false,
    esquemaSemilla: "CREATE TABLE u (id int, activo boolean);",
    consultaReferencia: "SELECT id FROM u WHERE activo",
    ordenImporta: false,
  },
]

function reportado(testId: string, paso: boolean): ResultadoTestSqlReportado {
  return {
    testId,
    paso,
    estado: paso ? "ok" : "fallo",
    filasObtenidas: paso ? "[[1]]" : "[]",
    error: "",
    duracionMs: 8,
  }
}

function buildPrismaMock(testsContenido: unknown) {
  return {
    bloque: {
      findMany: vi.fn().mockResolvedValue([{ id: BLOQUE_TESTS_ID, contenido: testsContenido }]),
    },
  }
}

async function buildModule(prisma: ReturnType<typeof buildPrismaMock>): Promise<TestingModule> {
  return await Test.createTestingModule({
    providers: [
      {
        provide: SqlEvaluadorService,
        useFactory: (p: PrismaService) => new SqlEvaluadorService(p),
        inject: [PrismaService],
      },
      { provide: PrismaService, useValue: prisma },
    ],
  }).compile()
}

const CONTENIDO_TESTS_OK = {
  sqlEjercicioId: BLOQUE_EJERCICIO_ID,
  tests: TESTS_OK,
}

describe("SqlEvaluadorService", () => {
  it("nota 100 cuando el cliente reporta todos los tests pasados", async () => {
    const moduleRef = await buildModule(buildPrismaMock(CONTENIDO_TESTS_OK))
    const evaluador = moduleRef.get(SqlEvaluadorService)

    const resultado = await evaluador.evaluar({
      bloque: { id: BLOQUE_EJERCICIO_ID, seccionId: SECCION_ID, contenido: CONTENIDO_EJERCICIO_OK },
      consultaEnviada: "SELECT id FROM u WHERE activo",
      resultadosReportados: [reportado("t1", true), reportado("t2", true)],
    })

    expect(resultado.calculo).toEqual({
      nota: 100,
      puntosObtenidos: 2,
      puntosTotales: 2,
      preguntasFalladasIds: [],
    })
  })

  it("nota parcial cuando solo algunos tests pasan", async () => {
    const moduleRef = await buildModule(buildPrismaMock(CONTENIDO_TESTS_OK))
    const evaluador = moduleRef.get(SqlEvaluadorService)

    const resultado = await evaluador.evaluar({
      bloque: { id: BLOQUE_EJERCICIO_ID, seccionId: SECCION_ID, contenido: CONTENIDO_EJERCICIO_OK },
      consultaEnviada: "SELECT id FROM u",
      resultadosReportados: [reportado("t1", true), reportado("t2", false)],
    })

    expect(resultado.calculo.nota).toBe(50)
    expect(resultado.calculo.puntosObtenidos).toBe(1)
  })

  it("usa autoritativamente descripcion y visible del bloque SQL_TESTS", async () => {
    const moduleRef = await buildModule(buildPrismaMock(CONTENIDO_TESTS_OK))
    const evaluador = moduleRef.get(SqlEvaluadorService)

    const resultado = await evaluador.evaluar({
      bloque: { id: BLOQUE_EJERCICIO_ID, seccionId: SECCION_ID, contenido: CONTENIDO_EJERCICIO_OK },
      consultaEnviada: "SELECT id FROM u WHERE activo",
      resultadosReportados: [reportado("t1", true), reportado("t2", true)],
    })

    expect(resultado.resultadosTests[0]?.descripcion).toBe("caso base")
    expect(resultado.resultadosTests[1]?.visible).toBe(false)
  })

  it("400 si falta el resultado de algun testId (cobertura incompleta)", async () => {
    const moduleRef = await buildModule(buildPrismaMock(CONTENIDO_TESTS_OK))
    const evaluador = moduleRef.get(SqlEvaluadorService)

    await expect(
      evaluador.evaluar({
        bloque: {
          id: BLOQUE_EJERCICIO_ID,
          seccionId: SECCION_ID,
          contenido: CONTENIDO_EJERCICIO_OK,
        },
        consultaEnviada: "SELECT 1",
        resultadosReportados: [reportado("t1", true)],
      }),
    ).rejects.toBeInstanceOf(BadRequestException)
  })

  it("400 si reporta un testId inexistente o duplicado", async () => {
    const moduleRef = await buildModule(buildPrismaMock(CONTENIDO_TESTS_OK))
    const evaluador = moduleRef.get(SqlEvaluadorService)

    await expect(
      evaluador.evaluar({
        bloque: {
          id: BLOQUE_EJERCICIO_ID,
          seccionId: SECCION_ID,
          contenido: CONTENIDO_EJERCICIO_OK,
        },
        consultaEnviada: "SELECT 1",
        resultadosReportados: [reportado("t1", true), reportado("t1", false)],
      }),
    ).rejects.toBeInstanceOf(BadRequestException)
  })

  it("500 si el contenido del ejercicio es invalido", async () => {
    const moduleRef = await buildModule(buildPrismaMock(CONTENIDO_TESTS_OK))
    const evaluador = moduleRef.get(SqlEvaluadorService)

    await expect(
      evaluador.evaluar({
        bloque: { id: BLOQUE_EJERCICIO_ID, seccionId: SECCION_ID, contenido: { campos: "vacios" } },
        consultaEnviada: "SELECT 1",
        resultadosReportados: [reportado("t1", true), reportado("t2", true)],
      }),
    ).rejects.toBeInstanceOf(InternalServerErrorException)
  })

  it("500 si no existe bloque SQL_TESTS hermano que apunte a este reto", async () => {
    const prisma = { bloque: { findMany: vi.fn().mockResolvedValue([]) } }
    const moduleRef = await buildModule(prisma)
    const evaluador = moduleRef.get(SqlEvaluadorService)

    await expect(
      evaluador.evaluar({
        bloque: {
          id: BLOQUE_EJERCICIO_ID,
          seccionId: SECCION_ID,
          contenido: CONTENIDO_EJERCICIO_OK,
        },
        consultaEnviada: "SELECT 1",
        resultadosReportados: [reportado("t1", true), reportado("t2", true)],
      }),
    ).rejects.toBeInstanceOf(InternalServerErrorException)
  })
})
