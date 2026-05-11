import { NotFoundException } from "@nestjs/common"
import { OrigenNotaSkill, Prisma, RolUsuario } from "@prisma/client"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { apiErrorCodes } from "../../common/errors/api-error.codes"
import { PrismaService } from "../../common/prisma/prisma.service"
import { SesionUsuario } from "../../common/types/sesion.types"
import { FichaService } from "./ficha.service"

const COL_ID = "col-1"
const ADMIN_ID = "usr-admin"
const PART_USR_ID = "usr-part"

interface PrismaMock {
  colaborador: { findUnique: ReturnType<typeof vi.fn> }
  skill: { findMany: ReturnType<typeof vi.fn>; findUnique: ReturnType<typeof vi.fn> }
  notaSkill: {
    findMany: ReturnType<typeof vi.fn>
    findUnique: ReturnType<typeof vi.fn>
  }
  historicoNotaSkill: {
    findMany: ReturnType<typeof vi.fn>
    count: ReturnType<typeof vi.fn>
  }
  $transaction: ReturnType<typeof vi.fn>
}

function buildPrismaMock(): PrismaMock {
  return {
    colaborador: { findUnique: vi.fn() },
    skill: { findMany: vi.fn(), findUnique: vi.fn() },
    notaSkill: { findMany: vi.fn(), findUnique: vi.fn() },
    historicoNotaSkill: { findMany: vi.fn(), count: vi.fn() },
    $transaction: vi.fn(),
  }
}

const SESION_ADMIN: SesionUsuario = { usuarioId: ADMIN_ID, rol: RolUsuario.ADMIN }
const SESION_PART_PROPIO: SesionUsuario = { usuarioId: PART_USR_ID, rol: RolUsuario.PARTICIPANTE }

const SKILLS_MOCK = [
  {
    id: "skill-1",
    etiquetaVisible: "python.fastapi",
    areaId: "area-1",
    area: { id: "area-1", nombre: "Backend" },
  },
  {
    id: "skill-2",
    etiquetaVisible: "python.basico",
    areaId: "area-1",
    area: { id: "area-1", nombre: "Backend" },
  },
  {
    id: "skill-3",
    etiquetaVisible: "git.rebase",
    areaId: "area-2",
    area: { id: "area-2", nombre: "Tooling" },
  },
]

describe("FichaService.obtenerFicha", () => {
  let prisma: PrismaMock
  let service: FichaService

  beforeEach(() => {
    prisma = buildPrismaMock()
    service = new FichaService(prisma as unknown as PrismaService)
  })

  it("ADMIN: ficha vacia (sin notas) — notaActual queda null explicito, promedio null", async () => {
    prisma.colaborador.findUnique.mockResolvedValue({
      id: COL_ID,
      usuario: { id: PART_USR_ID },
    })
    prisma.skill.findMany.mockResolvedValue(SKILLS_MOCK)
    prisma.notaSkill.findMany.mockResolvedValue([])

    const ficha = await service.obtenerFicha(COL_ID, SESION_ADMIN)

    expect(ficha.colaboradorId).toBe(COL_ID)
    expect(ficha.skills).toHaveLength(3)
    for (const s of ficha.skills) {
      expect(s.notaActual).toBeNull()
      expect(s.origenActual).toBeNull()
    }
    expect(ficha.porArea).toHaveLength(2)
    for (const a of ficha.porArea) {
      expect(a.promedio).toBeNull()
      expect(a.skillsConNota).toBe(0)
    }
  })

  it("ADMIN: ficha con notas — promedio por area solo sobre skills con nota", async () => {
    prisma.colaborador.findUnique.mockResolvedValue({
      id: COL_ID,
      usuario: { id: PART_USR_ID },
    })
    prisma.skill.findMany.mockResolvedValue(SKILLS_MOCK)
    prisma.notaSkill.findMany.mockResolvedValue([
      {
        id: "ns-1",
        skillId: "skill-1",
        notaActual: new Prisma.Decimal("86"),
        origenActual: { curso: "c1" },
      },
      {
        id: "ns-2",
        skillId: "skill-2",
        notaActual: new Prisma.Decimal("70"),
        origenActual: null,
      },
    ])

    const ficha = await service.obtenerFicha(COL_ID, SESION_ADMIN)
    const skill1 = ficha.skills.find((s) => s.skillId === "skill-1")
    expect(skill1?.notaActual).toBe(86)
    expect(skill1?.origenActual).toEqual({ curso: "c1" })

    const skill3 = ficha.skills.find((s) => s.skillId === "skill-3")
    expect(skill3?.notaActual).toBeNull()

    const areaBackend = ficha.porArea.find((a) => a.areaId === "area-1")
    expect(areaBackend?.promedio).toBe(78) // (86 + 70) / 2
    expect(areaBackend?.skillsConNota).toBe(2)
    expect(areaBackend?.skillsTotales).toBe(2)

    const areaTooling = ficha.porArea.find((a) => a.areaId === "area-2")
    expect(areaTooling?.promedio).toBeNull()
    expect(areaTooling?.skillsConNota).toBe(0)
    expect(areaTooling?.skillsTotales).toBe(1)
  })

  it("PARTICIPANTE consultando OTRA ficha: 404 colaboradorNoEncontrado (D-CUR-13)", async () => {
    prisma.colaborador.findUnique.mockResolvedValue({
      id: COL_ID,
      usuario: { id: "otro-usuario" }, // no es el de la sesion
    })

    let caught: unknown
    try {
      await service.obtenerFicha(COL_ID, SESION_PART_PROPIO)
    } catch (error) {
      caught = error
    }
    expect(caught).toBeInstanceOf(NotFoundException)
    const resp = (caught as NotFoundException).getResponse() as { code?: string }
    expect(resp.code).toBe(apiErrorCodes.colaboradorNoEncontrado)
  })

  it("PARTICIPANTE consultando un colaboradorId inexistente: 404 (no revela existencia)", async () => {
    prisma.colaborador.findUnique.mockResolvedValue(null)
    let caught: unknown
    try {
      await service.obtenerFicha("inexistente", SESION_PART_PROPIO)
    } catch (error) {
      caught = error
    }
    expect(caught).toBeInstanceOf(NotFoundException)
    const resp = (caught as NotFoundException).getResponse() as { code?: string }
    expect(resp.code).toBe(apiErrorCodes.colaboradorNoEncontrado)
  })

  it("ADMIN consultando colaboradorId inexistente: 404", async () => {
    prisma.colaborador.findUnique.mockResolvedValue(null)
    await expect(service.obtenerFicha("xxx", SESION_ADMIN)).rejects.toBeInstanceOf(
      NotFoundException,
    )
  })
})

describe("FichaService.listarHistoricoSkill", () => {
  let prisma: PrismaMock
  let service: FichaService

  beforeEach(() => {
    prisma = buildPrismaMock()
    service = new FichaService(prisma as unknown as PrismaService)
    prisma.$transaction.mockImplementation(async (ops: unknown[]) => {
      const calls = ops as Promise<unknown>[]
      return await Promise.all(calls)
    })
  })

  it("skill inexistente: 404 skillNoEncontrada", async () => {
    prisma.colaborador.findUnique.mockResolvedValue({ id: COL_ID, usuario: { id: PART_USR_ID } })
    prisma.skill.findUnique.mockResolvedValue(null)

    let caught: unknown
    try {
      await service.listarHistoricoSkill(COL_ID, "skill-x", { page: 1, pageSize: 20 }, SESION_ADMIN)
    } catch (error) {
      caught = error
    }
    expect(caught).toBeInstanceOf(NotFoundException)
    const resp = (caught as NotFoundException).getResponse() as { code?: string }
    expect(resp.code).toBe(apiErrorCodes.skillNoEncontrada)
  })

  it("sin NotaSkill: devuelve pagina vacia (no 404)", async () => {
    prisma.colaborador.findUnique.mockResolvedValue({ id: COL_ID, usuario: { id: PART_USR_ID } })
    prisma.skill.findUnique.mockResolvedValue({ id: "skill-1" })
    prisma.notaSkill.findUnique.mockResolvedValue(null)

    const res = await service.listarHistoricoSkill(
      COL_ID,
      "skill-1",
      { page: 1, pageSize: 20 },
      SESION_ADMIN,
    )
    expect(res.data).toEqual([])
    expect(res.meta.total).toBe(0)
  })

  it("historico paginado: orden DESC por fecha, Decimal -> number", async () => {
    prisma.colaborador.findUnique.mockResolvedValue({ id: COL_ID, usuario: { id: PART_USR_ID } })
    prisma.skill.findUnique.mockResolvedValue({ id: "skill-1" })
    prisma.notaSkill.findUnique.mockResolvedValue({ id: "ns-1" })
    prisma.historicoNotaSkill.findMany.mockResolvedValue([
      {
        id: "h-1",
        fecha: new Date("2026-05-11T12:00:00Z"),
        valor: new Prisma.Decimal("86"),
        origen: OrigenNotaSkill.ENTREVISTA_INICIAL,
        referencia: { archivoId: "a-1" },
        autorUsuarioId: ADMIN_ID,
      },
      {
        id: "h-2",
        fecha: new Date("2026-05-10T10:00:00Z"),
        valor: null,
        origen: OrigenNotaSkill.ENTREVISTA_INICIAL,
        referencia: null,
        autorUsuarioId: null,
      },
    ])
    prisma.historicoNotaSkill.count.mockResolvedValue(2)

    const res = await service.listarHistoricoSkill(
      COL_ID,
      "skill-1",
      { page: 1, pageSize: 20 },
      SESION_ADMIN,
    )

    expect(res.meta.total).toBe(2)
    expect(res.data).toHaveLength(2)
    expect(res.data[0]?.id).toBe("h-1")
    expect(res.data[0]?.valor).toBe(86)
    expect(res.data[1]?.valor).toBeNull()
    expect(res.data[1]?.autorUsuarioId).toBeNull()
  })

  it("PARTICIPANTE consultando historico de OTRO: 404", async () => {
    prisma.colaborador.findUnique.mockResolvedValue({
      id: COL_ID,
      usuario: { id: "otro" },
    })
    await expect(
      service.listarHistoricoSkill(
        COL_ID,
        "skill-1",
        { page: 1, pageSize: 20 },
        SESION_PART_PROPIO,
      ),
    ).rejects.toBeInstanceOf(NotFoundException)
  })
})
