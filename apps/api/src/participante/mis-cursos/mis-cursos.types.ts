// Tipos internos del feature `mis-cursos` y derivacion de presets visuales.
//
// Doc canonico: DOCUMENTOS/doc/v2/3-pantallas/participante/mis-cursos/lista.md
//
// El schema v2 NO almacena `nivel`, `gradiente` ni `icono` por curso (decision
// de identidad: la libreria visual se encarga de la firma cromatica). El back
// los deriva de forma DETERMINISTA a partir del slug del curso para que la
// imagen de la card sea estable entre lecturas. Si en el futuro se agregan
// columnas en `Curso`, esta capa se reemplaza por una lectura directa sin
// cambiar el contrato hacia el front.

import type {
  CursoNivel,
  GradientePreset,
  IconoCursoPreset,
  TipoAsignacion,
} from "@nexott-learn/shared-types"

export interface CursoBase {
  readonly id: string
  readonly slug: string
  readonly titulo: string
  readonly descripcion: string | null
  readonly empresaCliente: string
}

export interface InscripcionRow {
  readonly id: string
  readonly tipo: "SOLICITUD" | "LIBRE"
  readonly estado: "ACTIVA" | "COMPLETADA" | "ABANDONADA" | "CERRADO_SIN_COMPLETAR"
  readonly inscritaAt: Date
  readonly completadaAt: Date | null
  readonly abandonadaAt: Date | null
  readonly cerradaSinCompletarAt: Date | null
  readonly curso: CursoBase
  readonly cantidadModulos: number
  readonly asignaciones: ReadonlyArray<{
    readonly moduloId: string
    readonly tipo: TipoAsignacion
    readonly orden: number
    readonly tituloModulo: string
  }>
  readonly estadosModulo: ReadonlyArray<{
    readonly moduloId: string
    readonly estado: "NO_INICIADO" | "EN_PROGRESO" | "COMPLETADO"
    readonly porcentajeAvance: number
  }>
  /** Nota global del curso (de ExpedienteEntry). null si no esta sellado. */
  readonly notaGlobal: number | null
}

const GRADIENTES: readonly GradientePreset[] = [
  "violet",
  "indigo",
  "emerald",
  "rose",
  "sky",
  "amber",
  "fuchsia",
  "slate",
]

// Hash determinista 32-bit del slug (FNV-1a). Estable cross-run.
function hashSlug(slug: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < slug.length; i++) {
    h ^= slug.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/**
 * Gradiente preset derivado por slug. "spectral" se reserva para cursos
 * COMPLETADOS con excelencia (caller decide); el rotativo cubre los 8 colores.
 */
export function gradienteParaCurso(slug: string): GradientePreset {
  const idx = hashSlug(slug) % GRADIENTES.length
  // biome-ignore lint/style/noNonNullAssertion: idx es modulo del length, siempre valido
  return GRADIENTES[idx]!
}

/**
 * Icono preset derivado por keywords en el slug. Si nada matchea → "default".
 * El orden de la lista importa: matchea el primer keyword que aparece.
 */
const ICON_KEYWORDS: ReadonlyArray<readonly [string, IconoCursoPreset]> = [
  ["git", "git"],
  ["react", "react"],
  ["typescript", "typescript"],
  ["docker", "docker"],
  ["k8s", "docker"],
  ["kubernetes", "docker"],
  ["cloud", "cloud"],
  ["azure", "cloud"],
  ["aws", "cloud"],
  ["ai", "ai"],
  ["ml", "ai"],
  ["llm", "ai"],
  ["security", "security"],
  ["seguridad", "security"],
  ["data", "database"],
  ["sql", "database"],
  ["nosql", "database"],
  ["mongo", "database"],
  ["design", "design"],
  ["ux", "design"],
  ["ui", "design"],
]

export function iconoParaCurso(slug: string): IconoCursoPreset {
  const s = slug.toLowerCase()
  for (const [kw, icon] of ICON_KEYWORDS) {
    if (s.includes(kw)) {
      return icon
    }
  }
  return "default"
}

/**
 * Nivel del curso. Se deriva del titulo + descripcion buscando marcadores
 * explicitos. Sin marcador → INTERMEDIO (valor neutro mas frecuente).
 *
 * Convencion validada con la pagina mock (ver mock-mis-cursos.ts).
 */
export function nivelParaCurso(titulo: string, descripcion: string | null): CursoNivel {
  const haystack = `${titulo} ${descripcion ?? ""}`.toLowerCase()
  if (
    haystack.includes("avanzado") ||
    haystack.includes("pro ") ||
    haystack.endsWith("pro") ||
    haystack.includes("expert")
  ) {
    return "AVANZADO"
  }
  if (
    haystack.includes("basico") ||
    haystack.includes("básico") ||
    haystack.includes("fundamentos") ||
    haystack.includes("fundamentals") ||
    haystack.includes("introduccion") ||
    haystack.includes("introducción") ||
    haystack.includes("101")
  ) {
    return "BASICO"
  }
  return "INTERMEDIO"
}

/**
 * Truncado seguro a 160 caracteres para descripcionCorta. La card la corta
 * con line-clamp-2 visualmente; este limite evita payloads gigantes.
 */
export function descripcionCorta(descripcion: string | null, fallback: string): string {
  const base = (descripcion ?? "").trim()
  if (base.length === 0) {
    return fallback
  }
  if (base.length <= 160) {
    return base
  }
  return `${base.slice(0, 157).trimEnd()}...`
}
