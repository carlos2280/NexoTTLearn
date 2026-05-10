import type { DiagnosticoData, TabDiagnostico } from "../types/diagnostico"

export interface PasoProgreso {
  readonly numero: 1 | 2 | 3
  readonly etiqueta: string
  readonly hechos: number
  readonly total: number
  readonly estado: "vacio" | "parcial" | "completo"
}

export interface ProgresoDiagnostico {
  readonly pasos: readonly [PasoProgreso, PasoProgreso, PasoProgreso]
  readonly tabSugerido: TabDiagnostico
  readonly listoParaSeguimiento: boolean
}

export function calcularProgreso(data: DiagnosticoData): ProgresoDiagnostico {
  const totalCandidatos = data.inscripciones.length
  const evaluados = data.inscripciones.filter((i) => i.evaluacion.completa).length
  const asignados = data.inscripciones.filter((i) => i.asignacion.confirmada).length

  const pasos: readonly [PasoProgreso, PasoProgreso, PasoProgreso] = [
    {
      numero: 1,
      etiqueta: "Invitar",
      hechos: totalCandidatos,
      total: totalCandidatos,
      estado: totalCandidatos === 0 ? "vacio" : "completo",
    },
    {
      numero: 2,
      etiqueta: "Evaluación inicial",
      hechos: evaluados,
      total: totalCandidatos,
      estado: estadoSimple(evaluados, totalCandidatos),
    },
    {
      numero: 3,
      etiqueta: "Asignación",
      hechos: asignados,
      total: totalCandidatos,
      estado: estadoSimple(asignados, totalCandidatos),
    },
  ]

  return {
    pasos,
    tabSugerido: tabSugeridoDesdePasos(pasos),
    listoParaSeguimiento: pasos[2].estado === "completo" && totalCandidatos > 0,
  }
}

function estadoSimple(hechos: number, total: number): PasoProgreso["estado"] {
  if (total === 0 || hechos === 0) {
    return "vacio"
  }
  if (hechos < total) {
    return "parcial"
  }
  return "completo"
}

function tabSugeridoDesdePasos(
  pasos: readonly [PasoProgreso, PasoProgreso, PasoProgreso],
): TabDiagnostico {
  if (pasos[0].estado !== "completo") {
    return 1
  }
  if (pasos[1].estado !== "completo") {
    return 2
  }
  return 3
}
