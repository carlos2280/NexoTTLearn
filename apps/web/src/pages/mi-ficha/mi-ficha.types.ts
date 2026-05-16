import { type SlugArea, slugArea } from "@/shared/lib/slug-area"
import type { FichaPorAreaItem, FichaSkillItem } from "@nexott-learn/shared-types"

export interface GrupoArea {
  readonly areaId: string
  readonly nombre: string
  readonly slug: SlugArea
  readonly promedio: number | null
  readonly skillsConNota: number
  readonly skillsTotales: number
  readonly skills: readonly FichaSkillItem[]
}

const ORDEN_AREAS: readonly SlugArea[] = [
  "frontend",
  "backend",
  "cloud",
  "data",
  "mobile",
  "devops",
  "qa",
  "soft",
]

export function agruparPorArea(
  skills: readonly FichaSkillItem[],
  porArea: readonly FichaPorAreaItem[],
): readonly GrupoArea[] {
  const skillsPorArea = new Map<string, FichaSkillItem[]>()
  for (const s of skills) {
    const lista = skillsPorArea.get(s.areaId) ?? []
    lista.push(s)
    skillsPorArea.set(s.areaId, lista)
  }

  const grupos: GrupoArea[] = porArea.map((a) => {
    const lista = skillsPorArea.get(a.areaId) ?? []
    return {
      areaId: a.areaId,
      nombre: a.nombre,
      slug: slugArea(a.nombre),
      promedio: a.promedio,
      skillsConNota: a.skillsConNota,
      skillsTotales: a.skillsTotales,
      skills: ordenarSkills(lista),
    }
  })

  return grupos.sort((a, b) => {
    const ia = ORDEN_AREAS.indexOf(a.slug)
    const ib = ORDEN_AREAS.indexOf(b.slug)
    if (ia !== ib) {
      return ia - ib
    }
    return a.nombre.localeCompare(b.nombre, "es")
  })
}

function ordenarSkills(skills: readonly FichaSkillItem[]): readonly FichaSkillItem[] {
  return [...skills].sort((a, b) => {
    const na = a.notaActual
    const nb = b.notaActual
    if (na === null && nb === null) {
      return a.etiquetaVisible.localeCompare(b.etiquetaVisible, "es")
    }
    if (na === null) {
      return 1
    }
    if (nb === null) {
      return -1
    }
    if (na !== nb) {
      return nb - na
    }
    return a.etiquetaVisible.localeCompare(b.etiquetaVisible, "es")
  })
}

const ETIQUETAS_ORIGEN: ReadonlyArray<readonly [string, string]> = [
  ["ENTREVISTA_INICIAL", "Entrevista inicial"],
  ["BLOQUE", "Bloque didáctico"],
  ["TRANSVERSAL", "Proyecto transversal"],
  ["ENTREVISTA_IA", "Entrevista IA"],
  ["MANUAL", "Ajuste manual"],
]

export function etiquetaOrigen(origenActual: Record<string, unknown> | null): string {
  if (!origenActual) {
    return "Sin evidencia"
  }
  const tipo = origenActual.tipo
  if (typeof tipo !== "string") {
    return "Sin evidencia"
  }
  return ETIQUETAS_ORIGEN.find(([k]) => k === tipo)?.[1] ?? tipo
}

export function tokenColorNota(nota: number | null): string {
  if (nota === null) {
    return "var(--color-border-strong)"
  }
  if (nota >= 85) {
    return "var(--color-state-apto)"
  }
  if (nota >= 70) {
    return "var(--color-state-solido)"
  }
  if (nota >= 50) {
    return "var(--color-state-en-desarrollo)"
  }
  return "var(--color-state-no-apto)"
}
