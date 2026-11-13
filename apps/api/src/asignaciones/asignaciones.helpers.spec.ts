import { Prisma, RolAsignacion } from "@prisma/client"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { PrismaService } from "../common/prisma/prisma.service"
import { evaluarCondicionesListo } from "./asignaciones.helpers"

// Regla unica (13-11-2026): "plan completo" del ASIGNADO se mide sobre TODAS
// las secciones del curso, igual que el del voluntario y que el %. Completar
// solo las obligatorias del plan ya no basta para pasar a LISTO ni para abrir
// el transversal encadenado.

const ASIGNACION_ID = "a0000000-0000-0000-0000-000000000001"
const CURSO_ID = "c0000000-0000-0000-0000-000000000001"
const COLABORADOR_ID = "f0000000-0000-0000-0000-000000000001"
const SECCION_1 = "22222222-2222-2222-2222-222222222221"
const SECCION_2 = "22222222-2222-2222-2222-222222222222"
const SIN_TRANSVERSAL = { transversalId: null, entrevistaIaId: null }

function buildPrisma() {
  return {
    asignacionCurso: {
      findUnique: vi.fn().mockResolvedValue({
        rol: RolAsignacion.ASIGNADO,
        colaboradorId: COLABORADOR_ID,
        cursoId: CURSO_ID,
      }),
    },
    planEstudio: { findUnique: vi.fn().mockResolvedValue({ id: "plan-1" }) },
    // Si el codigo aun leyera el plan, veria a S1 como unica obligatoria.
    itemPlan: {
      findMany: vi.fn().mockResolvedValue([
        {
          seccionId: SECCION_1,
          seccion: { bloques: [{ id: "b1", tipo: "QUIZ", contenido: {} }] },
        },
      ]),
    },
    seccion: {
      findMany: vi.fn().mockResolvedValue([
        { id: SECCION_1, bloques: [{ id: "b1", tipo: "QUIZ", contenido: {} }] },
        { id: SECCION_2, bloques: [] },
      ]),
    },
    intentoBloque: {
      findMany: vi.fn().mockResolvedValue([{ bloqueId: "b1", nota: new Prisma.Decimal(90) }]),
    },
    aperturaSeccion: { findMany: vi.fn().mockResolvedValue([]) },
  }
}

describe("evaluarCondicionesListo — ASIGNADO con la regla unica", () => {
  let prisma: ReturnType<typeof buildPrisma>

  beforeEach(() => {
    prisma = buildPrisma()
  })

  it("obligatorias completas pero el curso tiene secciones pendientes -> plan incompleto", async () => {
    const res = await evaluarCondicionesListo(
      prisma as unknown as PrismaService,
      ASIGNACION_ID,
      SIN_TRANSVERSAL,
    )

    expect(res.planCompleto).toBe(false)
    expect(res.faltantes.map((f) => f.codigo)).toContain("PLAN_INCOMPLETO")
  })

  it("todas las secciones del curso completas -> plan completo, tenga o no plan", async () => {
    prisma.planEstudio.findUnique.mockResolvedValue(null)
    prisma.aperturaSeccion.findMany.mockResolvedValue([{ seccionId: SECCION_2 }])

    const res = await evaluarCondicionesListo(
      prisma as unknown as PrismaService,
      ASIGNACION_ID,
      SIN_TRANSVERSAL,
    )

    expect(res.planCompleto).toBe(true)
    expect(res.cumple).toBe(true)
  })
})
