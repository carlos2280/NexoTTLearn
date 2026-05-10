import { ConflictException, NotFoundException } from "@nestjs/common"
import {
  type AjustarEntregaProyectoAdminInput,
  type EvaluarEntregaProyectoAdminInput,
  ajustarEntregaProyectoAdminInputSchema,
  evaluarEntregaProyectoAdminInputSchema,
  listarEntregasProyectoAdminQuerySchema,
} from "@nexott-learn/shared-types"
import { Prisma } from "@prisma/client"
import { describe, expect, it, vi } from "vitest"
import type { PrismaService } from "../../common/prisma/prisma.service"
import type { RecalculoService } from "../recalculo/recalculo.service"
import { calcularNotaFinal } from "./centro-revision-proyectos.mapper"
import { CentroRevisionProyectosService } from "./centro-revision-proyectos.service"

type Stub = ReturnType<typeof vi.fn>

interface PrismaMock {
  entregaProyecto: {
    findUnique: Stub
    findMany: Stub
    count: Stub
    update: Stub
  }
  logActividad: { create: Stub }
  $transaction: Stub
}

function buildPrisma(): PrismaMock {
  const prisma: PrismaMock = {
    entregaProyecto: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
    },
    logActividad: { create: vi.fn() },
    $transaction: vi.fn((arg: unknown) => {
      if (typeof arg === "function") {
        const fn = arg as (tx: PrismaMock) => Promise<unknown>
        return fn(prisma)
      }
      return Promise.all(arg as Promise<unknown>[])
    }),
  }
  return prisma
}

function buildRecalculoMock() {
  return {
    snapshotAgregados: vi.fn().mockResolvedValue({
      notasModulo: new Map(),
      notasArea: new Map(),
      notaCurso: null,
      etiqueta: null,
    }),
    recalcularInscripcionTrasEntregaBloque: vi.fn().mockResolvedValue({ logsEmitidos: 0 }),
    recalcularInscripcionTrasEntregaProyecto: vi.fn().mockResolvedValue({ logsEmitidos: 0 }),
    recalcularInscripcionCompleta: vi.fn().mockResolvedValue({ logsEmitidos: 0 }),
  }
}

function buildService(prisma: PrismaMock = buildPrisma()) {
  const recalculo = buildRecalculoMock()
  const service = new CentroRevisionProyectosService(
    prisma as unknown as PrismaService,
    recalculo as unknown as RecalculoService,
  )
  return { service, prisma, recalculo }
}

const ACTOR_ID = "00000000-0000-0000-0000-000000000001"
const ENTREGA_ID = "00000000-0000-0000-0000-000000000010"
const INSCRIPCION_ID = "00000000-0000-0000-0000-000000000020"
const MINI_ID = "00000000-0000-0000-0000-000000000030"
const TRANSVERSAL_ID = "00000000-0000-0000-0000-000000000031"
const CURSO_ID = "00000000-0000-0000-0000-000000000040"
const PARTICIPANTE_ID = "00000000-0000-0000-0000-000000000050"
const MODULO_ID = "00000000-0000-0000-0000-000000000060"

const NOW = new Date("2026-05-06T10:00:00Z")

type EstadoProyecto = "ENVIADA" | "EN_REVISION" | "EVALUADA"
type EstadoInscripcion = "ACTIVA" | "COMPLETADA" | "ABANDONADA" | "CERRADO_SIN_COMPLETAR"
type EstadoCurso = "BORRADOR" | "ACTIVO" | "CERRADO"

type Tipo = "MINI" | "TRANSVERSAL"

interface RowOverrides {
  id?: string
  estado?: EstadoProyecto
  tipo?: Tipo
  ajustadaManual?: boolean
  intento?: number
  cursoEstado?: EstadoCurso
  inscripcionEstado?: EstadoInscripcion
  notaCapa1?: number | null
  notaCapa2?: number | null
  notaCapa3?: number | null
  notaFinal?: number | null
  pesoCapa1?: number
  pesoCapa2?: number
  pesoCapa3?: number
  pesosAplicados?: { p1: number; p2: number; p3: number } | null
  fortalezas?: string | null
  areasMejora?: string | null
  dudasDetectadas?: string | null
  transcripcionCapa3?: string | null
}

function buildEntregaRow(overrides: RowOverrides = {}) {
  const tipo = overrides.tipo ?? "MINI"
  const estado = overrides.estado ?? "EN_REVISION"
  const ajustadaManual = overrides.ajustadaManual ?? false

  const decOrNull = (v: number | null | undefined) =>
    v === null || v === undefined ? null : new Prisma.Decimal(v)

  const notaCapa1 = decOrNull(overrides.notaCapa1)
  const notaCapa2 = decOrNull(overrides.notaCapa2)
  const notaCapa3 = decOrNull(overrides.notaCapa3)
  const notaFinal = decOrNull(overrides.notaFinal ?? null)

  const pesosAplicados = overrides.pesosAplicados ?? null
  const pesoCapa1Aplicado = pesosAplicados ? new Prisma.Decimal(pesosAplicados.p1) : null
  const pesoCapa2Aplicado = pesosAplicados ? new Prisma.Decimal(pesosAplicados.p2) : null
  const pesoCapa3Aplicado = pesosAplicados ? new Prisma.Decimal(pesosAplicados.p3) : null

  const pesoCapa1 = new Prisma.Decimal(overrides.pesoCapa1 ?? 40)
  const pesoCapa2 = new Prisma.Decimal(overrides.pesoCapa2 ?? 30)
  const pesoCapa3 = new Prisma.Decimal(overrides.pesoCapa3 ?? 30)

  return {
    id: overrides.id ?? ENTREGA_ID,
    inscripcionId: INSCRIPCION_ID,
    miniProyectoId: tipo === "MINI" ? MINI_ID : null,
    transversalId: tipo === "TRANSVERSAL" ? TRANSVERSAL_ID : null,
    intento: overrides.intento ?? 1,
    estado,
    urlRepo: "https://github.com/x/y",
    rama: "main",
    notaCapa1,
    notaCapa2,
    notaCapa3,
    notaFinal,
    ajustadaManual,
    pesoCapa1Aplicado,
    pesoCapa2Aplicado,
    pesoCapa3Aplicado,
    fortalezas: overrides.fortalezas ?? null,
    areasMejora: overrides.areasMejora ?? null,
    dudasDetectadas: overrides.dudasDetectadas ?? null,
    transcripcionCapa3: overrides.transcripcionCapa3 ?? null,
    enviadaAt: NOW,
    evaluadaAt: estado === "EVALUADA" ? NOW : null,
    inscripcion: {
      id: INSCRIPCION_ID,
      estado: overrides.inscripcionEstado ?? ("ACTIVA" as EstadoInscripcion),
      tipo: "SOLICITUD" as const,
      participante: {
        id: PARTICIPANTE_ID,
        nombre: "Carmen",
        apellido: "Lopez",
        email: "carmen@example.com",
      },
      curso: {
        id: CURSO_ID,
        titulo: "Curso Test",
        empresaCliente: "ACME",
        estado: overrides.cursoEstado ?? ("ACTIVO" as EstadoCurso),
      },
    },
    miniProyecto:
      tipo === "MINI"
        ? {
            id: MINI_ID,
            titulo: "Mini Proyecto",
            enunciado: "Enunciado mini",
            pesoCapa1,
            pesoCapa2,
            pesoCapa3,
            modulo: { id: MODULO_ID, titulo: "Modulo 1" },
          }
        : null,
    transversal:
      tipo === "TRANSVERSAL"
        ? {
            id: TRANSVERSAL_ID,
            titulo: "Proyecto Transversal",
            enunciado: "Enunciado pt",
            umbralAprobacion: 70,
            pesoCapa1,
            pesoCapa2,
            pesoCapa3,
          }
        : null,
  }
}

function buildIntentoRow(
  overrides: Partial<{ id: string; intento: number; notaFinal: number | null }>,
) {
  const notaFinal = overrides.notaFinal === undefined ? null : overrides.notaFinal
  return {
    id: overrides.id ?? `intento-${overrides.intento ?? 1}`,
    intento: overrides.intento ?? 1,
    estado: "EVALUADA" as const,
    notaFinal: notaFinal === null ? null : new Prisma.Decimal(notaFinal),
    ajustadaManual: false,
    enviadaAt: NOW,
    evaluadaAt: NOW,
  }
}

const QUERY_DEFAULT = listarEntregasProyectoAdminQuerySchema.parse({})

// =============================================================================
// LISTAR
// =============================================================================

describe("listar", () => {
  it("devuelve lista vacia", async () => {
    const { service, prisma } = buildService()
    prisma.entregaProyecto.findMany.mockResolvedValue([])
    prisma.entregaProyecto.count.mockResolvedValue(0)

    const result = await service.listar(QUERY_DEFAULT)
    expect(result.items).toEqual([])
    expect(result.total).toBe(0)
    expect(result.page).toBe(1)
    expect(result.pageSize).toBe(20)
  })

  it("aplica filtro por defecto solo EN_REVISION", async () => {
    const { service, prisma } = buildService()
    prisma.entregaProyecto.findMany.mockResolvedValue([])
    prisma.entregaProyecto.count.mockResolvedValue(0)

    await service.listar(QUERY_DEFAULT)

    const callArgs = prisma.entregaProyecto.findMany.mock.calls[0]?.[0] as {
      where?: { estado?: string }
    }
    expect(callArgs?.where?.estado).toBe("EN_REVISION")
  })

  it("estado=all no filtra por estado", async () => {
    const { service, prisma } = buildService()
    prisma.entregaProyecto.findMany.mockResolvedValue([])
    prisma.entregaProyecto.count.mockResolvedValue(0)

    const query = listarEntregasProyectoAdminQuerySchema.parse({ estado: "all" })
    await service.listar(query)

    const callArgs = prisma.entregaProyecto.findMany.mock.calls[0]?.[0] as {
      where?: { estado?: string }
    }
    expect(callArgs?.where?.estado).toBeUndefined()
  })

  it("filtra por tipo=MINI (miniProyectoId not null)", async () => {
    const { service, prisma } = buildService()
    prisma.entregaProyecto.findMany.mockResolvedValue([])
    prisma.entregaProyecto.count.mockResolvedValue(0)

    const query = listarEntregasProyectoAdminQuerySchema.parse({ tipo: "MINI" })
    await service.listar(query)

    const callArgs = prisma.entregaProyecto.findMany.mock.calls[0]?.[0] as {
      where?: { miniProyectoId?: unknown }
    }
    expect(callArgs?.where?.miniProyectoId).toEqual({ not: null })
  })

  it("filtra por tipo=TRANSVERSAL (transversalId not null)", async () => {
    const { service, prisma } = buildService()
    prisma.entregaProyecto.findMany.mockResolvedValue([])
    prisma.entregaProyecto.count.mockResolvedValue(0)

    const query = listarEntregasProyectoAdminQuerySchema.parse({ tipo: "TRANSVERSAL" })
    await service.listar(query)

    const callArgs = prisma.entregaProyecto.findMany.mock.calls[0]?.[0] as {
      where?: { transversalId?: unknown }
    }
    expect(callArgs?.where?.transversalId).toEqual({ not: null })
  })

  it("filtra por cursoId, moduloId, participanteId, miniProyectoId", async () => {
    const { service, prisma } = buildService()
    prisma.entregaProyecto.findMany.mockResolvedValue([])
    prisma.entregaProyecto.count.mockResolvedValue(0)

    const query = listarEntregasProyectoAdminQuerySchema.parse({
      estado: "EVALUADA",
      cursoId: CURSO_ID,
      moduloId: MODULO_ID,
      participanteId: PARTICIPANTE_ID,
      miniProyectoId: MINI_ID,
    })
    await service.listar(query)

    const callArgs = prisma.entregaProyecto.findMany.mock.calls[0]?.[0] as {
      where?: {
        estado?: string
        miniProyectoId?: string
        miniProyecto?: { moduloId?: string }
        inscripcion?: { cursoId?: string; participanteId?: string }
      }
    }
    expect(callArgs?.where?.estado).toBe("EVALUADA")
    expect(callArgs?.where?.miniProyectoId).toBe(MINI_ID)
    expect(callArgs?.where?.miniProyecto?.moduloId).toBe(MODULO_ID)
    expect(callArgs?.where?.inscripcion?.cursoId).toBe(CURSO_ID)
    expect(callArgs?.where?.inscripcion?.participanteId).toBe(PARTICIPANTE_ID)
  })

  it("aplica paginacion", async () => {
    const { service, prisma } = buildService()
    prisma.entregaProyecto.findMany.mockResolvedValue([])
    prisma.entregaProyecto.count.mockResolvedValue(50)

    const query = listarEntregasProyectoAdminQuerySchema.parse({ page: 3, pageSize: 10 })
    const result = await service.listar(query)

    const callArgs = prisma.entregaProyecto.findMany.mock.calls[0]?.[0] as {
      skip?: number
      take?: number
    }
    expect(callArgs?.skip).toBe(20)
    expect(callArgs?.take).toBe(10)
    expect(result.total).toBe(50)
  })

  it("mapea correctamente items MINI con XOR derivado", async () => {
    const { service, prisma } = buildService()
    prisma.entregaProyecto.findMany.mockResolvedValue([
      buildEntregaRow({ tipo: "MINI", estado: "EN_REVISION" }),
    ])
    prisma.entregaProyecto.count.mockResolvedValue(1)

    const result = await service.listar(QUERY_DEFAULT)
    expect(result.items[0]?.tipo).toBe("MINI")
    expect(result.items[0]?.miniProyectoId).toBe(MINI_ID)
    expect(result.items[0]?.transversalId).toBeNull()
    expect(result.items[0]?.proyectoTitulo).toBe("Mini Proyecto")
    expect(result.items[0]?.moduloId).toBe(MODULO_ID)
  })

  it("mapea correctamente items TRANSVERSAL con XOR derivado", async () => {
    const { service, prisma } = buildService()
    prisma.entregaProyecto.findMany.mockResolvedValue([
      buildEntregaRow({ tipo: "TRANSVERSAL", estado: "EN_REVISION" }),
    ])
    prisma.entregaProyecto.count.mockResolvedValue(1)

    const result = await service.listar(QUERY_DEFAULT)
    expect(result.items[0]?.tipo).toBe("TRANSVERSAL")
    expect(result.items[0]?.transversalId).toBe(TRANSVERSAL_ID)
    expect(result.items[0]?.miniProyectoId).toBeNull()
    expect(result.items[0]?.proyectoTitulo).toBe("Proyecto Transversal")
    expect(result.items[0]?.moduloId).toBeNull()
  })
})

// =============================================================================
// OBTENER
// =============================================================================

describe("obtener", () => {
  it("devuelve detalle MINI con intentos previos", async () => {
    const { service, prisma } = buildService()
    prisma.entregaProyecto.findUnique.mockResolvedValue(
      buildEntregaRow({ tipo: "MINI", intento: 2 }),
    )
    prisma.entregaProyecto.findMany.mockResolvedValue([
      buildIntentoRow({ intento: 1, notaFinal: 60 }),
      buildIntentoRow({ intento: 2, notaFinal: null }),
    ])

    const result = await service.obtener(ENTREGA_ID)
    expect(result.id).toBe(ENTREGA_ID)
    expect(result.tipo).toBe("MINI")
    expect(result.miniProyecto?.titulo).toBe("Mini Proyecto")
    expect(result.transversal).toBeNull()
    expect(result.intentos).toHaveLength(2)
    expect(result.intentos[0]?.notaFinal).toBe(60)
  })

  it("devuelve detalle TRANSVERSAL", async () => {
    const { service, prisma } = buildService()
    prisma.entregaProyecto.findUnique.mockResolvedValue(buildEntregaRow({ tipo: "TRANSVERSAL" }))
    prisma.entregaProyecto.findMany.mockResolvedValue([])

    const result = await service.obtener(ENTREGA_ID)
    expect(result.tipo).toBe("TRANSVERSAL")
    expect(result.transversal?.titulo).toBe("Proyecto Transversal")
    expect(result.miniProyecto).toBeNull()
  })

  it("lanza 404 si la entrega no existe", async () => {
    const { service, prisma } = buildService()
    prisma.entregaProyecto.findUnique.mockResolvedValue(null)
    await expect(service.obtener(ENTREGA_ID)).rejects.toThrow(NotFoundException)
  })

  it("notaCalculadaOriginal correcto cuando hay snapshot completo", async () => {
    const { service, prisma } = buildService()
    prisma.entregaProyecto.findUnique.mockResolvedValue(
      buildEntregaRow({
        estado: "EVALUADA",
        notaCapa1: 80,
        notaCapa2: 70,
        notaCapa3: 60,
        notaFinal: 70,
        pesosAplicados: { p1: 40, p2: 30, p3: 30 },
      }),
    )
    prisma.entregaProyecto.findMany.mockResolvedValue([])

    const result = await service.obtener(ENTREGA_ID)
    // (80*40 + 70*30 + 60*30)/100 = (3200+2100+1800)/100 = 71
    expect(result.notaCalculadaOriginal).toBe(71)
  })

  it("notaCalculadaOriginal=null cuando faltan notas o pesos", async () => {
    const { service, prisma } = buildService()
    prisma.entregaProyecto.findUnique.mockResolvedValue(
      buildEntregaRow({ estado: "EN_REVISION", notaCapa1: null }),
    )
    prisma.entregaProyecto.findMany.mockResolvedValue([])

    const result = await service.obtener(ENTREGA_ID)
    expect(result.notaCalculadaOriginal).toBeNull()
  })

  it("convierte Decimal a number plano en notaCapa* y notaFinal", async () => {
    const { service, prisma } = buildService()
    prisma.entregaProyecto.findUnique.mockResolvedValue(
      buildEntregaRow({
        estado: "EVALUADA",
        notaCapa1: 87.5,
        notaCapa2: 70,
        notaCapa3: 60,
        notaFinal: 73.5,
      }),
    )
    prisma.entregaProyecto.findMany.mockResolvedValue([])

    const result = await service.obtener(ENTREGA_ID)
    expect(result.notaCapa1).toBe(87.5)
    expect(result.notaFinal).toBe(73.5)
  })
})

// =============================================================================
// EVALUAR (EN_REVISION → EVALUADA)
// =============================================================================

describe("evaluar", () => {
  const input: EvaluarEntregaProyectoAdminInput = {
    notaCapa1: 80,
    notaCapa2: 70,
    notaCapa3: 60,
    fortalezas: "Buen analisis",
  }

  function setupEvaluar(prisma: PrismaMock, previo: ReturnType<typeof buildEntregaRow>) {
    prisma.entregaProyecto.findUnique.mockResolvedValueOnce(previo).mockResolvedValueOnce({
      ...previo,
      estado: "EVALUADA",
      notaCapa1: new Prisma.Decimal(80),
      notaCapa2: new Prisma.Decimal(70),
      notaCapa3: new Prisma.Decimal(60),
      notaFinal: new Prisma.Decimal(71),
    })
    prisma.entregaProyecto.update.mockResolvedValue({
      id: previo.id,
      estado: "EVALUADA",
      notaCapa1: new Prisma.Decimal(80),
      notaCapa2: new Prisma.Decimal(70),
      notaCapa3: new Prisma.Decimal(60),
      notaFinal: new Prisma.Decimal(71),
      pesoCapa1Aplicado: new Prisma.Decimal(40),
      pesoCapa2Aplicado: new Prisma.Decimal(30),
      pesoCapa3Aplicado: new Prisma.Decimal(30),
      ajustadaManual: false,
      fortalezas: "Buen analisis",
      areasMejora: null,
      dudasDetectadas: null,
      transcripcionCapa3: null,
      evaluadaAt: NOW,
    })
    prisma.entregaProyecto.findMany.mockResolvedValue([])
    prisma.logActividad.create.mockResolvedValue({ id: "log-1" })
  }

  it("evalua MINI calcula notaFinal=71 con pesos default 40/30/30", async () => {
    const { service, prisma } = buildService()
    const previo = buildEntregaRow({ tipo: "MINI", estado: "EN_REVISION" })
    setupEvaluar(prisma, previo)

    await service.evaluar(ENTREGA_ID, input, ACTOR_ID)

    const updateArgs = prisma.entregaProyecto.update.mock.calls[0]?.[0] as {
      data?: {
        notaFinal?: Prisma.Decimal
        pesoCapa1Aplicado?: Prisma.Decimal
        pesoCapa2Aplicado?: Prisma.Decimal
        pesoCapa3Aplicado?: Prisma.Decimal
        estado?: string
        ajustadaManual?: boolean
      }
    }
    expect(updateArgs?.data?.estado).toBe("EVALUADA")
    expect(updateArgs?.data?.ajustadaManual).toBe(false)
    expect(updateArgs?.data?.notaFinal?.toNumber()).toBe(71)
    expect(updateArgs?.data?.pesoCapa1Aplicado?.toNumber()).toBe(40)
    expect(updateArgs?.data?.pesoCapa2Aplicado?.toNumber()).toBe(30)
    expect(updateArgs?.data?.pesoCapa3Aplicado?.toNumber()).toBe(30)
  })

  it("evalua TRANSVERSAL persiste pesos del PT", async () => {
    const { service, prisma } = buildService()
    const previo = buildEntregaRow({
      tipo: "TRANSVERSAL",
      estado: "EN_REVISION",
      pesoCapa1: 50,
      pesoCapa2: 30,
      pesoCapa3: 20,
    })
    setupEvaluar(prisma, previo)

    await service.evaluar(ENTREGA_ID, input, ACTOR_ID)

    const updateArgs = prisma.entregaProyecto.update.mock.calls[0]?.[0] as {
      data?: {
        pesoCapa1Aplicado?: Prisma.Decimal
        notaFinal?: Prisma.Decimal
      }
    }
    expect(updateArgs?.data?.pesoCapa1Aplicado?.toNumber()).toBe(50)
    // (80*50 + 70*30 + 60*20)/100 = (4000+2100+1200)/100 = 73
    expect(updateArgs?.data?.notaFinal?.toNumber()).toBe(73)
  })

  it("registra log PROYECTO_EVALUADO con snapshot antes/despues", async () => {
    const { service, prisma } = buildService()
    const previo = buildEntregaRow({ tipo: "MINI", estado: "EN_REVISION" })
    setupEvaluar(prisma, previo)

    await service.evaluar(ENTREGA_ID, input, ACTOR_ID)

    const logCall = prisma.logActividad.create.mock.calls[0]?.[0] as {
      data: {
        tipoAccion: string
        entidadTipo: string
        actorId: string
        valorAntes: { estado: string }
        valorDespues: { estado: string; notaFinal: number; pesoCapa1Aplicado: number }
      }
    }
    expect(logCall.data.tipoAccion).toBe("PROYECTO_EVALUADO")
    expect(logCall.data.entidadTipo).toBe("EntregaProyecto")
    expect(logCall.data.actorId).toBe(ACTOR_ID)
    expect(logCall.data.valorAntes.estado).toBe("EN_REVISION")
    expect(logCall.data.valorDespues.estado).toBe("EVALUADA")
    expect(logCall.data.valorDespues.notaFinal).toBe(71)
    expect(logCall.data.valorDespues.pesoCapa1Aplicado).toBe(40)
  })

  it("lanza 404 si no existe", async () => {
    const { service, prisma } = buildService()
    prisma.entregaProyecto.findUnique.mockResolvedValue(null)
    await expect(service.evaluar(ENTREGA_ID, input, ACTOR_ID)).rejects.toThrow(NotFoundException)
  })

  it("lanza 409 si curso CERRADO", async () => {
    const { service, prisma } = buildService()
    prisma.entregaProyecto.findUnique.mockResolvedValue(
      buildEntregaRow({ estado: "EN_REVISION", cursoEstado: "CERRADO" }),
    )
    await expect(service.evaluar(ENTREGA_ID, input, ACTOR_ID)).rejects.toThrow(ConflictException)
  })

  it("lanza 409 si inscripcion no ACTIVA", async () => {
    const { service, prisma } = buildService()
    prisma.entregaProyecto.findUnique.mockResolvedValue(
      buildEntregaRow({ estado: "EN_REVISION", inscripcionEstado: "COMPLETADA" }),
    )
    await expect(service.evaluar(ENTREGA_ID, input, ACTOR_ID)).rejects.toThrow(ConflictException)
  })

  it("lanza 409 si ya EVALUADA", async () => {
    const { service, prisma } = buildService()
    prisma.entregaProyecto.findUnique.mockResolvedValue(buildEntregaRow({ estado: "EVALUADA" }))
    await expect(service.evaluar(ENTREGA_ID, input, ACTOR_ID)).rejects.toThrow(ConflictException)
  })

  it("lanza 409 si ENVIADA", async () => {
    const { service, prisma } = buildService()
    prisma.entregaProyecto.findUnique.mockResolvedValue(buildEntregaRow({ estado: "ENVIADA" }))
    await expect(service.evaluar(ENTREGA_ID, input, ACTOR_ID)).rejects.toThrow(ConflictException)
  })

  it("schema rechaza notaCapa fuera de rango", () => {
    const result = evaluarEntregaProyectoAdminInputSchema.safeParse({
      notaCapa1: 101,
      notaCapa2: 50,
      notaCapa3: 50,
    })
    expect(result.success).toBe(false)
  })

  it("schema rechaza nota con > 2 decimales", () => {
    const result = evaluarEntregaProyectoAdminInputSchema.safeParse({
      notaCapa1: 75.555,
      notaCapa2: 50,
      notaCapa3: 50,
    })
    expect(result.success).toBe(false)
  })

  it("schema rechaza claves desconocidas .strict() (anti spoof notaFinal/ajustadaManual/pesos/estado)", () => {
    expect(
      evaluarEntregaProyectoAdminInputSchema.safeParse({
        notaCapa1: 80,
        notaCapa2: 70,
        notaCapa3: 60,
        notaFinal: 100,
      }).success,
    ).toBe(false)
    expect(
      evaluarEntregaProyectoAdminInputSchema.safeParse({
        notaCapa1: 80,
        notaCapa2: 70,
        notaCapa3: 60,
        ajustadaManual: true,
      }).success,
    ).toBe(false)
    expect(
      evaluarEntregaProyectoAdminInputSchema.safeParse({
        notaCapa1: 80,
        notaCapa2: 70,
        notaCapa3: 60,
        pesoCapa1Aplicado: 50,
      }).success,
    ).toBe(false)
    expect(
      evaluarEntregaProyectoAdminInputSchema.safeParse({
        notaCapa1: 80,
        notaCapa2: 70,
        notaCapa3: 60,
        estado: "EVALUADA",
      }).success,
    ).toBe(false)
  })

  it("schema requiere las 3 notas obligatorias", () => {
    const result = evaluarEntregaProyectoAdminInputSchema.safeParse({
      notaCapa1: 80,
      notaCapa2: 70,
    })
    expect(result.success).toBe(false)
  })
})

// =============================================================================
// AJUSTAR (A26 · EN_REVISION o EVALUADA → EVALUADA + manual)
// =============================================================================

describe("ajustar", () => {
  const input: AjustarEntregaProyectoAdminInput = {
    notaFinal: 85,
    motivoAjuste: "Reviso evaluacion porque la IA fue muy estricta en capa 2",
  }

  function setupAjustar(prisma: PrismaMock, previo: ReturnType<typeof buildEntregaRow>) {
    prisma.entregaProyecto.findUnique.mockResolvedValueOnce(previo).mockResolvedValueOnce({
      ...previo,
      estado: "EVALUADA",
      notaFinal: new Prisma.Decimal(85),
      ajustadaManual: true,
    })
    prisma.entregaProyecto.update.mockResolvedValue({
      id: previo.id,
      estado: "EVALUADA",
      notaCapa1: previo.notaCapa1,
      notaCapa2: previo.notaCapa2,
      notaCapa3: previo.notaCapa3,
      notaFinal: new Prisma.Decimal(85),
      pesoCapa1Aplicado: previo.pesoCapa1Aplicado,
      pesoCapa2Aplicado: previo.pesoCapa2Aplicado,
      pesoCapa3Aplicado: previo.pesoCapa3Aplicado,
      ajustadaManual: true,
      fortalezas: previo.fortalezas,
      areasMejora: previo.areasMejora,
      dudasDetectadas: previo.dudasDetectadas,
      transcripcionCapa3: previo.transcripcionCapa3,
      evaluadaAt: previo.evaluadaAt,
    })
    prisma.entregaProyecto.findMany.mockResolvedValue([])
    prisma.logActividad.create.mockResolvedValue({ id: "log-1" })
  }

  it("ajusta desde EVALUADA con override notaFinal y NO toca notaCapa* ni pesos", async () => {
    const { service, prisma } = buildService()
    const previo = buildEntregaRow({
      estado: "EVALUADA",
      notaCapa1: 80,
      notaCapa2: 70,
      notaCapa3: 60,
      notaFinal: 71,
      pesosAplicados: { p1: 40, p2: 30, p3: 30 },
    })
    setupAjustar(prisma, previo)

    await service.ajustar(ENTREGA_ID, input, ACTOR_ID)

    const updateArgs = prisma.entregaProyecto.update.mock.calls[0]?.[0] as {
      data?: {
        notaFinal?: Prisma.Decimal
        ajustadaManual?: boolean
        notaCapa1?: unknown
        notaCapa2?: unknown
        notaCapa3?: unknown
        pesoCapa1Aplicado?: unknown
        pesoCapa2Aplicado?: unknown
        pesoCapa3Aplicado?: unknown
        evaluadaAt?: Date
      }
    }
    expect(updateArgs?.data?.notaFinal?.toNumber()).toBe(85)
    expect(updateArgs?.data?.ajustadaManual).toBe(true)
    expect(updateArgs?.data?.notaCapa1).toBeUndefined()
    expect(updateArgs?.data?.notaCapa2).toBeUndefined()
    expect(updateArgs?.data?.notaCapa3).toBeUndefined()
    expect(updateArgs?.data?.pesoCapa1Aplicado).toBeUndefined()
    expect(updateArgs?.data?.evaluadaAt).toBeUndefined()
  })

  it("ajusta desde EN_REVISION marca EVALUADA + setea evaluadaAt", async () => {
    const { service, prisma } = buildService()
    const previo = buildEntregaRow({ estado: "EN_REVISION" })
    setupAjustar(prisma, previo)

    await service.ajustar(ENTREGA_ID, input, ACTOR_ID)

    const updateArgs = prisma.entregaProyecto.update.mock.calls[0]?.[0] as {
      data?: { estado?: string; ajustadaManual?: boolean; evaluadaAt?: Date }
    }
    expect(updateArgs?.data?.estado).toBe("EVALUADA")
    expect(updateArgs?.data?.ajustadaManual).toBe(true)
    expect(updateArgs?.data?.evaluadaAt).toBeInstanceOf(Date)
  })

  it("registra log NOTA_AJUSTADA_MANUAL con motivo", async () => {
    const { service, prisma } = buildService()
    const previo = buildEntregaRow({
      estado: "EVALUADA",
      notaFinal: 71,
      pesosAplicados: { p1: 40, p2: 30, p3: 30 },
    })
    setupAjustar(prisma, previo)

    await service.ajustar(ENTREGA_ID, input, ACTOR_ID)

    const logCall = prisma.logActividad.create.mock.calls[0]?.[0] as {
      data: {
        tipoAccion: string
        entidadTipo: string
        motivo: string
        valorAntes: { notaFinal: number; ajustadaManual: boolean }
        valorDespues: { notaFinal: number; ajustadaManual: boolean; motivo: string }
      }
    }
    expect(logCall.data.tipoAccion).toBe("NOTA_AJUSTADA_MANUAL")
    expect(logCall.data.entidadTipo).toBe("EntregaProyecto")
    expect(logCall.data.motivo).toBe(input.motivoAjuste)
    expect(logCall.data.valorAntes.notaFinal).toBe(71)
    expect(logCall.data.valorAntes.ajustadaManual).toBe(false)
    expect(logCall.data.valorDespues.notaFinal).toBe(85)
    expect(logCall.data.valorDespues.ajustadaManual).toBe(true)
    expect(logCall.data.valorDespues.motivo).toBe(input.motivoAjuste)
  })

  it("permite ajustar en inscripcion COMPLETADA", async () => {
    const { service, prisma } = buildService()
    const previo = buildEntregaRow({ estado: "EVALUADA", inscripcionEstado: "COMPLETADA" })
    setupAjustar(prisma, previo)
    await expect(service.ajustar(ENTREGA_ID, input, ACTOR_ID)).resolves.toBeDefined()
  })

  it("PATCH outputs: undefined preserva, null borra, string trim", async () => {
    const { service, prisma } = buildService()
    const previo = buildEntregaRow({
      estado: "EVALUADA",
      fortalezas: "previo",
      areasMejora: "previo",
      dudasDetectadas: "previo",
    })
    setupAjustar(prisma, previo)

    await service.ajustar(
      ENTREGA_ID,
      {
        notaFinal: 85,
        motivoAjuste: input.motivoAjuste,
        // fortalezas omitido → preserva
        areasMejora: null, // borra
        dudasDetectadas: "  nuevo valor  ", // trim
      },
      ACTOR_ID,
    )

    const updateArgs = prisma.entregaProyecto.update.mock.calls[0]?.[0] as {
      data?: { fortalezas?: unknown; areasMejora?: unknown; dudasDetectadas?: unknown }
    }
    expect(updateArgs?.data?.fortalezas).toBeUndefined()
    expect(updateArgs?.data?.areasMejora).toBeNull()
    expect(updateArgs?.data?.dudasDetectadas).toBe("nuevo valor")
  })

  it("lanza 404 si no existe", async () => {
    const { service, prisma } = buildService()
    prisma.entregaProyecto.findUnique.mockResolvedValue(null)
    await expect(service.ajustar(ENTREGA_ID, input, ACTOR_ID)).rejects.toThrow(NotFoundException)
  })

  it("lanza 409 si curso CERRADO", async () => {
    const { service, prisma } = buildService()
    prisma.entregaProyecto.findUnique.mockResolvedValue(
      buildEntregaRow({ estado: "EVALUADA", cursoEstado: "CERRADO" }),
    )
    await expect(service.ajustar(ENTREGA_ID, input, ACTOR_ID)).rejects.toThrow(ConflictException)
  })

  it("lanza 409 si inscripcion ABANDONADA", async () => {
    const { service, prisma } = buildService()
    prisma.entregaProyecto.findUnique.mockResolvedValue(
      buildEntregaRow({ estado: "EVALUADA", inscripcionEstado: "ABANDONADA" }),
    )
    await expect(service.ajustar(ENTREGA_ID, input, ACTOR_ID)).rejects.toThrow(ConflictException)
  })

  it("lanza 409 si inscripcion CERRADO_SIN_COMPLETAR", async () => {
    const { service, prisma } = buildService()
    prisma.entregaProyecto.findUnique.mockResolvedValue(
      buildEntregaRow({ estado: "EVALUADA", inscripcionEstado: "CERRADO_SIN_COMPLETAR" }),
    )
    await expect(service.ajustar(ENTREGA_ID, input, ACTOR_ID)).rejects.toThrow(ConflictException)
  })

  it("lanza 409 si ENVIADA", async () => {
    const { service, prisma } = buildService()
    prisma.entregaProyecto.findUnique.mockResolvedValue(buildEntregaRow({ estado: "ENVIADA" }))
    await expect(service.ajustar(ENTREGA_ID, input, ACTOR_ID)).rejects.toThrow(ConflictException)
  })

  it("schema rechaza ajustar sin motivoAjuste", () => {
    const result = ajustarEntregaProyectoAdminInputSchema.safeParse({ notaFinal: 90 })
    expect(result.success).toBe(false)
  })

  it("schema rechaza motivoAjuste solo whitespace", () => {
    const result = ajustarEntregaProyectoAdminInputSchema.safeParse({
      notaFinal: 90,
      motivoAjuste: "          ",
    })
    expect(result.success).toBe(false)
  })

  it("schema rechaza motivoAjuste corto", () => {
    const result = ajustarEntregaProyectoAdminInputSchema.safeParse({
      notaFinal: 90,
      motivoAjuste: "Corto",
    })
    expect(result.success).toBe(false)
  })

  it("schema rechaza notaFinal fuera de rango", () => {
    const result = ajustarEntregaProyectoAdminInputSchema.safeParse({
      notaFinal: 150,
      motivoAjuste: "Motivo valido y suficientemente largo",
    })
    expect(result.success).toBe(false)
  })

  it("schema .strict() rechaza spoof de notaCapa* / pesoCapa*Aplicado / ajustadaManual=false", () => {
    const base = { notaFinal: 90, motivoAjuste: "Motivo valido y suficientemente largo" }
    expect(
      ajustarEntregaProyectoAdminInputSchema.safeParse({ ...base, notaCapa1: 100 }).success,
    ).toBe(false)
    expect(
      ajustarEntregaProyectoAdminInputSchema.safeParse({ ...base, notaCapa2: 100 }).success,
    ).toBe(false)
    expect(
      ajustarEntregaProyectoAdminInputSchema.safeParse({ ...base, notaCapa3: 100 }).success,
    ).toBe(false)
    expect(
      ajustarEntregaProyectoAdminInputSchema.safeParse({ ...base, pesoCapa1Aplicado: 50 }).success,
    ).toBe(false)
    expect(
      ajustarEntregaProyectoAdminInputSchema.safeParse({ ...base, ajustadaManual: false }).success,
    ).toBe(false)
  })
})

// =============================================================================
// CALCULO notaFinal · MAESTRO §10.5 — helper aislado
// =============================================================================

describe("calcularNotaFinal", () => {
  it("pesos default 40/30/30 con 80/70/60 → 71", () => {
    expect(calcularNotaFinal(80, 70, 60, 40, 30, 30).toNumber()).toBe(71)
  })

  it("pesos custom 50/30/20 con 80/70/60 → 73", () => {
    expect(calcularNotaFinal(80, 70, 60, 50, 30, 20).toNumber()).toBe(73)
  })

  it("redondea a 2 decimales (HALF_UP)", () => {
    // 75 / 1 ≈ 75.000... pero usemos algo que requiera redondeo:
    // (33.33*40 + 33.33*30 + 33.33*30)/100 = 33.33
    expect(calcularNotaFinal(33.33, 33.33, 33.33, 40, 30, 30).toNumber()).toBe(33.33)
    // (1*40 + 2*30 + 4*30)/100 = (40+60+120)/100 = 2.2
    expect(calcularNotaFinal(1, 2, 4, 40, 30, 30).toNumber()).toBe(2.2)
  })

  it("max: 100/100/100 con cualquier pesos suma 100 → 100", () => {
    expect(calcularNotaFinal(100, 100, 100, 40, 30, 30).toNumber()).toBe(100)
  })

  it("min: 0/0/0 → 0", () => {
    expect(calcularNotaFinal(0, 0, 0, 40, 30, 30).toNumber()).toBe(0)
  })
})
