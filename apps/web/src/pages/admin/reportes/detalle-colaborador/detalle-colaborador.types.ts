/**
 * Mappings locales del reporte detalle-colaborador.
 * Mantener sincronizado con los enums Prisma `CaracterItemPlan`,
 * `RazonItemPlan`, `OrigenNotaSkill`.
 */

export interface CaracterDefinicion {
  readonly etiqueta: string
  readonly tokenColor: string
  readonly tokenSoft: string
  readonly tokenOnSoft: string
}

const CARACTERES: readonly (CaracterDefinicion & { readonly id: string })[] = [
  {
    id: "OBLIGATORIA",
    etiqueta: "Obligatoria",
    tokenColor: "var(--color-state-progreso)",
    tokenSoft: "var(--color-state-progreso-soft)",
    tokenOnSoft: "var(--color-state-progreso-on-soft)",
  },
  {
    id: "OPCIONAL",
    etiqueta: "Opcional",
    tokenColor: "var(--color-state-pendiente)",
    tokenSoft: "var(--color-state-pendiente-soft)",
    tokenOnSoft: "var(--color-state-pendiente-on-soft)",
  },
]

export function obtenerCaracter(id: string): CaracterDefinicion | undefined {
  return CARACTERES.find((c) => c.id === id)
}

// Mapeo enum-backend → etiqueta humana. Pares en arrays para evitar keys
// en SCREAMING_SNAKE_CASE en objetos literales (regla biome useNamingConvention).
const RAZONES: ReadonlyArray<readonly [string, string]> = [
  ["SKILL_FALTANTE", "Skill faltante"],
  ["SKILL_CERCA", "Skill cerca del umbral"],
  ["SKILL_YA_CUMPLE", "Skill ya cumple"],
  ["AJUSTE_ADMIN", "Ajuste manual del admin"],
]

export function etiquetaRazon(id: string): string {
  return RAZONES.find(([k]) => k === id)?.[1] ?? id
}

const ORIGENES: ReadonlyArray<readonly [string, string]> = [
  ["ENTREVISTA_INICIAL", "Entrevista inicial"],
  ["BLOQUE", "Bloque didáctico"],
  ["TRANSVERSAL", "Proyecto transversal"],
  ["ENTREVISTA_IA", "Entrevista IA"],
  ["MANUAL", "Ajuste manual"],
]

export function etiquetaOrigen(id: string | null): string {
  if (!id) {
    return "Sin origen registrado"
  }
  return ORIGENES.find(([k]) => k === id)?.[1] ?? id
}

/**
 * Color de la nota según rango (0-100). Coherente con avance-curso
 * y umbrales por defecto del backend (70 sólido, 85 excelencia).
 */
export function tokenPorNota(nota: number | null): string {
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
