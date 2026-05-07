import type { CursoListItem, KpisCursoActual } from "@nexott-learn/shared-types"

export interface CursoHub {
  readonly curso: CursoListItem
  readonly kpis: KpisCursoActual | null
}

// Calcula días restantes hasta el deadline. Devuelve null si no hay deadline
// o si la fecha ya pasó.
export function diasHastaDeadline(deadline: string | null): number | null {
  if (!deadline) {
    return null
  }
  const d = new Date(deadline).getTime()
  if (Number.isNaN(d)) {
    return null
  }
  const ahora = Date.now()
  const diffMs = d - ahora
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

// Orden: cursos con más en-riesgo primero, luego deadline cercano,
// luego sin diagnóstico, luego por título.
export function ordenarCursosHub(items: readonly CursoHub[]): readonly CursoHub[] {
  return [...items].sort((a, b) => {
    const riesgoA = a.kpis?.enRiesgo ?? 0
    const riesgoB = b.kpis?.enRiesgo ?? 0
    if (riesgoA !== riesgoB) {
      return riesgoB - riesgoA
    }
    const dlA = diasHastaDeadline(a.curso.deadline) ?? Number.POSITIVE_INFINITY
    const dlB = diasHastaDeadline(b.curso.deadline) ?? Number.POSITIVE_INFINITY
    if (dlA !== dlB) {
      return dlA - dlB
    }
    return a.curso.titulo.localeCompare(b.curso.titulo)
  })
}
