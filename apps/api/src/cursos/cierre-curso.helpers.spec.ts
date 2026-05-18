import { type EstadoCurso, Prisma, RolAsignacion } from "@prisma/client"
import { describe, expect, it } from "vitest"
import type { NotaSkillSnapshot } from "./calcular-resultado-final"
import {
  type AsignacionCierreRow,
  type CursoSnapshotCierre,
  type DecisionAplicada,
  construirSnapshotCierre,
} from "./cierre-curso.helpers"

const FECHA_CIERRE = new Date("2026-05-17T12:00:00Z")

function cursoBase(overrides?: Partial<CursoSnapshotCierre>): CursoSnapshotCierre {
  return {
    id: "curso-1",
    titulo: "Curso demo",
    clienteId: "cli-1",
    estado: "ACTIVO" as EstadoCurso,
    fechaInicio: new Date("2026-01-01T00:00:00Z"),
    fechaDeadline: new Date("2026-06-30T00:00:00Z"),
    umbralesLogro: null,
    pesoBloques: new Prisma.Decimal(50),
    pesoTransversal: new Prisma.Decimal(30),
    pesoEntrevista: new Prisma.Decimal(20),
    transversalId: null,
    entrevistaIaId: null,
    areasExigidas: [],
    skillsExigidas: [],
    modulosHabilitados: [],
    ...overrides,
  }
}

function asignacion(id: string): AsignacionCierreRow {
  return {
    id,
    rol: RolAsignacion.ASIGNADO,
    estadoAsignado: "EN_PROGRESO",
    estadoVoluntario: null,
    colaboradorId: `colab-${id}`,
    colaborador: {
      id: `colab-${id}`,
      nombre: "Tester",
      email: `tester-${id}@nexott.local`,
    },
  }
}

function nota(
  skillId: string,
  notaActual: number | null,
  caracter: "OBLIGATORIA" | "OPCIONAL" = "OBLIGATORIA",
  umbralCumple = 70,
): NotaSkillSnapshot {
  return { skillId, notaActual, caracter, umbralCumple }
}

function decision(asignacionId: string, notas: readonly NotaSkillSnapshot[]): DecisionAplicada {
  return {
    asignacionId,
    accion: "CERRAR_APTO",
    resultadoFinal: "APTO",
    notas,
  }
}

interface AsignacionPersistida {
  readonly asignacionId: string
  readonly notaGlobalFinal: number | null
  readonly notasPorSkill: ReadonlyArray<{
    readonly skillId: string
    readonly caracter: string
    readonly notaActual: number | null
  }>
}

function asignacionesDelSnapshot(snapshot: Record<string, unknown>): AsignacionPersistida[] {
  return snapshot.asignaciones as AsignacionPersistida[]
}

describe("construirSnapshotCierre — notaGlobalFinal (DEUDA-B26-1)", () => {
  it("persiste notaGlobalFinal como promedio de OBLIGATORIAS con nota presente", () => {
    const snapshot = construirSnapshotCierre({
      curso: cursoBase(),
      asignaciones: [asignacion("a1")],
      decisionesAplicadas: [
        decision("a1", [
          nota("sk-1", 80, "OBLIGATORIA"),
          nota("sk-2", 90, "OBLIGATORIA"),
          nota("sk-3", 40, "OBLIGATORIA"),
        ]),
      ],
      fechaCierre: FECHA_CIERRE,
      motivo: "Cierre tester",
      autorAdminId: "admin-1",
    })
    const [fila] = asignacionesDelSnapshot(snapshot)
    // (80 + 90 + 40) / 3 = 70
    expect(fila?.notaGlobalFinal).toBe(70)
  })

  it("ignora skills OPCIONALES al calcular notaGlobalFinal", () => {
    const snapshot = construirSnapshotCierre({
      curso: cursoBase(),
      asignaciones: [asignacion("a1")],
      decisionesAplicadas: [
        decision("a1", [
          nota("sk-obl", 80, "OBLIGATORIA"),
          nota("sk-opt-1", 10, "OPCIONAL"),
          nota("sk-opt-2", 20, "OPCIONAL"),
        ]),
      ],
      fechaCierre: FECHA_CIERRE,
      motivo: "Cierre tester",
      autorAdminId: "admin-1",
    })
    const [fila] = asignacionesDelSnapshot(snapshot)
    // Solo cuenta la unica obligatoria.
    expect(fila?.notaGlobalFinal).toBe(80)
  })

  it("ignora obligatorias sin nota (notaActual=null)", () => {
    const snapshot = construirSnapshotCierre({
      curso: cursoBase(),
      asignaciones: [asignacion("a1")],
      decisionesAplicadas: [
        decision("a1", [
          nota("sk-1", 60, "OBLIGATORIA"),
          nota("sk-2", null, "OBLIGATORIA"),
          nota("sk-3", 80, "OBLIGATORIA"),
        ]),
      ],
      fechaCierre: FECHA_CIERRE,
      motivo: "Cierre tester",
      autorAdminId: "admin-1",
    })
    const [fila] = asignacionesDelSnapshot(snapshot)
    // (60 + 80) / 2 = 70
    expect(fila?.notaGlobalFinal).toBe(70)
  })

  it("devuelve null cuando ninguna obligatoria tiene nota", () => {
    const snapshot = construirSnapshotCierre({
      curso: cursoBase(),
      asignaciones: [asignacion("a1")],
      decisionesAplicadas: [
        decision("a1", [nota("sk-1", null, "OBLIGATORIA"), nota("sk-opt", 90, "OPCIONAL")]),
      ],
      fechaCierre: FECHA_CIERRE,
      motivo: "Cierre tester",
      autorAdminId: "admin-1",
    })
    const [fila] = asignacionesDelSnapshot(snapshot)
    expect(fila?.notaGlobalFinal).toBeNull()
  })

  it("asignacion sin decision aplicada: notaGlobalFinal=null y notasPorSkill=[]", () => {
    const snapshot = construirSnapshotCierre({
      curso: cursoBase(),
      asignaciones: [asignacion("a1")],
      decisionesAplicadas: [],
      fechaCierre: FECHA_CIERRE,
      motivo: "Cierre tester",
      autorAdminId: "admin-1",
    })
    const [fila] = asignacionesDelSnapshot(snapshot)
    expect(fila?.notaGlobalFinal).toBeNull()
    expect(fila?.notasPorSkill).toEqual([])
  })

  it("notasPorSkill ahora persisten `caracter` (necesario para fallback aguas abajo)", () => {
    const snapshot = construirSnapshotCierre({
      curso: cursoBase(),
      asignaciones: [asignacion("a1")],
      decisionesAplicadas: [
        decision("a1", [nota("sk-1", 75, "OBLIGATORIA"), nota("sk-2", 65, "OPCIONAL")]),
      ],
      fechaCierre: FECHA_CIERRE,
      motivo: "Cierre tester",
      autorAdminId: "admin-1",
    })
    const [fila] = asignacionesDelSnapshot(snapshot)
    expect(fila?.notasPorSkill.map((n) => n.caracter)).toEqual(["OBLIGATORIA", "OPCIONAL"])
  })
})
