import type {
  MatrizDiagnosticoArea,
  MatrizDiagnosticoCelda,
  MatrizDiagnosticoFila,
  SemaforoCeldaDiagnostico,
} from "@nexott-learn/shared-types"
import { Prisma } from "@prisma/client"

// =============================================================================
// MATRIZ DIAGNOSTICO · selects + mapper.
// MAESTRO §7.2 · semaforo se calcula contra puntajeObjetivo de la CursoArea:
//   verde   ≥ objetivo
//   amarillo dentro de 10 puntos por debajo del objetivo
//   rojo    > 10 puntos por debajo del objetivo
//   vacio   sin captura (nota null)
// =============================================================================

export const CURSO_AREA_DIAGNOSTICO_SELECT = {
  id: true,
  areaId: true,
  peso: true,
  puntajeObjetivo: true,
  orden: true,
  area: { select: { id: true, nombre: true, color: true } },
} satisfies Prisma.CursoAreaSelect

export type CursoAreaDiagnosticoRow = Prisma.CursoAreaGetPayload<{
  select: typeof CURSO_AREA_DIAGNOSTICO_SELECT
}>

export const INSCRIPCION_MATRIZ_SELECT = {
  id: true,
  participante: {
    select: { id: true, nombre: true, apellido: true, email: true },
  },
  evaluacionesIniciales: {
    select: { areaId: true, puntaje: true },
  },
} satisfies Prisma.InscripcionSelect

export type InscripcionMatrizRow = Prisma.InscripcionGetPayload<{
  select: typeof INSCRIPCION_MATRIZ_SELECT
}>

export function mapAreaDiagnostico(row: CursoAreaDiagnosticoRow): MatrizDiagnosticoArea {
  return {
    id: row.area.id,
    nombre: row.area.nombre,
    color: row.area.color,
    peso: typeof row.peso === "number" ? row.peso : Number(row.peso),
    puntajeObjetivo: row.puntajeObjetivo,
  }
}

export function mapFilaMatriz({
  inscripcion,
  areas,
}: {
  readonly inscripcion: InscripcionMatrizRow
  readonly areas: readonly CursoAreaDiagnosticoRow[]
}): MatrizDiagnosticoFila {
  const notasPorArea = new Map<string, number>()
  for (const ev of inscripcion.evaluacionesIniciales) {
    notasPorArea.set(ev.areaId, ev.puntaje)
  }

  const celdas: MatrizDiagnosticoCelda[] = areas.map((area) => {
    const nota = notasPorArea.get(area.areaId)
    if (nota === undefined) {
      return { areaId: area.area.id, nota: null, semaforo: "vacio" }
    }
    return {
      areaId: area.area.id,
      nota,
      semaforo: calcularSemaforo(nota, area.puntajeObjetivo),
    }
  })

  const capturadas = celdas.filter((c) => c.semaforo !== "vacio").length

  return {
    inscripcionId: inscripcion.id,
    participante: inscripcion.participante,
    celdas,
    cobertura: { capturadas, total: areas.length },
  }
}

function calcularSemaforo(nota: number, objetivo: number): SemaforoCeldaDiagnostico {
  if (nota >= objetivo) {
    return "verde"
  }
  if (nota >= objetivo - 10) {
    return "amarillo"
  }
  return "rojo"
}
