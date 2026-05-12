import { OrigenNotaSkill, Prisma } from "@prisma/client"
import { describe, expect, it, vi } from "vitest"
import { NotaSkillService } from "./nota-skill.service"

const COLAB_ID = "f0000000-0000-0000-0000-000000000001"
const SKILL_ID = "31111111-1111-1111-1111-111111111111"
const CURSO_ID = "c0000000-0000-0000-0000-000000000001"
const TRANSVERSAL_ID = "12222222-2222-2222-2222-222222222222"

function makeIntento(
  id: string,
  fecha: Date,
  overrides: {
    estado?: string
    anulado?: boolean
    aprobado?: boolean | null
    nota?: number | null
  },
): {
  id: string
  estado: string
  anulado: boolean
  aprobado: boolean | null
  notaGlobal: Prisma.Decimal | null
  fecha: Date
} {
  return {
    id,
    estado: overrides.estado ?? "FINALIZADO",
    anulado: overrides.anulado ?? false,
    aprobado: overrides.aprobado ?? true,
    notaGlobal:
      overrides.nota === null || overrides.nota === undefined
        ? null
        : new Prisma.Decimal(overrides.nota),
    fecha,
  }
}

describe("NotaSkillService - obtenerIntentoTransversalVigente (D-S8-C5)", () => {
  const svc = new NotaSkillService()

  it("lista vacia -> null", () => {
    expect(svc.obtenerIntentoTransversalVigente([])).toBeNull()
  })

  it("filtra anulados antes de elegir vigente", () => {
    const intentos = [
      makeIntento("a", new Date("2026-05-01"), { aprobado: true, nota: 80 }),
      makeIntento("b", new Date("2026-05-02"), { anulado: true, nota: 90 }),
    ]
    const vigente = svc.obtenerIntentoTransversalVigente(intentos)
    expect(vigente?.id).toBe("a")
  })

  it("ultimo aprobado -> lo devuelve", () => {
    const intentos = [
      makeIntento("a", new Date("2026-05-01"), { aprobado: true, nota: 80 }),
      makeIntento("b", new Date("2026-05-02"), { aprobado: true, nota: 90 }),
    ]
    expect(svc.obtenerIntentoTransversalVigente(intentos)?.id).toBe("b")
  })

  it("ultimo no aprobado -> usa anterior aprobado", () => {
    const intentos = [
      makeIntento("a", new Date("2026-05-01"), { aprobado: true, nota: 80 }),
      makeIntento("b", new Date("2026-05-02"), { aprobado: false, nota: 50 }),
    ]
    expect(svc.obtenerIntentoTransversalVigente(intentos)?.id).toBe("a")
  })

  it("ningun aprobado -> null", () => {
    const intentos = [
      makeIntento("a", new Date("2026-05-01"), { aprobado: false, nota: 40 }),
      makeIntento("b", new Date("2026-05-02"), { aprobado: false, nota: 50 }),
    ]
    expect(svc.obtenerIntentoTransversalVigente(intentos)).toBeNull()
  })
})

describe("NotaSkillService - calcularNotaActualSkill (D33 + D35)", () => {
  const svc = new NotaSkillService()
  const pesos = { bloques: 70, transversal: 20, entrevista: 10 }

  it("solo bloques -> 100% bloques", () => {
    const r = svc.calcularNotaActualSkill(
      { bloques: 80, transversal: null, entrevista: null },
      pesos,
    )
    expect(r).toBe(80)
  })

  it("bloques+transversal (sin entrevista) -> reescala 70/20 a 100%", () => {
    // pesos vivos suman 90 -> bloques 70/90, transversal 20/90
    // 0.7778*70 + 0.2222*80 = 54.444 + 17.778 = 72.22
    const r = svc.calcularNotaActualSkill({ bloques: 70, transversal: 80, entrevista: null }, pesos)
    expect(r).toBe(72.22)
  })

  it("las 3 fuentes presentes -> ponderado 70/20/10", () => {
    const r = svc.calcularNotaActualSkill({ bloques: 80, transversal: 90, entrevista: 100 }, pesos)
    // 0.7*80 + 0.2*90 + 0.1*100 = 56 + 18 + 10 = 84
    expect(r).toBe(84)
  })

  it("solo transversal -> 100% transversal", () => {
    const r = svc.calcularNotaActualSkill(
      { bloques: null, transversal: 75, entrevista: null },
      pesos,
    )
    expect(r).toBe(75)
  })

  it("todas las fuentes null -> null", () => {
    const r = svc.calcularNotaActualSkill(
      { bloques: null, transversal: null, entrevista: null },
      pesos,
    )
    expect(r).toBeNull()
  })

  it("pesos negativos / cero se ignoran", () => {
    const r = svc.calcularNotaActualSkill(
      { bloques: 80, transversal: 80, entrevista: 80 },
      { bloques: 0, transversal: 0, entrevista: 0 },
    )
    expect(r).toBeNull()
  })
})

describe("NotaSkillService.recalcularConFuentes - integracion con tx (D-S8-C6)", () => {
  const svc = new NotaSkillService()

  function buildTx() {
    return {
      curso: {
        findUniqueOrThrow: vi.fn().mockResolvedValue({
          pesoBloques: new Prisma.Decimal(70),
          pesoTransversal: new Prisma.Decimal(20),
          pesoEntrevista: new Prisma.Decimal(10),
          transversalId: TRANSVERSAL_ID,
          entrevistaIaId: null,
        }),
      },
      intentoBloque: {
        findMany: vi.fn().mockResolvedValue([{ nota: new Prisma.Decimal(80) }]),
      },
      transversalSkill: {
        findFirst: vi.fn().mockResolvedValue({ transversalId: TRANSVERSAL_ID }),
      },
      intentoTransversal: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "i1",
            estado: "FINALIZADO",
            anulado: false,
            aprobado: true,
            notaGlobal: new Prisma.Decimal(85),
            fecha: new Date("2026-05-01"),
          },
        ]),
      },
      notaSkill: {
        upsert: vi.fn().mockResolvedValue({ id: "ns-1" }),
      },
      historicoNotaSkill: {
        create: vi.fn().mockResolvedValue({}),
      },
    }
  }

  it("integra bloques (80) + transversal vigente (85) con D33 -> upsert + historico", async () => {
    const tx = buildTx()
    const r = await svc.recalcularConFuentes(tx as never, {
      colaboradorId: COLAB_ID,
      skillId: SKILL_ID,
      cursoId: CURSO_ID,
      origen: OrigenNotaSkill.TRANSVERSAL,
      referencia: { evento: "FINALIZADO" },
    })
    // 70 + 20 vivos -> bloques 7/9, transversal 2/9
    // 0.7778*80 + 0.2222*85 = 62.222 + 18.889 = 81.11
    expect(r.notaActual).toBe(81.11)
    expect(tx.notaSkill.upsert).toHaveBeenCalledOnce()
    expect(tx.historicoNotaSkill.create).toHaveBeenCalledOnce()
    const histArgs = tx.historicoNotaSkill.create.mock.calls[0]?.[0] as {
      data: { origen: OrigenNotaSkill }
    }
    expect(histArgs.data.origen).toBe(OrigenNotaSkill.TRANSVERSAL)
  })

  it("si transversalId del curso es null -> nota = bloques puros", async () => {
    const tx = buildTx()
    tx.curso.findUniqueOrThrow = vi.fn().mockResolvedValue({
      pesoBloques: new Prisma.Decimal(70),
      pesoTransversal: new Prisma.Decimal(20),
      pesoEntrevista: new Prisma.Decimal(10),
      transversalId: null,
      entrevistaIaId: null,
    })
    const r = await svc.recalcularConFuentes(tx as never, {
      colaboradorId: COLAB_ID,
      skillId: SKILL_ID,
      cursoId: CURSO_ID,
      origen: OrigenNotaSkill.TRANSVERSAL,
      referencia: { evento: "FINALIZADO" },
    })
    expect(r.notaActual).toBe(80)
  })

  it("intento transversal anulado -> recae al peso de bloques solo (§5.112)", async () => {
    const tx = buildTx()
    tx.intentoTransversal.findMany = vi.fn().mockResolvedValue([]) // filtrados todos
    const r = await svc.recalcularConFuentes(tx as never, {
      colaboradorId: COLAB_ID,
      skillId: SKILL_ID,
      cursoId: CURSO_ID,
      origen: OrigenNotaSkill.TRANSVERSAL,
      referencia: { evento: "ANULADO", motivoLength: 10 },
    })
    expect(r.notaActual).toBe(80)
  })
})
