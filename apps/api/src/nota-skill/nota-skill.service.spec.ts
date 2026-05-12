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

// =============================================================================
// P8c — obtenerIntentoEntrevistaVigente + recalculo con entrevista IA
// =============================================================================

const ENTREVISTA_IA_ID = "e1111111-1111-1111-1111-111111111111"

interface IntentoEntrevistaMock {
  id: string
  estado: string
  anulado: boolean
  aprobado: boolean | null
  notaGlobal: Prisma.Decimal | null
  notaAjustadaAdmin: Prisma.Decimal | null
  notaAreaPorSkill: number | null
  fecha: Date
}

function makeIntentoEntrevista(
  id: string,
  fecha: Date,
  o: {
    anulado?: boolean
    aprobado?: boolean | null
    notaGlobal?: number | null
    notaAjustadaAdmin?: number | null
    notaArea?: number | null
  } = {},
): IntentoEntrevistaMock {
  return {
    id,
    estado: "FINALIZADO",
    anulado: o.anulado ?? false,
    aprobado: o.aprobado ?? true,
    notaGlobal:
      o.notaGlobal === null || o.notaGlobal === undefined ? null : new Prisma.Decimal(o.notaGlobal),
    notaAjustadaAdmin:
      o.notaAjustadaAdmin === null || o.notaAjustadaAdmin === undefined
        ? null
        : new Prisma.Decimal(o.notaAjustadaAdmin),
    notaAreaPorSkill: o.notaArea ?? null,
    fecha,
  }
}

describe("NotaSkillService - obtenerIntentoEntrevistaVigente (P8c)", () => {
  const svc = new NotaSkillService()

  it("filtra anulados y devuelve el ultimo aprobado", () => {
    const intentos = [
      makeIntentoEntrevista("a", new Date("2026-05-01"), { aprobado: true, notaArea: 80 }),
      makeIntentoEntrevista("b", new Date("2026-05-02"), { anulado: true, notaArea: 90 }),
    ]
    const vigente = svc.obtenerIntentoEntrevistaVigente(intentos)
    expect(vigente?.id).toBe("a")
  })

  it("ultimo no aprobado -> usa anterior aprobado", () => {
    const intentos = [
      makeIntentoEntrevista("a", new Date("2026-05-01"), { aprobado: true, notaArea: 80 }),
      makeIntentoEntrevista("b", new Date("2026-05-02"), { aprobado: false, notaArea: 40 }),
    ]
    expect(svc.obtenerIntentoEntrevistaVigente(intentos)?.id).toBe("a")
  })

  it("ningun aprobado -> null", () => {
    const intentos = [makeIntentoEntrevista("a", new Date("2026-05-01"), { aprobado: false })]
    expect(svc.obtenerIntentoEntrevistaVigente(intentos)).toBeNull()
  })
})

describe("NotaSkillService.recalcularConFuentes con entrevista IA (D-S8-D5, D33)", () => {
  const svc = new NotaSkillService()

  function buildTxConEntrevista(opciones: {
    notaArea?: number | null
    notaAjustadaAdmin?: number | null
    anulado?: boolean
  }) {
    return {
      curso: {
        findUniqueOrThrow: vi.fn().mockResolvedValue({
          pesoBloques: new Prisma.Decimal(70),
          pesoTransversal: new Prisma.Decimal(20),
          pesoEntrevista: new Prisma.Decimal(10),
          transversalId: null,
          entrevistaIaId: ENTREVISTA_IA_ID,
        }),
      },
      intentoBloque: {
        findMany: vi.fn().mockResolvedValue([{ nota: new Prisma.Decimal(80) }]),
      },
      skill: {
        findUnique: vi.fn().mockResolvedValue({ areaId: "a1111111-1111-1111-1111-111111111111" }),
      },
      intentoEntrevistaIA: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "e1",
            anulado: opciones.anulado ?? false,
            aprobado: true,
            notaGlobal: new Prisma.Decimal(75),
            notaAjustadaAdmin:
              opciones.notaAjustadaAdmin === null || opciones.notaAjustadaAdmin === undefined
                ? null
                : new Prisma.Decimal(opciones.notaAjustadaAdmin),
            fecha: new Date("2026-05-01"),
            notasPorArea:
              opciones.notaArea === null || opciones.notaArea === undefined
                ? []
                : [{ nota: new Prisma.Decimal(opciones.notaArea) }],
          },
        ]),
      },
      notaSkill: { upsert: vi.fn().mockResolvedValue({ id: "ns-1" }) },
      historicoNotaSkill: { create: vi.fn().mockResolvedValue({}) },
    }
  }

  it("D33 con 2 fuentes (bloques + entrevista) reescala pesos correctamente", async () => {
    const tx = buildTxConEntrevista({ notaArea: 90 })
    const r = await svc.recalcularConFuentes(tx as never, {
      colaboradorId: COLAB_ID,
      skillId: SKILL_ID,
      cursoId: CURSO_ID,
      origen: OrigenNotaSkill.ENTREVISTA_IA,
      referencia: { evento: "FINALIZADO" },
    })
    // pesos vivos: bloques=70 + entrevista=10 -> 80
    // 70/80 * 80 + 10/80 * 90 = 70 + 11.25 = 81.25
    expect(r.notaActual).toBe(81.25)
  })

  it("notaAjustadaAdmin gana sobre la nota del area (D-S8-D5)", async () => {
    const tx = buildTxConEntrevista({ notaArea: 50, notaAjustadaAdmin: 100 })
    const r = await svc.recalcularConFuentes(tx as never, {
      colaboradorId: COLAB_ID,
      skillId: SKILL_ID,
      cursoId: CURSO_ID,
      origen: OrigenNotaSkill.ENTREVISTA_IA,
      referencia: { evento: "AJUSTADO", motivoLength: 12 },
    })
    // 70/80 * 80 + 10/80 * 100 = 70 + 12.5 = 82.5
    expect(r.notaActual).toBe(82.5)
  })

  it("entrevista anulada -> recae a bloques puros", async () => {
    const tx = buildTxConEntrevista({ notaArea: 90, anulado: true })
    const r = await svc.recalcularConFuentes(tx as never, {
      colaboradorId: COLAB_ID,
      skillId: SKILL_ID,
      cursoId: CURSO_ID,
      origen: OrigenNotaSkill.ENTREVISTA_IA,
      referencia: { evento: "ANULADO", motivoLength: 10 },
    })
    expect(r.notaActual).toBe(80)
  })

  it("origen ENTREVISTA_IA persiste en historico", async () => {
    const tx = buildTxConEntrevista({ notaArea: 80 })
    await svc.recalcularConFuentes(tx as never, {
      colaboradorId: COLAB_ID,
      skillId: SKILL_ID,
      cursoId: CURSO_ID,
      origen: OrigenNotaSkill.ENTREVISTA_IA,
      referencia: { evento: "FINALIZADO" },
    })
    expect(tx.historicoNotaSkill.create).toHaveBeenCalledOnce()
    const histArgs = tx.historicoNotaSkill.create.mock.calls[0]?.[0] as {
      data: { origen: OrigenNotaSkill }
    }
    expect(histArgs.data.origen).toBe(OrigenNotaSkill.ENTREVISTA_IA)
  })

  it("3 fuentes (bloques + transversal + entrevista) con D33 70/20/10", async () => {
    const tx = {
      curso: {
        findUniqueOrThrow: vi.fn().mockResolvedValue({
          pesoBloques: new Prisma.Decimal(70),
          pesoTransversal: new Prisma.Decimal(20),
          pesoEntrevista: new Prisma.Decimal(10),
          transversalId: TRANSVERSAL_ID,
          entrevistaIaId: ENTREVISTA_IA_ID,
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
            id: "t1",
            estado: "FINALIZADO",
            anulado: false,
            aprobado: true,
            notaGlobal: new Prisma.Decimal(90),
            fecha: new Date("2026-05-01"),
          },
        ]),
      },
      skill: {
        findUnique: vi.fn().mockResolvedValue({ areaId: "a1111111-1111-1111-1111-111111111111" }),
      },
      intentoEntrevistaIA: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "e1",
            anulado: false,
            aprobado: true,
            notaGlobal: new Prisma.Decimal(100),
            notaAjustadaAdmin: null,
            fecha: new Date("2026-05-02"),
            notasPorArea: [{ nota: new Prisma.Decimal(100) }],
          },
        ]),
      },
      notaSkill: { upsert: vi.fn().mockResolvedValue({ id: "ns-1" }) },
      historicoNotaSkill: { create: vi.fn().mockResolvedValue({}) },
    }
    const r = await svc.recalcularConFuentes(tx as never, {
      colaboradorId: COLAB_ID,
      skillId: SKILL_ID,
      cursoId: CURSO_ID,
      origen: OrigenNotaSkill.ENTREVISTA_IA,
      referencia: { evento: "FINALIZADO" },
    })
    // 0.7*80 + 0.2*90 + 0.1*100 = 56 + 18 + 10 = 84
    expect(r.notaActual).toBe(84)
  })
})
