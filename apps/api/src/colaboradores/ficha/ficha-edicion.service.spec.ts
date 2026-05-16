import { ConflictException, NotFoundException } from "@nestjs/common"
import { EstadoSkill, Prisma } from "@prisma/client"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { PrismaService } from "../../common/prisma/prisma.service"
import { FichaEdicionService } from "./ficha-edicion.service"

const COLAB_ID = "11111111-1111-1111-1111-111111111111"
const SKILL_ID = "22222222-2222-2222-2222-222222222222"
const USR_ID = "33333333-3333-3333-3333-333333333333"

interface TxMock {
  notaSkill: {
    findUnique: ReturnType<typeof vi.fn>
    upsert: ReturnType<typeof vi.fn>
  }
  historicoNotaSkill: {
    create: ReturnType<typeof vi.fn>
  }
  planEstudio: {
    findMany: ReturnType<typeof vi.fn>
    updateMany: ReturnType<typeof vi.fn>
  }
}

interface PrismaMock {
  colaborador: { findUnique: ReturnType<typeof vi.fn> }
  skill: { findUnique: ReturnType<typeof vi.fn> }
  $transaction: ReturnType<typeof vi.fn>
}

function buildTxMock(): TxMock {
  return {
    notaSkill: { findUnique: vi.fn(), upsert: vi.fn() },
    historicoNotaSkill: { create: vi.fn() },
    planEstudio: { findMany: vi.fn(), updateMany: vi.fn() },
  }
}

function buildPrismaMock(tx: TxMock): PrismaMock {
  return {
    colaborador: { findUnique: vi.fn() },
    skill: { findUnique: vi.fn() },
    $transaction: vi.fn(async (cb: (tx: unknown) => Promise<unknown>) => cb(tx)),
  }
}

function build(): { service: FichaEdicionService; prisma: PrismaMock; tx: TxMock } {
  const tx = buildTxMock()
  const prisma = buildPrismaMock(tx)
  const service = new FichaEdicionService(prisma as unknown as PrismaService)
  return { service, prisma, tx }
}

const FECHA = new Date("2026-05-11T15:00:00Z")

function input(valor: number | null, motivo = "Correccion manual") {
  return {
    colaboradorId: COLAB_ID,
    skillId: SKILL_ID,
    valor,
    motivo,
    usuarioId: USR_ID,
  }
}

describe("FichaEdicionService.editarSkill", () => {
  let h: ReturnType<typeof build>

  beforeEach(() => {
    h = build()
    h.tx.notaSkill.findUnique.mockResolvedValue(null)
    h.tx.notaSkill.upsert.mockResolvedValue({
      id: "nota-id",
      notaActual: new Prisma.Decimal(78),
      updatedAt: FECHA,
    })
    h.tx.historicoNotaSkill.create.mockResolvedValue({ id: "hist-id" })
    h.tx.planEstudio.findMany.mockResolvedValue([])
    h.tx.planEstudio.updateMany.mockResolvedValue({ count: 0 })
  })

  it("happy path: valor 78 + motivo -> response correcta y audit con valorAnterior null", async () => {
    h.prisma.colaborador.findUnique.mockResolvedValue({ id: COLAB_ID })
    h.prisma.skill.findUnique.mockResolvedValue({ id: SKILL_ID, estado: EstadoSkill.ACTIVA })
    const result = await h.service.editarSkill(input(78))
    expect(result.response).toEqual({
      colaboradorId: COLAB_ID,
      skillId: SKILL_ID,
      notaActual: 78,
      origenActual: "MANUAL",
      actualizadoEn: FECHA.toISOString(),
    })
    expect(result.valorAnterior).toBeNull()
    const upsertArgs = h.tx.notaSkill.upsert.mock.calls[0]?.[0] as {
      create: { origenActual: { origen: string; motivo: string } }
    }
    expect(upsertArgs.create.origenActual.origen).toBe("MANUAL")
    expect(upsertArgs.create.origenActual.motivo).toBe("Correccion manual")
    expect(h.tx.historicoNotaSkill.create).toHaveBeenCalledTimes(1)
    const histArgs = h.tx.historicoNotaSkill.create.mock.calls[0]?.[0] as {
      data: { origen: string; valor: number; autorUsuarioId: string }
    }
    expect(histArgs.data.origen).toBe("MANUAL")
    expect(histArgs.data.valor).toBe(78)
    expect(histArgs.data.autorUsuarioId).toBe(USR_ID)
  })

  it("valor null (desmarcar): persistido como null, response notaActual null", async () => {
    h.prisma.colaborador.findUnique.mockResolvedValue({ id: COLAB_ID })
    h.prisma.skill.findUnique.mockResolvedValue({ id: SKILL_ID, estado: EstadoSkill.ACTIVA })
    h.tx.notaSkill.upsert.mockResolvedValue({
      id: "nota-id",
      notaActual: null,
      updatedAt: FECHA,
    })
    const result = await h.service.editarSkill(input(null))
    expect(result.response.notaActual).toBeNull()
    const histArgs = h.tx.historicoNotaSkill.create.mock.calls[0]?.[0] as {
      data: { valor: number | null }
    }
    expect(histArgs.data.valor).toBeNull()
  })

  it("valor anterior se captura para el audit log", async () => {
    h.prisma.colaborador.findUnique.mockResolvedValue({ id: COLAB_ID })
    h.prisma.skill.findUnique.mockResolvedValue({ id: SKILL_ID, estado: EstadoSkill.ACTIVA })
    h.tx.notaSkill.findUnique.mockResolvedValue({ notaActual: new Prisma.Decimal(60) })
    const result = await h.service.editarSkill(input(85))
    expect(result.valorAnterior).toBe(60)
  })

  it("colaborador no existe: 404 sin tocar tx", async () => {
    h.prisma.colaborador.findUnique.mockResolvedValue(null)
    await expect(h.service.editarSkill(input(78))).rejects.toThrow(NotFoundException)
    expect(h.prisma.$transaction).not.toHaveBeenCalled()
  })

  it("skill no existe: 404 SKILL_NO_ENCONTRADA", async () => {
    h.prisma.colaborador.findUnique.mockResolvedValue({ id: COLAB_ID })
    h.prisma.skill.findUnique.mockResolvedValue(null)
    await expect(h.service.editarSkill(input(78))).rejects.toThrow(NotFoundException)
    expect(h.prisma.$transaction).not.toHaveBeenCalled()
  })

  it("skill archivada: 409 SKILL_NO_ACTIVA", async () => {
    h.prisma.colaborador.findUnique.mockResolvedValue({ id: COLAB_ID })
    h.prisma.skill.findUnique.mockResolvedValue({
      id: SKILL_ID,
      estado: EstadoSkill.ARCHIVADA,
    })
    await expect(h.service.editarSkill(input(78))).rejects.toThrow(ConflictException)
    expect(h.prisma.$transaction).not.toHaveBeenCalled()
  })

  it("planes desactualizados marcados para el colaborador afectado", async () => {
    h.prisma.colaborador.findUnique.mockResolvedValue({ id: COLAB_ID })
    h.prisma.skill.findUnique.mockResolvedValue({ id: SKILL_ID, estado: EstadoSkill.ACTIVA })
    h.tx.planEstudio.findMany.mockResolvedValue([{ id: "plan-1" }])
    h.tx.planEstudio.updateMany.mockResolvedValue({ count: 1 })
    await h.service.editarSkill(input(50))
    const findManyArgs = h.tx.planEstudio.findMany.mock.calls[0]?.[0] as {
      where: { asignacion: { colaboradorId: string } }
    }
    expect(findManyArgs.where.asignacion.colaboradorId).toBe(COLAB_ID)
    expect(h.tx.planEstudio.updateMany).toHaveBeenCalledOnce()
  })

  it("upsert update: misma fila preexistente actualiza notaActual + origenActual", async () => {
    h.prisma.colaborador.findUnique.mockResolvedValue({ id: COLAB_ID })
    h.prisma.skill.findUnique.mockResolvedValue({ id: SKILL_ID, estado: EstadoSkill.ACTIVA })
    h.tx.notaSkill.findUnique.mockResolvedValue({ notaActual: new Prisma.Decimal(30) })
    await h.service.editarSkill(input(45, "Subida tras revision"))
    const upsertArgs = h.tx.notaSkill.upsert.mock.calls[0]?.[0] as {
      update: { notaActual: number; origenActual: { motivo: string; origen: string } }
    }
    expect(upsertArgs.update.notaActual).toBe(45)
    expect(upsertArgs.update.origenActual.origen).toBe("MANUAL")
    expect(upsertArgs.update.origenActual.motivo).toBe("Subida tras revision")
  })
})
