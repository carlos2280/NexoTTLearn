import { BadRequestException, InternalServerErrorException } from "@nestjs/common"
import type { TestingModule } from "@nestjs/testing"
import { Test } from "@nestjs/testing"
import type { ResultadoTestReportado } from "@nexott-learn/shared-types"
import { describe, expect, it, vi } from "vitest"
import { PrismaService } from "../common/prisma/prisma.service"
import { CodigoEvaluadorService } from "./codigo-evaluador.service"

const BLOQUE_PREGUNTAS_ID = "b0000000-0000-0000-0000-000000000010"
const BLOQUE_TESTS_ID = "b0000000-0000-0000-0000-000000000011"
const SECCION_ID = "22222222-2222-2222-2222-222222222221"

const CONTENIDO_PREGUNTAS_OK = {
  lenguaje: "typescript",
  enunciado: "Suma dos numeros leidos por stdin separados por espacio.",
  esqueletoInicial: "// completa aqui",
  tiempoLimiteSeg: 5,
}

const TESTS_OK = [
  { id: "t1", descripcion: "suma simple", entrada: "2 3", salidaEsperada: "5", visible: true },
  { id: "t2", descripcion: "con cero", entrada: "0 7", salidaEsperada: "7", visible: true },
  { id: "t3", descripcion: "negativos", entrada: "-1 1", salidaEsperada: "0", visible: false },
]

function reportado(testId: string, paso: boolean): ResultadoTestReportado {
  return {
    testId,
    paso,
    estado: paso ? "ok" : "fallo",
    stdoutObtenido: paso ? "ok" : "wrong",
    stderr: "",
    duracionMs: 12,
  }
}

function buildPrismaMock(testsContenido: unknown) {
  return {
    bloque: {
      findMany: vi.fn().mockResolvedValue([
        {
          id: BLOQUE_TESTS_ID,
          contenido: testsContenido,
        },
      ]),
    },
  }
}

async function buildModule(prisma: ReturnType<typeof buildPrismaMock>): Promise<TestingModule> {
  return await Test.createTestingModule({
    providers: [
      {
        provide: CodigoEvaluadorService,
        useFactory: (p: PrismaService) => new CodigoEvaluadorService(p),
        inject: [PrismaService],
      },
      { provide: PrismaService, useValue: prisma },
    ],
  }).compile()
}

describe("CodigoEvaluadorService", () => {
  it("nota 100 cuando el cliente reporta todos los tests como pasados", async () => {
    const prisma = buildPrismaMock({
      codigoPreguntasId: BLOQUE_PREGUNTAS_ID,
      solucionReferencia: "",
      tests: TESTS_OK,
    })
    const moduleRef = await buildModule(prisma)
    const evaluador = moduleRef.get(CodigoEvaluadorService)

    const resultado = await evaluador.evaluar({
      bloque: {
        id: BLOQUE_PREGUNTAS_ID,
        seccionId: SECCION_ID,
        contenido: CONTENIDO_PREGUNTAS_OK,
      },
      codigoEnviado: "// codigo del participante",
      resultadosReportados: [reportado("t1", true), reportado("t2", true), reportado("t3", true)],
    })

    expect(resultado.calculo).toEqual({
      nota: 100,
      puntosObtenidos: 3,
      puntosTotales: 3,
      preguntasFalladasIds: [],
    })
    expect(resultado.lenguaje).toBe("typescript")
    expect(resultado.resultadosTests.every((r) => r.paso)).toBe(true)
  })

  it("nota parcial cuando el cliente reporta solo algunos tests pasados", async () => {
    const prisma = buildPrismaMock({
      codigoPreguntasId: BLOQUE_PREGUNTAS_ID,
      solucionReferencia: "",
      tests: TESTS_OK,
    })
    const moduleRef = await buildModule(prisma)
    const evaluador = moduleRef.get(CodigoEvaluadorService)

    const resultado = await evaluador.evaluar({
      bloque: { id: BLOQUE_PREGUNTAS_ID, seccionId: SECCION_ID, contenido: CONTENIDO_PREGUNTAS_OK },
      codigoEnviado: "// participante",
      resultadosReportados: [reportado("t1", true), reportado("t2", false), reportado("t3", false)],
    })

    expect(resultado.calculo).toEqual({
      nota: 33.33,
      puntosObtenidos: 1,
      puntosTotales: 3,
      preguntasFalladasIds: [],
    })
    const [r1, r2, r3] = resultado.resultadosTests
    expect(r1?.paso).toBe(true)
    expect(r2?.paso).toBe(false)
    expect(r3?.paso).toBe(false)
  })

  it("propaga el estado reportado por el cliente (timeout/fallo) al persistido", async () => {
    const prisma = buildPrismaMock({
      codigoPreguntasId: BLOQUE_PREGUNTAS_ID,
      solucionReferencia: "",
      tests: TESTS_OK,
    })
    const moduleRef = await buildModule(prisma)
    const evaluador = moduleRef.get(CodigoEvaluadorService)

    const resultado = await evaluador.evaluar({
      bloque: { id: BLOQUE_PREGUNTAS_ID, seccionId: SECCION_ID, contenido: CONTENIDO_PREGUNTAS_OK },
      codigoEnviado: "// participante",
      resultadosReportados: [
        {
          testId: "t1",
          paso: false,
          estado: "timeout",
          stdoutObtenido: "",
          stderr: "",
          duracionMs: 5000,
        },
        {
          testId: "t2",
          paso: false,
          estado: "timeout",
          stdoutObtenido: "",
          stderr: "",
          duracionMs: 5000,
        },
        {
          testId: "t3",
          paso: false,
          estado: "timeout",
          stdoutObtenido: "",
          stderr: "",
          duracionMs: 5000,
        },
      ],
    })

    expect(resultado.calculo.nota).toBe(0)
    expect(resultado.resultadosTests.every((r) => !r.paso)).toBe(true)
    expect(resultado.resultadosTests.every((r) => r.estado === "timeout")).toBe(true)
  })

  it("400 si faltan resultados para algun testId del bloque (cobertura incompleta)", async () => {
    const prisma = buildPrismaMock({
      codigoPreguntasId: BLOQUE_PREGUNTAS_ID,
      solucionReferencia: "",
      tests: TESTS_OK,
    })
    const moduleRef = await buildModule(prisma)
    const evaluador = moduleRef.get(CodigoEvaluadorService)

    await expect(
      evaluador.evaluar({
        bloque: {
          id: BLOQUE_PREGUNTAS_ID,
          seccionId: SECCION_ID,
          contenido: CONTENIDO_PREGUNTAS_OK,
        },
        codigoEnviado: "// x",
        resultadosReportados: [reportado("t1", true), reportado("t2", true)],
      }),
    ).rejects.toBeInstanceOf(BadRequestException)
  })

  it("400 si el cliente reporta un testId que no existe en el bloque", async () => {
    const prisma = buildPrismaMock({
      codigoPreguntasId: BLOQUE_PREGUNTAS_ID,
      solucionReferencia: "",
      tests: TESTS_OK,
    })
    const moduleRef = await buildModule(prisma)
    const evaluador = moduleRef.get(CodigoEvaluadorService)

    await expect(
      evaluador.evaluar({
        bloque: {
          id: BLOQUE_PREGUNTAS_ID,
          seccionId: SECCION_ID,
          contenido: CONTENIDO_PREGUNTAS_OK,
        },
        codigoEnviado: "// x",
        resultadosReportados: [
          reportado("t1", true),
          reportado("t2", true),
          reportado("t3", true),
          reportado("tFantasma", true),
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException)
  })

  it("400 si el cliente reporta el mismo testId dos veces", async () => {
    const prisma = buildPrismaMock({
      codigoPreguntasId: BLOQUE_PREGUNTAS_ID,
      solucionReferencia: "",
      tests: TESTS_OK,
    })
    const moduleRef = await buildModule(prisma)
    const evaluador = moduleRef.get(CodigoEvaluadorService)

    await expect(
      evaluador.evaluar({
        bloque: {
          id: BLOQUE_PREGUNTAS_ID,
          seccionId: SECCION_ID,
          contenido: CONTENIDO_PREGUNTAS_OK,
        },
        codigoEnviado: "// x",
        resultadosReportados: [
          reportado("t1", true),
          reportado("t1", false),
          reportado("t2", true),
          reportado("t3", true),
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException)
  })

  it("500 si el contenido CODIGO_PREGUNTAS es invalido", async () => {
    const prisma = buildPrismaMock({ tests: TESTS_OK })
    const moduleRef = await buildModule(prisma)
    const evaluador = moduleRef.get(CodigoEvaluadorService)

    await expect(
      evaluador.evaluar({
        bloque: {
          id: BLOQUE_PREGUNTAS_ID,
          seccionId: SECCION_ID,
          contenido: { campos: "vacios" },
        },
        codigoEnviado: "// x",
        resultadosReportados: [reportado("t1", true), reportado("t2", true), reportado("t3", true)],
      }),
    ).rejects.toBeInstanceOf(InternalServerErrorException)
  })

  it("500 si el lenguaje no es ejecutable por los runners (ej. java)", async () => {
    const prisma = buildPrismaMock({
      codigoPreguntasId: BLOQUE_PREGUNTAS_ID,
      solucionReferencia: "",
      tests: TESTS_OK,
    })
    const moduleRef = await buildModule(prisma)
    const evaluador = moduleRef.get(CodigoEvaluadorService)

    await expect(
      evaluador.evaluar({
        bloque: {
          id: BLOQUE_PREGUNTAS_ID,
          seccionId: SECCION_ID,
          contenido: { ...CONTENIDO_PREGUNTAS_OK, lenguaje: "java" },
        },
        codigoEnviado: "// x",
        resultadosReportados: [reportado("t1", true), reportado("t2", true), reportado("t3", true)],
      }),
    ).rejects.toBeInstanceOf(InternalServerErrorException)
  })

  it("500 si no existe bloque CODIGO_TESTS hermano que apunte a este reto", async () => {
    const prisma = {
      bloque: { findMany: vi.fn().mockResolvedValue([]) },
    }
    const moduleRef = await buildModule(prisma)
    const evaluador = moduleRef.get(CodigoEvaluadorService)

    await expect(
      evaluador.evaluar({
        bloque: {
          id: BLOQUE_PREGUNTAS_ID,
          seccionId: SECCION_ID,
          contenido: CONTENIDO_PREGUNTAS_OK,
        },
        codigoEnviado: "// x",
        resultadosReportados: [reportado("t1", true), reportado("t2", true), reportado("t3", true)],
      }),
    ).rejects.toBeInstanceOf(InternalServerErrorException)
  })

  it("usa autoritativamente la salidaEsperada del bloque, no la del cliente", async () => {
    // El cliente puede reportar cualquier `stdoutObtenido`; lo que persistimos
    // como `stdoutEsperado` siempre viene del bloque CODIGO_TESTS para que el
    // admin pueda auditar.
    const prisma = buildPrismaMock({
      codigoPreguntasId: BLOQUE_PREGUNTAS_ID,
      solucionReferencia: "",
      tests: TESTS_OK,
    })
    const moduleRef = await buildModule(prisma)
    const evaluador = moduleRef.get(CodigoEvaluadorService)

    const resultado = await evaluador.evaluar({
      bloque: { id: BLOQUE_PREGUNTAS_ID, seccionId: SECCION_ID, contenido: CONTENIDO_PREGUNTAS_OK },
      codigoEnviado: "// x",
      resultadosReportados: [reportado("t1", true), reportado("t2", true), reportado("t3", true)],
    })

    const persistidos = resultado.resultadosTests
    expect(persistidos[0]?.stdoutEsperado).toBe("5")
    expect(persistidos[1]?.stdoutEsperado).toBe("7")
    expect(persistidos[2]?.stdoutEsperado).toBe("0")
    // Tambien los metadatos `descripcion` y `visible` vienen del bloque.
    expect(persistidos[2]?.visible).toBe(false)
  })
})
