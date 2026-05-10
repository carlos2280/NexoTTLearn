import type {
  CumpleArea,
  MotivoSugerencia,
  SugerenciaModulo,
  TipoAsignacion,
} from "@nexott-learn/shared-types"
import type { CursoAreaAsignRow, InscripcionAsignRow, ModuloAsignRow } from "./asignaciones.mapper"

// MAESTRO §7.3 · calculo runtime de sugerencias contra puntajeObjetivo del area
// y umbralBrechaNoCumple del curso (default 10).
//   sin nota                         → SIN_DATO   (sin sugerencia)
//   brecha = 0                       → CUMPLE     (no asignar)
//   0 < brecha < umbralBrechaNoCumple → CERCA     → RECOMENDADO
//   brecha >= umbralBrechaNoCumple   → NO_CUMPLE  → OBLIGATORIO

interface CalcularArgs {
  readonly inscripcion: InscripcionAsignRow
  readonly cursoAreas: readonly CursoAreaAsignRow[]
  readonly modulos: readonly ModuloAsignRow[]
  readonly umbralBrechaNoCumple: number
}

export interface CalculoSugerencias {
  readonly sugerencias: SugerenciaModulo[]
  readonly cumple: CumpleArea[]
  readonly tieneEvaluacion: boolean
}

export function calcularSugerencias({
  inscripcion,
  cursoAreas,
  modulos,
  umbralBrechaNoCumple,
}: CalcularArgs): CalculoSugerencias {
  const notas = new Map<string, number>()
  for (const ev of inscripcion.evaluacionesIniciales) {
    notas.set(ev.areaId, ev.puntaje)
  }
  const tieneEvaluacion = notas.size > 0

  const motivoPorArea = new Map<string, MotivoSugerencia>()
  const cumple: CumpleArea[] = []
  for (const ca of cursoAreas) {
    const nota = notas.get(ca.areaId)
    if (nota === undefined) {
      motivoPorArea.set(ca.areaId, "SIN_DATO")
      continue
    }
    const brecha = Math.max(0, ca.puntajeObjetivo - nota)
    if (brecha === 0) {
      cumple.push({ areaId: ca.areaId, areaNombre: ca.area.nombre, nota })
      continue
    }
    motivoPorArea.set(ca.areaId, brecha >= umbralBrechaNoCumple ? "NO_CUMPLE" : "CERCA")
  }

  const sugerencias: SugerenciaModulo[] = []
  for (const m of modulos) {
    if (!m.areaId) {
      continue
    }
    const motivo = motivoPorArea.get(m.areaId)
    if (!motivo || motivo === "SIN_DATO") {
      continue
    }
    sugerencias.push({
      moduloId: m.id,
      areaId: m.areaId,
      tipo: tipoDesdeMotivo(motivo),
      motivo,
    })
  }
  return { sugerencias, cumple, tieneEvaluacion }
}

function tipoDesdeMotivo(motivo: "NO_CUMPLE" | "CERCA"): TipoAsignacion {
  switch (motivo) {
    case "NO_CUMPLE":
      return "OBLIGATORIO"
    case "CERCA":
      return "RECOMENDADO"
    default: {
      const _exhaustive: never = motivo
      return _exhaustive
    }
  }
}
