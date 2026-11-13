import { BadRequestException, ConflictException, NotFoundException } from "@nestjs/common"
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
  area: { upsert: ReturnType<typeof vi.fn> }
  skill: { upsert: ReturnType<typeof vi.fn> }
  curso: {
    create: ReturnType<typeof vi.fn>
    findUnique: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
  }
  modulo: { create: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> }
  historicoEstadoModulo: { create: ReturnType<typeof vi.fn> }
  seccion: { create: ReturnType<typeof vi.fn> }
  seccionSkill: { createMany: ReturnType<typeof vi.fn> }
  bloque: { create: ReturnType<typeof vi.fn> }
  cursoModuloHabilitado: {
    createMany: ReturnType<typeof vi.fn>
    findMany: ReturnType<typeof vi.fn>
    deleteMany: ReturnType<typeof vi.fn>
    count: ReturnType<typeof vi.fn>
  }
  cursoSkillExigida: { createMany: ReturnType<typeof vi.fn>; deleteMany: ReturnType<typeof vi.fn> }
  cursoAreaExigida: { create: ReturnType<typeof vi.fn>; deleteMany: ReturnType<typeof vi.fn> }
  logCambioCurso: { create: ReturnType<typeof vi.fn> }
}

interface MockPrisma {
  cliente: { findMany: ReturnType<typeof vi.fn> }
  curso: { findMany: ReturnType<typeof vi.fn> }
  $transaction: ReturnType<typeof vi.fn>
}

// El id de skill se deriva de la etiqueta para poder verificar el mapeo
// etiqueta → SeccionSkill → CursoSkillExigida en las aserciones.
const ADMIN_ID = "9000000a-0000-0000-0000-000000000001"

const CLIENTES = [
  { id: "cliente-1", nombre: "NTT Data Iberia" },
  { id: "cliente-2", nombre: "NTT Data — Frontend Practice" },
]

function skillIdDe(etiqueta: string): string {
  return `skill:${etiqueta}`
}

function buildTxMock(): MockTx {
  return {
    area: { upsert: vi.fn().mockResolvedValue({ id: "area-1" }) },
    skill: {
      upsert: vi.fn().mockImplementation(async (args: { where: { etiquetaVisible: string } }) => ({
        id: skillIdDe(args.where.etiquetaVisible),
      })),
    },
    curso: {
      create: vi.fn().mockResolvedValue({ id: "curso-1" }),
      findUnique: vi.fn(),
      update: vi.fn().mockResolvedValue({}),
    },
    modulo: {
      create: vi.fn().mockResolvedValue({ id: "mod-1" }),
      update: vi.fn().mockResolvedValue({}),
    },
    historicoEstadoModulo: { create: vi.fn().mockResolvedValue({}) },
    seccion: { create: vi.fn().mockResolvedValue({ id: "sec-1" }) },
    seccionSkill: { createMany: vi.fn().mockResolvedValue({ count: 0 }) },
    bloque: { create: vi.fn().mockResolvedValue({ id: "bloq-1" }) },
    cursoModuloHabilitado: {
      createMany: vi.fn().mockResolvedValue({ count: 0 }),
      findMany: vi.fn().mockResolvedValue([]),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      count: vi.fn().mockResolvedValue(0),
    },
    cursoSkillExigida: {
      createMany: vi.fn().mockResolvedValue({ count: 0 }),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    cursoAreaExigida: {
      create: vi.fn().mockResolvedValue(undefined),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    logCambioCurso: { create: vi.fn().mockResolvedValue({}) },
  }
}

function buildPrismaMock(tx: MockTx): MockPrisma {
  const mock: MockPrisma = {
    cliente: { findMany: vi.fn() },
    // Default: no hay otro curso con el mismo titulo.
    curso: { findMany: vi.fn().mockResolvedValue([]) },
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

/**
 * Módulo con una skill concreta y dos secciones "sin concreta propia" (una con
 * solo un quiz fundacional, otra de lectura pura). Sirve para verificar que el
 * representante del módulo se hereda a las lecturas y que la fundacional queda
 * fuera de las exigidas.
 */
function buildParsedInputModuloConHerencia(): ImportarCursoInput {
  return {
    curso: {
      titulo: "Curso herencia",
      cliente: "NTT Data Iberia",
      fechaInicio: "2026-01-01",
      fechaDeadline: "2026-12-31",
    },
    modulos: [
      {
        titulo: "TypeScript",
        descripcion: "",
        secciones: [
          {
            titulo: "Reto narrowing",
            bloques: [
              {
                tipo: "CODIGO",
                contenidoReto: {
                  lenguaje: "typescript",
                  enunciado: "Narrowing",
                  esqueletoInicial: "",
                  tiempoLimiteSeg: 30,
                },
                solucionReferencia: "",
                tests: [
                  { id: "t1", descripcion: "", entrada: "1", salidaEsperada: "1", visible: true },
                ],
                skillEtiqueta: "TypeScript · Narrowing y control de flujo",
              },
            ],
          },
          {
            titulo: "Quiz fundacional",
            bloques: [
              {
                tipo: "QUIZ",
                contenido: {
                  pregunta: "¿Qué es narrowing?",
                  opciones: [
                    { id: "a", texto: "A", esCorrecta: true },
                    { id: "b", texto: "B", esCorrecta: false },
                  ],
                },
                skillEtiqueta: "TypeScript · Fundamentos senior",
              },
            ],
          },
          {
            titulo: "Lectura pura",
            bloques: [
              {
                tipo: "PARRAFO",
                contenido: { html: "<p>texto</p>", textoPlano: "texto", tiempoLecturaMin: 1 },
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
  it("happy path: persiste curso + módulo + sección + bloque y área exigida", async () => {
    vi.mocked(parsearCursoMd).mockReturnValue(buildParsedInput())
    prisma.cliente.findMany.mockResolvedValue(CLIENTES)

    const res = await service.importar({ contenidoMd: "# Curso\n..." }, ADMIN_ID)

    expect(res).toEqual({
      cursoId: "curso-1",
      modulosCreados: 1,
      seccionesCreadas: 1,
      bloquesCreados: 1,
    })
    expect(tx.area.upsert).toHaveBeenCalledTimes(1)
    expect(tx.curso.create).toHaveBeenCalledTimes(1)
    expect(tx.modulo.create).toHaveBeenCalledTimes(1)
    expect(tx.seccion.create).toHaveBeenCalledTimes(1)
    expect(tx.bloque.create).toHaveBeenCalledTimes(1)
    expect(tx.cursoModuloHabilitado.createMany).toHaveBeenCalledWith({
      data: [{ cursoId: "curso-1", moduloId: "mod-1", orden: 0 }],
    })
    // Sección de sólo lectura sin skills → sin SeccionSkill ni exigidas, pero
    // el área exigida se crea siempre (curso publicable).
    expect(tx.seccionSkill.createMany).not.toHaveBeenCalled()
    expect(tx.cursoSkillExigida.createMany).not.toHaveBeenCalled()
    expect(tx.cursoAreaExigida.create).toHaveBeenCalledTimes(1)
    expect(tx.cursoAreaExigida.create).toHaveBeenCalledWith({
      data: { cursoId: "curso-1", areaId: "area-1", peso: 100, puntajeObjetivo: 60 },
    })
  })

  it("cliente no encontrado: lanza NotFoundException CLIENTE_NO_ENCONTRADO sin abrir transacción", async () => {
    vi.mocked(parsearCursoMd).mockReturnValue(buildParsedInput())
    prisma.cliente.findMany.mockResolvedValue(CLIENTES.slice(1))

    try {
      await service.importar({ contenidoMd: "# Curso\n..." }, ADMIN_ID)
      throw new Error("expected throw")
    } catch (error) {
      expect(error).toBeInstanceOf(NotFoundException)
      const r = (error as NotFoundException).getResponse() as { code: string }
      expect(r.code).toBe(apiErrorCodes.clienteNoEncontrado)
    }
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })

  it("skill declarada: la asegura (upsert) y setea skillQueMideId en el CODIGO_PREGUNTAS", async () => {
    vi.mocked(parsearCursoMd).mockReturnValue(
      buildParsedInputConCodigo("TypeScript · Narrowing y control de flujo"),
    )
    prisma.cliente.findMany.mockResolvedValue(CLIENTES)

    const res = await service.importar({ contenidoMd: "# Curso\n..." }, ADMIN_ID)

    expect(res.bloquesCreados).toBe(2)
    expect(tx.skill.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { etiquetaVisible: "TypeScript · Narrowing y control de flujo" },
        create: { etiquetaVisible: "TypeScript · Narrowing y control de flujo", areaId: "area-1" },
      }),
    )
    const primeraCreacion = tx.bloque.create.mock.calls[0]?.[0] as {
      data: { tipo: string; skillQueMideId: string | null }
    }
    expect(primeraCreacion.data.tipo).toBe("CODIGO_PREGUNTAS")
    expect(primeraCreacion.data.skillQueMideId).toBe(
      skillIdDe("TypeScript · Narrowing y control de flujo"),
    )
  })

  it("skill nueva: se auto-crea bajo el área del curso (no falla)", async () => {
    vi.mocked(parsearCursoMd).mockReturnValue(buildParsedInputConCodigo("Skill totalmente nueva"))
    prisma.cliente.findMany.mockResolvedValue(CLIENTES)

    const res = await service.importar({ contenidoMd: "# Curso\n..." }, ADMIN_ID)

    expect(res.bloquesCreados).toBe(2)
    expect(tx.skill.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { etiquetaVisible: "Skill totalmente nueva" },
        create: { etiquetaVisible: "Skill totalmente nueva", areaId: "area-1" },
      }),
    )
  })

  it("bloque SQL: crea SQL_EJERCICIO + SQL_TESTS y setea skillQueMideId en el ejercicio", async () => {
    vi.mocked(parsearCursoMd).mockReturnValue(buildParsedInputConSql("Postgres · Modelado y JOINs"))
    prisma.cliente.findMany.mockResolvedValue(CLIENTES)

    const res = await service.importar({ contenidoMd: "# Curso\n..." }, ADMIN_ID)

    expect(res.bloquesCreados).toBe(2)
    const ejercicio = tx.bloque.create.mock.calls[0]?.[0] as {
      data: { tipo: string; esEvaluable: boolean; skillQueMideId: string | null }
    }
    const tests = tx.bloque.create.mock.calls[1]?.[0] as {
      data: { tipo: string; esEvaluable: boolean; contenido: { sqlEjercicioId: string } }
    }
    expect(ejercicio.data.tipo).toBe("SQL_EJERCICIO")
    expect(ejercicio.data.esEvaluable).toBe(true)
    expect(ejercicio.data.skillQueMideId).toBe(skillIdDe("Postgres · Modelado y JOINs"))
    expect(tests.data.tipo).toBe("SQL_TESTS")
    expect(tests.data.esEvaluable).toBe(false)
    expect(tests.data.contenido.sqlEjercicioId).toBe("bloq-1")
  })

  it("herencia de skill: lecturas y quiz fundacional heredan la concreta; la fundacional queda fuera de exigidas", async () => {
    vi.mocked(parsearCursoMd).mockReturnValue(buildParsedInputModuloConHerencia())
    prisma.cliente.findMany.mockResolvedValue(CLIENTES)

    await service.importar({ contenidoMd: "# Curso\n..." }, ADMIN_ID)

    const concreta = "TypeScript · Narrowing y control de flujo"
    const fundacional = "TypeScript · Fundamentos senior"

    // Ambas skills se aseguran (las dos están declaradas por bloques).
    const etiquetasUpsert = tx.skill.upsert.mock.calls.map(
      (c) => (c[0] as { where: { etiquetaVisible: string } }).where.etiquetaVisible,
    )
    expect(etiquetasUpsert).toEqual(expect.arrayContaining([concreta, fundacional]))

    // Las 3 secciones reciben SeccionSkill = la concreta (representante).
    const seccionSkillData = tx.seccionSkill.createMany.mock.calls[0]?.[0] as {
      data: { skillId: string }[]
    }
    expect(seccionSkillData.data.map((r) => r.skillId)).toEqual([
      skillIdDe(concreta),
      skillIdDe(concreta),
      skillIdDe(concreta),
    ])

    // Sólo la concreta entra en exigidas (la fundacional no), con notaMinima 60.
    const exigidasData = tx.cursoSkillExigida.createMany.mock.calls[0]?.[0] as {
      data: { skillId: string; notaMinima: number }[]
    }
    expect(exigidasData.data).toEqual([
      { cursoId: "curso-1", skillId: skillIdDe(concreta), notaMinima: 60 },
    ])
  })

  it("módulo sólo fundacional: su fundacional es el representante y entra en exigidas", async () => {
    vi.mocked(parsearCursoMd).mockReturnValue(
      buildParsedInputConCodigo("Arquitectura del panel · Fundamentos"),
    )
    prisma.cliente.findMany.mockResolvedValue(CLIENTES)

    await service.importar({ contenidoMd: "# Curso\n..." }, ADMIN_ID)

    expect(tx.seccionSkill.createMany).toHaveBeenCalledWith({
      data: [{ seccionId: "sec-1", skillId: skillIdDe("Arquitectura del panel · Fundamentos") }],
    })
    expect(tx.cursoSkillExigida.createMany).toHaveBeenCalledWith({
      data: [
        {
          cursoId: "curso-1",
          skillId: skillIdDe("Arquitectura del panel · Fundamentos"),
          notaMinima: 60,
        },
      ],
    })
  })

  it("P2002 dentro de la transacción: se mapea a ConflictException CONFLICT", async () => {
    vi.mocked(parsearCursoMd).mockReturnValue(buildParsedInput())
    prisma.cliente.findMany.mockResolvedValue(CLIENTES)
    prisma.$transaction.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique violation", {
        code: "P2002",
        clientVersion: "x",
      }),
    )

    try {
      await service.importar({ contenidoMd: "# Curso\n..." }, ADMIN_ID)
      throw new Error("expected throw")
    } catch (error) {
      expect(error).toBeInstanceOf(ConflictException)
      const r = (error as ConflictException).getResponse() as { code: string }
      expect(r.code).toBe(apiErrorCodes.conflict)
    }
  })

  it("P2003 dentro de la transacción: se mapea a BadRequestException INVALID_BODY", async () => {
    vi.mocked(parsearCursoMd).mockReturnValue(buildParsedInput())
    prisma.cliente.findMany.mockResolvedValue(CLIENTES)
    prisma.$transaction.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("FK violation", {
        code: "P2003",
        clientVersion: "x",
      }),
    )

    try {
      await service.importar({ contenidoMd: "# Curso\n..." }, ADMIN_ID)
      throw new Error("expected throw")
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException)
      const r = (error as BadRequestException).getResponse() as { code: string }
      expect(r.code).toBe(apiErrorCodes.invalidBody)
    }
  })
  it("cliente escrito distinto (mayúsculas, tildes, guion): lo encuentra igual", async () => {
    const input = buildParsedInput()
    vi.mocked(parsearCursoMd).mockReturnValue({
      ...input,
      curso: { ...input.curso, cliente: "ntt data - frontend práctice" },
    })
    prisma.cliente.findMany.mockResolvedValue(CLIENTES)

    await service.importar({ contenidoMd: "# Curso\n..." }, ADMIN_ID)

    expect(tx.curso.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ clienteId: "cliente-2" }) }),
    )
  })

  it("cliente no encontrado: el mensaje lista los clientes que sí existen", async () => {
    vi.mocked(parsearCursoMd).mockReturnValue(buildParsedInput())
    prisma.cliente.findMany.mockResolvedValue(CLIENTES.slice(1))

    await expect(service.importar({ contenidoMd: "# Curso\n..." }, ADMIN_ID)).rejects.toMatchObject(
      {
        response: { message: expect.stringContaining("NTT Data — Frontend Practice") },
      },
    )
  })

  it("evaluable sin skill: recibe la skill «curso · módulo» y el curso entra al plan", async () => {
    vi.mocked(parsearCursoMd).mockReturnValue(buildParsedInputConCodigo())
    prisma.cliente.findMany.mockResolvedValue(CLIENTES)

    await service.importar({ contenidoMd: "# Curso\n..." }, ADMIN_ID)

    const etiqueta = "Curso con reto · Modulo uno"
    expect(tx.bloque.create.mock.calls[0]?.[0]).toMatchObject({
      data: { skillQueMideId: skillIdDe(etiqueta) },
    })
    expect(tx.seccionSkill.createMany).toHaveBeenCalledWith({
      data: [{ seccionId: "sec-1", skillId: skillIdDe(etiqueta) }],
    })
    expect(tx.cursoSkillExigida.createMany).toHaveBeenCalledWith({
      data: [{ cursoId: "curso-1", skillId: skillIdDe(etiqueta), notaMinima: 60 }],
    })
  })
})

// Aviso antes de duplicar (2A, 13-11-2026): si ya existe un curso con el mismo
// titulo, la importacion no crea nada hasta que el admin lo confirme.
describe("ImportarCursoService.importar — titulo ya existente", () => {
  const existente = { id: "curso-viejo", titulo: "Curso de prueba", estado: "ACTIVO" }
  const filaExistente = { ...existente, _count: { asignaciones: 0, intentosBloque: 0 } }

  it("sin confirmar: 409 CURSO_TITULO_DUPLICADO con los cursos existentes y sin transaccion", async () => {
    vi.mocked(parsearCursoMd).mockReturnValue(buildParsedInput())
    prisma.cliente.findMany.mockResolvedValue(CLIENTES)
    prisma.curso.findMany.mockResolvedValue([filaExistente])

    try {
      await service.importar({ contenidoMd: "# Curso\n..." }, ADMIN_ID)
      throw new Error("expected throw")
    } catch (error) {
      expect(error).toBeInstanceOf(ConflictException)
      const r = (error as ConflictException).getResponse() as {
        code: string
        details: { cursosExistentes: unknown }
      }
      expect(r.code).toBe(apiErrorCodes.cursoTituloDuplicado)
      // ACTIVO: no se puede reemplazar (solo BORRADOR sin personas).
      expect(r.details.cursosExistentes).toEqual([{ ...existente, reemplazable: false }])
    }
    expect(prisma.curso.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { titulo: { equals: "Curso de prueba", mode: "insensitive" } },
      }),
    )
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })

  it("con confirmarDuplicado=true: crea el curso igual", async () => {
    vi.mocked(parsearCursoMd).mockReturnValue(buildParsedInput())
    prisma.cliente.findMany.mockResolvedValue(CLIENTES)
    prisma.curso.findMany.mockResolvedValue([filaExistente])

    const res = await service.importar(
      { contenidoMd: "# Curso\n...", confirmarDuplicado: true },
      ADMIN_ID,
    )

    expect(res.cursoId).toBe("curso-1")
    expect(tx.curso.create).toHaveBeenCalledTimes(1)
  })
})

// Reemplazar un curso en borrador y sin personas (2B, 13-11-2026). Mismo
// curso (mismo id y configuracion): se quita el contenido viejo, se archivan
// los modulos que eran solo suyos, se desenganchan los compartidos y se carga
// el contenido nuevo. Todo en una transaccion, con registro en el log.
describe("ImportarCursoService.importar — reemplazar un curso", () => {
  const cursoViejo = "c0000000-0000-0000-0000-00000000beef"

  function cursoEnTx(estado: string, asignaciones = 0, intentosBloque = 0): void {
    tx.curso.findUnique.mockResolvedValue({
      id: cursoViejo,
      estado,
      _count: { asignaciones, intentosBloque },
    })
  }

  beforeEach(() => {
    vi.mocked(parsearCursoMd).mockReturnValue(buildParsedInput())
    prisma.cliente.findMany.mockResolvedValue(CLIENTES)
  })

  it("en borrador y sin personas: reemplaza en el mismo curso, archiva el modulo exclusivo y registra", async () => {
    cursoEnTx("BORRADOR")
    tx.cursoModuloHabilitado.findMany.mockResolvedValue([
      { moduloId: "mod-exclusivo" },
      { moduloId: "mod-compartido" },
    ])
    // Tras quitar las habilitaciones del curso, el compartido sigue en otro.
    tx.cursoModuloHabilitado.count.mockImplementation(
      async (args: { where: { moduloId: string } }) =>
        args.where.moduloId === "mod-compartido" ? 1 : 0,
    )

    const res = await service.importar(
      { contenidoMd: "# Curso\n...", reemplazarCursoId: cursoViejo },
      ADMIN_ID,
    )

    expect(res).toEqual({
      cursoId: cursoViejo,
      modulosCreados: 1,
      seccionesCreadas: 1,
      bloquesCreados: 1,
      reemplazado: true,
      modulosArchivados: 1,
    })
    // No se busca titulo repetido ni se crea otro curso.
    expect(prisma.curso.findMany).not.toHaveBeenCalled()
    expect(tx.curso.create).not.toHaveBeenCalled()
    expect(tx.curso.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: cursoViejo },
        data: expect.objectContaining({ titulo: "Curso de prueba", clienteId: "cliente-1" }),
      }),
    )
    expect(tx.cursoModuloHabilitado.deleteMany).toHaveBeenCalledWith({
      where: { cursoId: cursoViejo },
    })
    expect(tx.cursoSkillExigida.deleteMany).toHaveBeenCalledWith({ where: { cursoId: cursoViejo } })
    expect(tx.cursoAreaExigida.deleteMany).toHaveBeenCalledWith({ where: { cursoId: cursoViejo } })
    // Solo el exclusivo se archiva, con su historico.
    expect(tx.modulo.update).toHaveBeenCalledTimes(1)
    expect(tx.modulo.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "mod-exclusivo", estado: "ACTIVO" },
        data: { estado: "ARCHIVADO" },
      }),
    )
    expect(tx.historicoEstadoModulo.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        moduloId: "mod-exclusivo",
        estadoAnterior: "ACTIVO",
        estadoNuevo: "ARCHIVADO",
        autorUsuarioId: ADMIN_ID,
      }),
    })
    // El contenido nuevo cuelga del mismo curso.
    expect(tx.cursoModuloHabilitado.createMany).toHaveBeenCalledWith({
      data: [{ cursoId: cursoViejo, moduloId: "mod-1", orden: 0 }],
    })
    expect(tx.logCambioCurso.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        cursoId: cursoViejo,
        autorUsuarioId: ADMIN_ID,
        accion: "CAMBIO_MODULOS",
      }),
    })
  })

  it.each([
    ["curso ACTIVO", "ACTIVO", 0, 0],
    ["con asignaciones", "BORRADOR", 2, 0],
    ["con intentos", "BORRADOR", 0, 3],
  ])("%s: 409 CURSO_NO_REEMPLAZABLE y no toca nada", async (_n, estado, asig, intentos) => {
    cursoEnTx(estado, asig, intentos)

    await expect(
      service.importar({ contenidoMd: "# Curso\n...", reemplazarCursoId: cursoViejo }, ADMIN_ID),
    ).rejects.toMatchObject({ response: { code: apiErrorCodes.cursoNoReemplazable } })
    expect(tx.cursoModuloHabilitado.deleteMany).not.toHaveBeenCalled()
    expect(tx.curso.update).not.toHaveBeenCalled()
  })

  it("curso inexistente: 404 CURSO_NO_ENCONTRADO", async () => {
    tx.curso.findUnique.mockResolvedValue(null)

    await expect(
      service.importar({ contenidoMd: "# Curso\n...", reemplazarCursoId: cursoViejo }, ADMIN_ID),
    ).rejects.toBeInstanceOf(NotFoundException)
  })

  it("el aviso de titulo repetido marca reemplazable solo al borrador sin personas", async () => {
    prisma.curso.findMany.mockResolvedValue([
      {
        id: "a",
        titulo: "Curso de prueba",
        estado: "BORRADOR",
        _count: { asignaciones: 0, intentosBloque: 0 },
      },
      {
        id: "b",
        titulo: "Curso de prueba",
        estado: "BORRADOR",
        _count: { asignaciones: 1, intentosBloque: 0 },
      },
    ])

    await expect(service.importar({ contenidoMd: "# Curso\n..." }, ADMIN_ID)).rejects.toMatchObject(
      {
        response: {
          details: {
            cursosExistentes: [
              { id: "a", titulo: "Curso de prueba", estado: "BORRADOR", reemplazable: true },
              { id: "b", titulo: "Curso de prueba", estado: "BORRADOR", reemplazable: false },
            ],
          },
        },
      },
    )
  })
})
