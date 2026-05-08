import type { TypeChipTone } from "@/shared/ui/patterns/type-chip"
import type { BloqueRuntimeEstado, BloqueRuntimePresetKey } from "@nexott-learn/shared-types"
import {
  BookOpen,
  CheckCircle2,
  Code2,
  FileText,
  Lightbulb,
  type LucideIcon,
  PlayCircle,
  Terminal,
} from "lucide-react"

// Mapeo de la clave compuesta de bloque a sus identidades visuales
// (IDENTIDAD §03.2 + canvas-bloques.md §6). CODIGO se desdobla por
// `codigoEvaluable` para preservar las 3 etiquetas historicas
// (ejemplo / ejercicio guiado / reto). El resto se mapea 1:1 al enum Prisma.

export interface BloquePreset {
  readonly tone: TypeChipTone
  readonly icon: LucideIcon
  readonly label: string
  /** Clase tailwind del border-left (3px del color del tipo). */
  readonly borderClass: string
  /** Background discreto (4-6 % del color del tipo). */
  readonly surfaceClass: string
}

const PRESETS: Record<BloqueRuntimePresetKey, BloquePreset> = {
  // biome-ignore lint/style/useNamingConvention: replica BloqueRuntimePresetKey
  PARRAFO: {
    tone: "slate",
    icon: BookOpen,
    label: "Lectura",
    borderClass: "border-l-slate-400/60",
    surfaceClass: "bg-slate-500/[0.04]",
  },
  // biome-ignore lint/style/useNamingConvention: replica BloqueRuntimePresetKey
  TIP: {
    tone: "amber",
    icon: Lightbulb,
    label: "Tip",
    borderClass: "border-l-amber-400/60",
    surfaceClass: "bg-amber-500/[0.05]",
  },
  // biome-ignore lint/style/useNamingConvention: replica BloqueRuntimePresetKey
  VIDEO: {
    tone: "sky",
    icon: PlayCircle,
    label: "Video",
    borderClass: "border-l-sky-400/60",
    surfaceClass: "bg-sky-500/[0.05]",
  },
  // biome-ignore lint/style/useNamingConvention: replica BloqueRuntimePresetKey
  RECURSO: {
    tone: "slate",
    icon: FileText,
    label: "Recurso",
    borderClass: "border-l-slate-400/60",
    surfaceClass: "bg-slate-500/[0.04]",
  },
  // biome-ignore lint/style/useNamingConvention: replica BloqueRuntimePresetKey
  CODIGO_NINGUNO: {
    tone: "violet",
    icon: Code2,
    label: "Ejemplo de codigo",
    borderClass: "border-l-violet-400/60",
    surfaceClass: "bg-violet-500/[0.05]",
  },
  // biome-ignore lint/style/useNamingConvention: replica BloqueRuntimePresetKey
  CODIGO_PREGUNTAS: {
    tone: "indigo",
    icon: Terminal,
    label: "Ejercicio guiado",
    borderClass: "border-l-indigo-400/60",
    surfaceClass: "bg-indigo-500/[0.06]",
  },
  // biome-ignore lint/style/useNamingConvention: replica BloqueRuntimePresetKey
  CODIGO_TESTS: {
    tone: "indigo",
    icon: Terminal,
    label: "Reto",
    borderClass: "border-l-indigo-400/60",
    surfaceClass: "bg-indigo-500/[0.06]",
  },
  // biome-ignore lint/style/useNamingConvention: replica BloqueRuntimePresetKey
  QUIZ: {
    tone: "emerald",
    icon: CheckCircle2,
    label: "Quiz",
    borderClass: "border-l-emerald-400/60",
    surfaceClass: "bg-emerald-500/[0.05]",
  },
}

export function presetParaBloque(presetKey: BloqueRuntimePresetKey): BloquePreset {
  return PRESETS[presetKey]
}

export interface EstadoPreset {
  readonly tone: TypeChipTone
  readonly label: string
}

const ESTADO_PRESETS: Record<BloqueRuntimeEstado, EstadoPreset> = {
  // biome-ignore lint/style/useNamingConvention: replica BloqueRuntimeEstado del schema
  SIN_INTENTAR: { tone: "slate", label: "Sin intentar" },
  // biome-ignore lint/style/useNamingConvention: replica BloqueRuntimeEstado del schema
  EN_PROGRESO: { tone: "amber", label: "En progreso" },
  // biome-ignore lint/style/useNamingConvention: replica BloqueRuntimeEstado del schema
  COMPLETADO: { tone: "emerald", label: "Completado" },
}

export function presetParaEstado(estado: BloqueRuntimeEstado): EstadoPreset {
  return ESTADO_PRESETS[estado]
}
