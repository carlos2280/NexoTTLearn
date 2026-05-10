import { BadRequestException, NotFoundException } from "@nestjs/common"
import { actualizarPesosCursoInputSchema } from "@nexott-learn/shared-types"
import { describe, expect, it, vi } from "vitest"
import type { PrismaService } from "../../common/prisma/prisma.service"
import { CursosService } from "./cursos.service"

// Mock minimo del PrismaService limitado a lo que actualizarPesos toca.
// Replicar la interfaz completa solo para tests no aporta y rompe al menor
// cambio en otros modelos.
type Stub = ReturnType<typeof vi.fn>

interface PrismaMock {
  curso: { findUnique: Stub }
  cursoTipoPeso: { deleteMany: Stub; upsert: Stub }
  $transaction: Stub
}

function buildPrisma(): PrismaMock {
  return {
    curso: { findUnique: vi.fn() },
    cursoTipoPeso: { deleteMany: vi.fn(), upsert: vi.fn() },
    // El service llama tx.cursoTipoPeso.* dentro del callback. Pasar el mismo
    // mock como tx hace que las llamadas queden registradas en el spy.
    $transaction: vi.fn(),
  }
}

function buildService(prisma: PrismaMock = buildPrisma()) {
  const service = new CursosService(prisma as never as PrismaService)
  return { service, prisma }
}

// Detalle minimo que devuelve la re-lectura tras el upsert. Forma alineada
// con SELECT_DETALLE en el service.
function buildDetalleRow(tipoPesos: Array<{ tipo: string; peso: number; nivel: string }>) {
  return {
    id: "curso-1",
    titulo: "Curso demo",
    slug: "curso-demo",
    descripcion: null,
    estado: "BORRADOR" as const,
    nivel: "BASICO" as const,
    umbralExcelencia: 90,
    umbralAprobado: 70,
    umbralEnDesarrollo: 50,
    _count: { modulos: 0, inscripciones: 0 },
    inscripciones: [],
    tipoPesos,
  }
}

describe("CursosService.actualizarPesos", () => {
  it("happy path: upsert de pesos intra-modulo y devuelve detalle con activo derivado", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValueOnce({ id: "curso-1", estado: "BORRADOR" })
    prisma.$transaction.mockImplementation((fn: (tx: PrismaMock) => Promise<unknown>) => fn(prisma))
    prisma.cursoTipoPeso.deleteMany.mockResolvedValue({ count: 0 })
    prisma.cursoTipoPeso.upsert.mockResolvedValue({})
    prisma.curso.findUnique.mockResolvedValueOnce(
      buildDetalleRow([
        { tipo: "quiz", peso: 20, nivel: "modulo" },
        { tipo: "ejercicio", peso: 35, nivel: "modulo" },
        { tipo: "codigo", peso: 15, nivel: "modulo" },
        { tipo: "mini_proyecto", peso: 30, nivel: "modulo" },
      ]),
    )

    const detalle = await service.actualizarPesos("curso-1", {
      pesos: [
        { tipo: "quiz", peso: 20, nivel: "modulo" },
        { tipo: "ejercicio", peso: 35, nivel: "modulo" },
        { tipo: "codigo", peso: 15, nivel: "modulo" },
        { tipo: "mini_proyecto", peso: 30, nivel: "modulo" },
      ],
    })

    // 4 upserts (uno por tipo) + 1 deleteMany (por el unico nivel del input).
    expect(prisma.cursoTipoPeso.upsert).toHaveBeenCalledTimes(4)
    expect(prisma.cursoTipoPeso.deleteMany).toHaveBeenCalledTimes(1)
    expect(prisma.cursoTipoPeso.deleteMany).toHaveBeenCalledWith({
      where: {
        cursoId: "curso-1",
        nivel: "modulo",
        tipo: { notIn: ["quiz", "ejercicio", "codigo", "mini_proyecto"] },
      },
    })
    // `activo` se deriva en el mapper: peso > 0 → true.
    expect(detalle.tipoPesos).toHaveLength(4)
    expect(detalle.tipoPesos.every((p) => p.activo)).toBe(true)
  })

  it("desactivar entrevista: borra los tipos del nivel que no vienen en el input", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValueOnce({ id: "curso-1", estado: "BORRADOR" })
    prisma.$transaction.mockImplementation((fn: (tx: PrismaMock) => Promise<unknown>) => fn(prisma))
    prisma.cursoTipoPeso.deleteMany.mockResolvedValue({ count: 1 })
    prisma.cursoTipoPeso.upsert.mockResolvedValue({})
    prisma.curso.findUnique.mockResolvedValueOnce(
      buildDetalleRow([{ tipo: "proyecto", peso: 30, nivel: "curso" }]),
    )

    await service.actualizarPesos("curso-1", {
      pesos: [{ tipo: "proyecto", peso: 30, nivel: "curso" }],
    })

    // El deleteMany debe filtrar entrevista (notIn solo contiene proyecto).
    expect(prisma.cursoTipoPeso.deleteMany).toHaveBeenCalledWith({
      where: {
        cursoId: "curso-1",
        nivel: "curso",
        tipo: { notIn: ["proyecto"] },
      },
    })
  })

  it("404 si el curso no existe", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValueOnce(null)

    await expect(
      service.actualizarPesos("curso-X", {
        pesos: [
          { tipo: "quiz", peso: 25, nivel: "modulo" },
          { tipo: "ejercicio", peso: 25, nivel: "modulo" },
          { tipo: "codigo", peso: 25, nivel: "modulo" },
          { tipo: "mini_proyecto", peso: 25, nivel: "modulo" },
        ],
      }),
    ).rejects.toBeInstanceOf(NotFoundException)
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })

  it("400 si el curso esta DESHABILITADO", async () => {
    const { service, prisma } = buildService()
    prisma.curso.findUnique.mockResolvedValueOnce({ id: "curso-1", estado: "DESHABILITADO" })

    await expect(
      service.actualizarPesos("curso-1", {
        pesos: [
          { tipo: "quiz", peso: 25, nivel: "modulo" },
          { tipo: "ejercicio", peso: 25, nivel: "modulo" },
          { tipo: "codigo", peso: 25, nivel: "modulo" },
          { tipo: "mini_proyecto", peso: 25, nivel: "modulo" },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException)
    expect(prisma.$transaction).not.toHaveBeenCalled()
  })
})

// Validacion del schema Zod (input). El service confia en que el pipe ya
// haya validado, pero el contrato es el schema — testear la validacion aqui
// previene regresiones en la regla de negocio (suma=100 intra, <=100 curso).
describe("actualizarPesosCursoInputSchema", () => {
  it("rechaza cuando la suma intra-modulo no es 100", () => {
    const result = actualizarPesosCursoInputSchema.safeParse({
      pesos: [
        { tipo: "quiz", peso: 20, nivel: "modulo" },
        { tipo: "ejercicio", peso: 30, nivel: "modulo" },
        { tipo: "codigo", peso: 15, nivel: "modulo" },
        { tipo: "mini_proyecto", peso: 30, nivel: "modulo" },
      ],
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const mensajes = result.error.issues.map((i) => i.message)
      expect(mensajes.some((m) => m.includes("intra-modulo debe ser 100"))).toBe(true)
    }
  })

  it("acepta suma exactamente 100 con tolerancia float (33.33+33.33+33.34)", () => {
    const result = actualizarPesosCursoInputSchema.safeParse({
      pesos: [
        { tipo: "quiz", peso: 33.33, nivel: "modulo" },
        { tipo: "ejercicio", peso: 33.33, nivel: "modulo" },
        { tipo: "codigo", peso: 33.34, nivel: "modulo" },
        { tipo: "mini_proyecto", peso: 0, nivel: "modulo" },
      ],
    })
    expect(result.success).toBe(true)
  })

  it("rechaza tipo intra-modulo con nivel='curso'", () => {
    const result = actualizarPesosCursoInputSchema.safeParse({
      pesos: [{ tipo: "quiz", peso: 100, nivel: "curso" }],
    })
    expect(result.success).toBe(false)
  })

  it("rechaza suma a nivel curso > 100", () => {
    const result = actualizarPesosCursoInputSchema.safeParse({
      pesos: [
        { tipo: "proyecto", peso: 60, nivel: "curso" },
        { tipo: "entrevista", peso: 50, nivel: "curso" },
      ],
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const mensajes = result.error.issues.map((i) => i.message)
      expect(mensajes.some((m) => m.includes("nivel curso no puede exceder"))).toBe(true)
    }
  })

  it("acepta solo nivel curso (PATCH parcial sin tocar intra-modulo)", () => {
    const result = actualizarPesosCursoInputSchema.safeParse({
      pesos: [
        { tipo: "proyecto", peso: 20, nivel: "curso" },
        { tipo: "entrevista", peso: 10, nivel: "curso" },
      ],
    })
    expect(result.success).toBe(true)
  })
})
