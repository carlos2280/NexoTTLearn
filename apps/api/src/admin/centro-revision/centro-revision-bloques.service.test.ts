import { ConflictException, NotFoundException } from "@nestjs/common"
import {
  type AjustarEntregaBloqueAdminInput,
  type EvaluarEntregaBloqueAdminInput,
  ajustarEntregaBloqueAdminInputSchema,
  evaluarEntregaBloqueAdminInputSchema,
  listarEntregasBloqueAdminQuerySchema,
} from "@nexott-learn/shared-types"
import { Prisma } from "@prisma/client"
import { describe, expect, it, vi } from "vitest"
import type { PrismaService } from "../../common/prisma/prisma.service"
import { CentroRevisionBloquesService } from "./centro-revision-bloques.service"

type Stub = ReturnType<typeof vi.fn>

interface PrismaMock {
  entregaBloque: {
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
    entregaBloque: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
    },
    logActividad: { create: vi.fn() },
    // $transaction soporta tanto array de promesas como callback (interactive).
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

function buildService(prisma: PrismaMock = buildPrisma()) {
  const service = new CentroRevisionBloquesService(prisma as unknown as PrismaService)
  return { service, prisma }
}

const ACTOR_ID = "00000000-0000-0000-0000-000000000001"
const ENTREGA_ID = "00000000-0000-0000-0000-000000000010"
const INSCRIPCION_ID = "00000000-0000-0000-0000-000000000020"
const BLOQUE_ID = "00000000-0000-0000-0000-000000000030"
const CURSO_ID = "00000000-0000-0000-0000-000000000040"
const PARTICIPANTE_ID = "00000000-0000-0000-0000-000000000050"
const MODULO_ID = "00000000-0000-0000-0000-000000000060"
const SECCION_ID = "00000000-0000-0000-0000-000000000070"

const NOW = new Date("2026-05-06T10:00:00Z")

type EstadoEntrega = "ENVIADA" | "EVALUADA_AUTOMATICAMENTE" | "PENDIENTE_REVISION" | "EVALUADA"
type EstadoInscripcion = "ACTIVA" | "COMPLETADA" | "ABANDONADA" | "CERRADO_SIN_COMPLETAR"
type EstadoCurso = "BORRADOR" | "ACTIVO" | "CERRADO"

function buildEntregaRow(
  overrides: Partial<{
    id: string
    estado: EstadoEntrega
    nota: number | null
    feedback: string | null
    ajustadaManual: boolean
    intento: number
    cursoEstado: EstadoCurso
    inscripcionEstado: EstadoInscripcion
    inscripcionTipo: "SOLICITUD" | "LIBRE"
  }> = {},
) {
  const nota = overrides.nota === undefined ? null : overrides.nota
  return {
    id: overrides.id ?? ENTREGA_ID,
    inscripcionId: INSCRIPCION_ID,
    bloqueId: BLOQUE_ID,
    intento: overrides.intento ?? 1,
    estado: overrides.estado ?? ("PENDIENTE_REVISION" as const),
    nota: nota === null ? null : new Prisma.Decimal(nota),
    feedback: overrides.feedback ?? null,
    ajustadaManual: overrides.ajustadaManual ?? false,
    evaluadaPorId: null,
    enviadaAt: NOW,
    evaluadaAt: null,
    contenido: { respuestas: [1, 2, 3] },
    inscripcion: {
      id: INSCRIPCION_ID,
      estado: overrides.inscripcionEstado ?? ("ACTIVA" as const),
      tipo: overrides.inscripcionTipo ?? ("SOLICITUD" as const),
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
        estado: overrides.cursoEstado ?? ("ACTIVO" as const),
      },
    },
    bloque: {
      id: BLOQUE_ID,
      tipo: "QUIZ" as const,
      codigoEvaluable: null,
      payload: { preguntas: [] },
      seccion: {
        id: SECCION_ID,
        titulo: "Seccion 1",
        modulo: { id: MODULO_ID, titulo: "Modulo 1" },
      },
    },
  }
}

function buildIntentoRow(overrides: Partial<{ id: string; intento: number; nota: number | null }>) {
  const nota = overrides.nota === undefined ? null : overrides.nota
  return {
    id: overrides.id ?? `intento-${overrides.intento ?? 1}`,
    intento: overrides.intento ?? 1,
    estado: "EVALUADA" as const,
    nota: nota === null ? null : new Prisma.Decimal(nota),
    ajustadaManual: false,
    enviadaAt: NOW,
    evaluadaAt: NOW,
  }
}

const QUERY_DEFAULT = listarEntregasBloqueAdminQuerySchema.parse({})

// =============================================================================
// LISTAR
// =============================================================================

describe("listar", () => {
  it("devuelve lista vacia", async () => {
    const { service, prisma } = buildService()
    prisma.entregaBloque.findMany.mockResolvedValue([])
    prisma.entregaBloque.count.mockResolvedValue(0)

    const result = await service.listar(QUERY_DEFAULT)
    expect(result.items).toEqual([])
    expect(result.total).toBe(0)
    expect(result.page).toBe(1)
    expect(result.pageSize).toBe(20)
  })

  it("aplica filtro por defecto solo PENDIENTE_REVISION", async () => {
    const { service, prisma } = buildService()
    prisma.entregaBloque.findMany.mockResolvedValue([])
    prisma.entregaBloque.count.mockResolvedValue(0)

    await service.listar(QUERY_DEFAULT)

    const callArgs = prisma.entregaBloque.findMany.mock.calls[0]?.[0] as {
      where?: { estado?: string }
    }
    expect(callArgs?.where?.estado).toBe("PENDIENTE_REVISION")
  })

  it("estado=all no filtra por estado", async () => {
    const { service, prisma } = buildService()
    prisma.entregaBloque.findMany.mockResolvedValue([])
    prisma.entregaBloque.count.mockResolvedValue(0)

    const query = listarEntregasBloqueAdminQuerySchema.parse({ estado: "all" })
    await service.listar(query)

    const callArgs = prisma.entregaBloque.findMany.mock.calls[0]?.[0] as {
      where?: { estado?: string }
    }
    expect(callArgs?.where?.estado).toBeUndefined()
  })

  it("filtra por cursoId, moduloId, participanteId, bloqueId", async () => {
    const { service, prisma } = buildService()
    prisma.entregaBloque.findMany.mockResolvedValue([])
    prisma.entregaBloque.count.mockResolvedValue(0)

    const query = listarEntregasBloqueAdminQuerySchema.parse({
      estado: "EVALUADA",
      cursoId: CURSO_ID,
      moduloId: MODULO_ID,
      participanteId: PARTICIPANTE_ID,
      bloqueId: BLOQUE_ID,
    })
    await service.listar(query)

    const callArgs = prisma.entregaBloque.findMany.mock.calls[0]?.[0] as {
      where?: {
        estado?: string
        bloqueId?: string
        inscripcion?: { cursoId?: string; participanteId?: string }
        bloque?: { seccion?: { moduloId?: string } }
      }
    }
    expect(callArgs?.where?.estado).toBe("EVALUADA")
    expect(callArgs?.where?.bloqueId).toBe(BLOQUE_ID)
    expect(callArgs?.where?.inscripcion?.cursoId).toBe(CURSO_ID)
    expect(callArgs?.where?.inscripcion?.participanteId).toBe(PARTICIPANTE_ID)
    expect(callArgs?.where?.bloque?.seccion?.moduloId).toBe(MODULO_ID)
  })

  it("aplica paginacion", async () => {
    const { service, prisma } = buildService()
    prisma.entregaBloque.findMany.mockResolvedValue([])
    prisma.entregaBloque.count.mockResolvedValue(50)

    const query = listarEntregasBloqueAdminQuerySchema.parse({ page: 3, pageSize: 10 })
    const result = await service.listar(query)

    const callArgs = prisma.entregaBloque.findMany.mock.calls[0]?.[0] as {
      skip?: number
      take?: number
    }
    expect(callArgs?.skip).toBe(20)
    expect(callArgs?.take).toBe(10)
    expect(result.total).toBe(50)
    expect(result.page).toBe(3)
    expect(result.pageSize).toBe(10)
  })

  it("mapea correctamente los items", async () => {
    const { service, prisma } = buildService()
    prisma.entregaBloque.findMany.mockResolvedValue([
      buildEntregaRow({ estado: "PENDIENTE_REVISION", nota: null }),
    ])
    prisma.entregaBloque.count.mockResolvedValue(1)

    const result = await service.listar(QUERY_DEFAULT)
    expect(result.items[0]?.id).toBe(ENTREGA_ID)
    expect(result.items[0]?.nota).toBeNull()
    expect(result.items[0]?.participante.nombre).toBe("Carmen")
    expect(result.items[0]?.bloque.moduloTitulo).toBe("Modulo 1")
    expect(result.items[0]?.curso.titulo).toBe("Curso Test")
  })
})

// =============================================================================
// OBTENER (detalle)
// =============================================================================

describe("obtener", () => {
  it("devuelve detalle con intentos previos", async () => {
    const { service, prisma } = buildService()
    prisma.entregaBloque.findUnique.mockResolvedValue(buildEntregaRow({ intento: 2 }))
    prisma.entregaBloque.findMany.mockResolvedValue([
      buildIntentoRow({ intento: 1, nota: 60 }),
      buildIntentoRow({ intento: 2, nota: null }),
    ])

    const result = await service.obtener(ENTREGA_ID)
    expect(result.id).toBe(ENTREGA_ID)
    expect(result.intentos).toHaveLength(2)
    expect(result.intentos[0]?.nota).toBe(60)
    expect(result.intentos[1]?.nota).toBeNull()
  })

  it("lanza 404 si la entrega no existe", async () => {
    const { service, prisma } = buildService()
    prisma.entregaBloque.findUnique.mockResolvedValue(null)

    await expect(service.obtener(ENTREGA_ID)).rejects.toThrow(NotFoundException)
  })

  it("convierte nota Decimal a number plano", async () => {
    const { service, prisma } = buildService()
    prisma.entregaBloque.findUnique.mockResolvedValue(
      buildEntregaRow({ estado: "EVALUADA", nota: 87.5 }),
    )
    prisma.entregaBloque.findMany.mockResolvedValue([])

    const result = await service.obtener(ENTREGA_ID)
    expect(result.nota).toBe(87.5)
  })
})

// =============================================================================
// EVALUAR (PENDIENTE_REVISION → EVALUADA)
// =============================================================================

describe("evaluar", () => {
  const input: EvaluarEntregaBloqueAdminInput = { nota: 80, feedback: "Buen trabajo" }

  function setupEvaluar(prisma: PrismaMock, previo: ReturnType<typeof buildEntregaRow>) {
    prisma.entregaBloque.findUnique
      .mockResolvedValueOnce(previo)
      .mockResolvedValueOnce({ ...previo, estado: "EVALUADA", nota: new Prisma.Decimal(80) })
    prisma.entregaBloque.update.mockResolvedValue({
      id: previo.id,
      estado: "EVALUADA",
      nota: new Prisma.Decimal(80),
      feedback: "Buen trabajo",
      ajustadaManual: false,
      evaluadaPorId: ACTOR_ID,
      evaluadaAt: NOW,
    })
    prisma.entregaBloque.findMany.mockResolvedValue([])
    prisma.logActividad.create.mockResolvedValue({})
  }

  it("transiciona PENDIENTE_REVISION → EVALUADA con ajustadaManual=false", async () => {
    const { service, prisma } = buildService()
    const previo = buildEntregaRow({ estado: "PENDIENTE_REVISION" })
    setupEvaluar(prisma, previo)

    await service.evaluar(ENTREGA_ID, input, ACTOR_ID)

    const updateArgs = prisma.entregaBloque.update.mock.calls[0]?.[0] as {
      data?: { estado?: string; ajustadaManual?: boolean; evaluadaPorId?: string }
    }
    expect(updateArgs?.data?.estado).toBe("EVALUADA")
    expect(updateArgs?.data?.ajustadaManual).toBe(false)
    expect(updateArgs?.data?.evaluadaPorId).toBe(ACTOR_ID)
  })

  it("registra log ENTREGA_EVALUADA con snapshot antes/despues", async () => {
    const { service, prisma } = buildService()
    const previo = buildEntregaRow({ estado: "PENDIENTE_REVISION" })
    setupEvaluar(prisma, previo)

    await service.evaluar(ENTREGA_ID, input, ACTOR_ID)

    expect(prisma.logActividad.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tipoAccion: "ENTREGA_EVALUADA",
          entidadTipo: "EntregaBloque",
          actorId: ACTOR_ID,
          entidadId: ENTREGA_ID,
        }),
      }),
    )

    const logCall = prisma.logActividad.create.mock.calls[0]?.[0] as {
      data: {
        valorAntes: { estado: string; nota: number | null }
        valorDespues: { estado: string; nota: number | null }
      }
    }
    expect(logCall.data.valorAntes.estado).toBe("PENDIENTE_REVISION")
    expect(logCall.data.valorDespues.estado).toBe("EVALUADA")
    expect(logCall.data.valorDespues.nota).toBe(80)
  })

  it("lanza 404 si la entrega no existe", async () => {
    const { service, prisma } = buildService()
    prisma.entregaBloque.findUnique.mockResolvedValue(null)

    await expect(service.evaluar(ENTREGA_ID, input, ACTOR_ID)).rejects.toThrow(NotFoundException)
  })

  it("lanza 409 si el curso esta CERRADO", async () => {
    const { service, prisma } = buildService()
    prisma.entregaBloque.findUnique.mockResolvedValue(
      buildEntregaRow({ estado: "PENDIENTE_REVISION", cursoEstado: "CERRADO" }),
    )

    await expect(service.evaluar(ENTREGA_ID, input, ACTOR_ID)).rejects.toThrow(ConflictException)
  })

  it("lanza 409 si la inscripcion no esta ACTIVA", async () => {
    const { service, prisma } = buildService()
    prisma.entregaBloque.findUnique.mockResolvedValue(
      buildEntregaRow({ estado: "PENDIENTE_REVISION", inscripcionEstado: "COMPLETADA" }),
    )

    await expect(service.evaluar(ENTREGA_ID, input, ACTOR_ID)).rejects.toThrow(ConflictException)
  })

  it("lanza 409 si la entrega ya esta EVALUADA", async () => {
    const { service, prisma } = buildService()
    prisma.entregaBloque.findUnique.mockResolvedValue(buildEntregaRow({ estado: "EVALUADA" }))

    await expect(service.evaluar(ENTREGA_ID, input, ACTOR_ID)).rejects.toThrow(ConflictException)
  })

  it("lanza 409 si la entrega esta EVALUADA_AUTOMATICAMENTE (debe usar ajustar)", async () => {
    const { service, prisma } = buildService()
    prisma.entregaBloque.findUnique.mockResolvedValue(
      buildEntregaRow({ estado: "EVALUADA_AUTOMATICAMENTE" }),
    )

    await expect(service.evaluar(ENTREGA_ID, input, ACTOR_ID)).rejects.toThrow(ConflictException)
  })

  it("lanza 409 si la entrega esta ENVIADA", async () => {
    const { service, prisma } = buildService()
    prisma.entregaBloque.findUnique.mockResolvedValue(buildEntregaRow({ estado: "ENVIADA" }))

    await expect(service.evaluar(ENTREGA_ID, input, ACTOR_ID)).rejects.toThrow(ConflictException)
  })

  it("schema rechaza nota fuera de rango (101)", () => {
    const result = evaluarEntregaBloqueAdminInputSchema.safeParse({ nota: 101 })
    expect(result.success).toBe(false)
  })

  it("schema rechaza nota negativa", () => {
    const result = evaluarEntregaBloqueAdminInputSchema.safeParse({ nota: -1 })
    expect(result.success).toBe(false)
  })

  it("schema rechaza nota con mas de 2 decimales", () => {
    const result = evaluarEntregaBloqueAdminInputSchema.safeParse({ nota: 75.555 })
    expect(result.success).toBe(false)
  })

  it("schema acepta nota con 2 decimales exactos", () => {
    const result = evaluarEntregaBloqueAdminInputSchema.safeParse({ nota: 75.5 })
    expect(result.success).toBe(true)
  })

  it("schema rechaza claves desconocidas (.strict() — anti spoof ajustadaManual)", () => {
    const result = evaluarEntregaBloqueAdminInputSchema.safeParse({
      nota: 80,
      ajustadaManual: true,
    })
    expect(result.success).toBe(false)
  })

  it("evaluar sin feedback preserva null inicial (no toca el campo)", async () => {
    const { service, prisma } = buildService()
    const previo = buildEntregaRow({ estado: "PENDIENTE_REVISION" })
    setupEvaluar(prisma, previo)

    await service.evaluar(ENTREGA_ID, { nota: 80 }, ACTOR_ID)

    const updateArgs = prisma.entregaBloque.update.mock.calls[0]?.[0] as {
      data?: { feedback?: string | null }
    }
    expect(updateArgs?.data?.feedback).toBeUndefined()
  })
})

// =============================================================================
// AJUSTAR (A26 · EVALUADA o EVALUADA_AUTOMATICAMENTE → EVALUADA + manual)
// =============================================================================

describe("ajustar", () => {
  const input: AjustarEntregaBloqueAdminInput = {
    nota: 90,
    feedback: "Reevaluado tras revision",
    motivoAjuste: "Error de calculo en el quiz, reviso pregunta 3",
  }

  function setupAjustar(prisma: PrismaMock, previo: ReturnType<typeof buildEntregaRow>) {
    prisma.entregaBloque.findUnique
      .mockResolvedValueOnce(previo)
      .mockResolvedValueOnce({ ...previo, estado: "EVALUADA", nota: new Prisma.Decimal(90) })
    prisma.entregaBloque.update.mockResolvedValue({
      id: previo.id,
      estado: "EVALUADA",
      nota: new Prisma.Decimal(90),
      feedback: input.feedback,
      ajustadaManual: true,
      evaluadaPorId: ACTOR_ID,
      evaluadaAt: NOW,
    })
    prisma.entregaBloque.findMany.mockResolvedValue([])
    prisma.logActividad.create.mockResolvedValue({})
  }

  it("EVALUADA → EVALUADA con ajustadaManual=true", async () => {
    const { service, prisma } = buildService()
    const previo = buildEntregaRow({ estado: "EVALUADA", nota: 70 })
    setupAjustar(prisma, previo)

    await service.ajustar(ENTREGA_ID, input, ACTOR_ID)

    const updateArgs = prisma.entregaBloque.update.mock.calls[0]?.[0] as {
      data?: { estado?: string; ajustadaManual?: boolean; evaluadaPorId?: string }
    }
    expect(updateArgs?.data?.estado).toBe("EVALUADA")
    expect(updateArgs?.data?.ajustadaManual).toBe(true)
    // Ajustar desde EVALUADA NO reasigna evaluadaPorId (lo conserva).
    expect(updateArgs?.data?.evaluadaPorId).toBeUndefined()
  })

  it("EVALUADA_AUTOMATICAMENTE → EVALUADA con ajustadaManual=true", async () => {
    const { service, prisma } = buildService()
    const previo = buildEntregaRow({ estado: "EVALUADA_AUTOMATICAMENTE", nota: 50 })
    setupAjustar(prisma, previo)

    await service.ajustar(ENTREGA_ID, input, ACTOR_ID)

    const updateArgs = prisma.entregaBloque.update.mock.calls[0]?.[0] as {
      data?: { estado?: string; ajustadaManual?: boolean }
    }
    expect(updateArgs?.data?.estado).toBe("EVALUADA")
    expect(updateArgs?.data?.ajustadaManual).toBe(true)
  })

  it("registra log NOTA_AJUSTADA_MANUAL con motivo en valorDespues", async () => {
    const { service, prisma } = buildService()
    const previo = buildEntregaRow({ estado: "EVALUADA", nota: 70 })
    setupAjustar(prisma, previo)

    await service.ajustar(ENTREGA_ID, input, ACTOR_ID)

    expect(prisma.logActividad.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          tipoAccion: "NOTA_AJUSTADA_MANUAL",
          entidadTipo: "EntregaBloque",
          actorId: ACTOR_ID,
          motivo: input.motivoAjuste,
        }),
      }),
    )

    const logCall = prisma.logActividad.create.mock.calls[0]?.[0] as {
      data: {
        valorAntes: { nota: number | null; ajustadaManual: boolean }
        valorDespues: { nota: number | null; ajustadaManual: boolean; motivo: string }
      }
    }
    expect(logCall.data.valorAntes.nota).toBe(70)
    expect(logCall.data.valorAntes.ajustadaManual).toBe(false)
    expect(logCall.data.valorDespues.nota).toBe(90)
    expect(logCall.data.valorDespues.ajustadaManual).toBe(true)
    expect(logCall.data.valorDespues.motivo).toBe(input.motivoAjuste)
  })

  it("permite ajustar en inscripcion COMPLETADA (correccion post-cierre)", async () => {
    const { service, prisma } = buildService()
    const previo = buildEntregaRow({
      estado: "EVALUADA",
      nota: 70,
      inscripcionEstado: "COMPLETADA",
    })
    setupAjustar(prisma, previo)

    await expect(service.ajustar(ENTREGA_ID, input, ACTOR_ID)).resolves.toBeDefined()
  })

  it("lanza 404 si la entrega no existe", async () => {
    const { service, prisma } = buildService()
    prisma.entregaBloque.findUnique.mockResolvedValue(null)

    await expect(service.ajustar(ENTREGA_ID, input, ACTOR_ID)).rejects.toThrow(NotFoundException)
  })

  it("lanza 409 si el curso esta CERRADO", async () => {
    const { service, prisma } = buildService()
    prisma.entregaBloque.findUnique.mockResolvedValue(
      buildEntregaRow({ estado: "EVALUADA", cursoEstado: "CERRADO" }),
    )

    await expect(service.ajustar(ENTREGA_ID, input, ACTOR_ID)).rejects.toThrow(ConflictException)
  })

  it("lanza 409 si la inscripcion esta ABANDONADA", async () => {
    const { service, prisma } = buildService()
    prisma.entregaBloque.findUnique.mockResolvedValue(
      buildEntregaRow({ estado: "EVALUADA", inscripcionEstado: "ABANDONADA" }),
    )

    await expect(service.ajustar(ENTREGA_ID, input, ACTOR_ID)).rejects.toThrow(ConflictException)
  })

  it("lanza 409 si la inscripcion esta CERRADO_SIN_COMPLETAR", async () => {
    const { service, prisma } = buildService()
    prisma.entregaBloque.findUnique.mockResolvedValue(
      buildEntregaRow({ estado: "EVALUADA", inscripcionEstado: "CERRADO_SIN_COMPLETAR" }),
    )

    await expect(service.ajustar(ENTREGA_ID, input, ACTOR_ID)).rejects.toThrow(ConflictException)
  })

  it("ajustar desde PENDIENTE_REVISION marca EVALUADA + ajustadaManual=true + log con motivo", async () => {
    const { service, prisma } = buildService()
    const previo = buildEntregaRow({ estado: "PENDIENTE_REVISION", nota: null })
    setupAjustar(prisma, previo)

    await service.ajustar(ENTREGA_ID, input, ACTOR_ID)

    const updateArgs = prisma.entregaBloque.update.mock.calls[0]?.[0] as {
      data?: {
        estado?: string
        ajustadaManual?: boolean
        evaluadaPorId?: string
        evaluadaAt?: Date
      }
    }
    expect(updateArgs?.data?.estado).toBe("EVALUADA")
    expect(updateArgs?.data?.ajustadaManual).toBe(true)
    expect(updateArgs?.data?.evaluadaPorId).toBe(ACTOR_ID)
    expect(updateArgs?.data?.evaluadaAt).toBeInstanceOf(Date)

    const logCall = prisma.logActividad.create.mock.calls[0]?.[0] as {
      data: { tipoAccion: string; motivo: string; valorAntes: { estado: string } }
    }
    expect(logCall.data.tipoAccion).toBe("NOTA_AJUSTADA_MANUAL")
    expect(logCall.data.motivo).toBe(input.motivoAjuste)
    expect(logCall.data.valorAntes.estado).toBe("PENDIENTE_REVISION")
  })

  it("ajustar desde EVALUADA_AUTOMATICAMENTE marca EVALUADA + ajustadaManual=true", async () => {
    const { service, prisma } = buildService()
    const previo = buildEntregaRow({ estado: "EVALUADA_AUTOMATICAMENTE", nota: 50 })
    setupAjustar(prisma, previo)

    await service.ajustar(ENTREGA_ID, input, ACTOR_ID)

    const updateArgs = prisma.entregaBloque.update.mock.calls[0]?.[0] as {
      data?: { estado?: string; ajustadaManual?: boolean; evaluadaPorId?: string }
    }
    expect(updateArgs?.data?.estado).toBe("EVALUADA")
    expect(updateArgs?.data?.ajustadaManual).toBe(true)
    expect(updateArgs?.data?.evaluadaPorId).toBe(ACTOR_ID)
  })

  it("ajustar desde EVALUADA NO reasigna evaluadaPorId/evaluadaAt", async () => {
    const { service, prisma } = buildService()
    const previo = buildEntregaRow({ estado: "EVALUADA", nota: 70 })
    setupAjustar(prisma, previo)

    await service.ajustar(ENTREGA_ID, input, ACTOR_ID)

    const updateArgs = prisma.entregaBloque.update.mock.calls[0]?.[0] as {
      data?: { estado?: string; evaluadaPorId?: string; evaluadaAt?: Date }
    }
    expect(updateArgs?.data?.estado).toBe("EVALUADA")
    expect(updateArgs?.data?.evaluadaPorId).toBeUndefined()
    expect(updateArgs?.data?.evaluadaAt).toBeUndefined()
  })

  it("ajustar sin feedback preserva el feedback previo (semantica PATCH)", async () => {
    const { service, prisma } = buildService()
    const previo = buildEntregaRow({ estado: "EVALUADA", nota: 70, feedback: "feedback previo" })
    setupAjustar(prisma, previo)

    await service.ajustar(ENTREGA_ID, { nota: 90, motivoAjuste: input.motivoAjuste }, ACTOR_ID)

    const updateArgs = prisma.entregaBloque.update.mock.calls[0]?.[0] as {
      data?: { feedback?: string | null }
    }
    expect(updateArgs?.data?.feedback).toBeUndefined()
  })

  it("ajustar con feedback=null borra el feedback previo", async () => {
    const { service, prisma } = buildService()
    const previo = buildEntregaRow({ estado: "EVALUADA", nota: 70, feedback: "feedback previo" })
    setupAjustar(prisma, previo)

    await service.ajustar(
      ENTREGA_ID,
      { nota: 90, feedback: null, motivoAjuste: input.motivoAjuste },
      ACTOR_ID,
    )

    const updateArgs = prisma.entregaBloque.update.mock.calls[0]?.[0] as {
      data?: { feedback?: string | null }
    }
    expect(updateArgs?.data?.feedback).toBeNull()
  })

  it("lanza 409 si la entrega esta ENVIADA", async () => {
    const { service, prisma } = buildService()
    prisma.entregaBloque.findUnique.mockResolvedValue(buildEntregaRow({ estado: "ENVIADA" }))

    await expect(service.ajustar(ENTREGA_ID, input, ACTOR_ID)).rejects.toThrow(ConflictException)
  })

  it("schema rechaza ajustar sin motivoAjuste", () => {
    const result = ajustarEntregaBloqueAdminInputSchema.safeParse({ nota: 90 })
    expect(result.success).toBe(false)
  })

  it("schema rechaza motivoAjuste solo whitespace", () => {
    const result = ajustarEntregaBloqueAdminInputSchema.safeParse({
      nota: 90,
      motivoAjuste: "          ",
    })
    expect(result.success).toBe(false)
  })

  it("schema rechaza motivoAjuste muy corto (< 10 chars)", () => {
    const result = ajustarEntregaBloqueAdminInputSchema.safeParse({
      nota: 90,
      motivoAjuste: "Corto",
    })
    expect(result.success).toBe(false)
  })

  it("schema rechaza nota fuera de rango", () => {
    const result = ajustarEntregaBloqueAdminInputSchema.safeParse({
      nota: 150,
      motivoAjuste: "Motivo valido y suficientemente largo",
    })
    expect(result.success).toBe(false)
  })

  it("schema rechaza claves desconocidas (.strict() — anti spoof ajustadaManual=false)", () => {
    const result = ajustarEntregaBloqueAdminInputSchema.safeParse({
      nota: 90,
      motivoAjuste: "Motivo valido y suficientemente largo",
      ajustadaManual: false,
    })
    expect(result.success).toBe(false)
  })

  it("schema acepta ajuste con feedback omitido", () => {
    const result = ajustarEntregaBloqueAdminInputSchema.safeParse({
      nota: 90,
      motivoAjuste: "Motivo valido y suficientemente largo",
    })
    expect(result.success).toBe(true)
  })
})
