import type {
  CursoEstado,
  CursoNivel,
  GradientePreset,
  IconoCursoPreset,
} from "@nexott-learn/shared-types"
import {
  Boxes,
  Cloud,
  Code2,
  Database,
  GitBranch,
  type LucideIcon,
  Palette,
  Shield,
  Sparkles,
} from "lucide-react"

export function gradienteHero(preset: GradientePreset): string {
  switch (preset) {
    case "violet":
      return "from-violet-700 via-violet-500 to-violet-400"
    case "indigo":
      return "from-indigo-700 via-indigo-500 to-indigo-400"
    case "emerald":
      return "from-emerald-700 via-emerald-600 to-emerald-400"
    case "rose":
      return "from-rose-700 via-rose-600 to-rose-400"
    case "sky":
      return "from-sky-700 via-sky-500 to-sky-400"
    case "amber":
      return "from-amber-700 via-amber-600 to-amber-400"
    case "fuchsia":
      return "from-fuchsia-700 via-fuchsia-500 to-fuchsia-400"
    case "slate":
      return "from-slate-700 via-slate-600 to-slate-400"
    case "spectral":
      return "from-brand-violet via-brand-violet-soft to-brand-cyan"
    default: {
      const _exhaustive: never = preset
      return _exhaustive
    }
  }
}

export function iconoCurso(preset: IconoCursoPreset): LucideIcon {
  switch (preset) {
    case "git":
      return GitBranch
    case "react":
      return Sparkles
    case "typescript":
      return Code2
    case "docker":
      return Boxes
    case "cloud":
      return Cloud
    case "ai":
      return Sparkles
    case "security":
      return Shield
    case "database":
      return Database
    case "design":
      return Palette
    case "default":
      return Code2
    default: {
      const _exhaustive: never = preset
      return _exhaustive
    }
  }
}

export function labelNivel(nivel: CursoNivel): string {
  switch (nivel) {
    case "BASICO":
      return "Basico"
    case "INTERMEDIO":
      return "Intermedio"
    case "AVANZADO":
      return "Avanzado"
    default: {
      const _exhaustive: never = nivel
      return _exhaustive
    }
  }
}

export function statusTexto(estado: CursoEstado): string {
  switch (estado.tipo) {
    case "NO_INICIADO":
      return "Sin iniciar"
    case "EN_PROGRESO":
      return "En curso"
    case "COMPLETADO":
      return estado.excelencia ? "Excelencia" : "Completado"
    case "ABANDONADO":
      return "Abandonado"
    case "CERRADO_SIN_COMPLETAR":
      return "Curso cerrado"
    default: {
      const _exhaustive: never = estado
      return _exhaustive
    }
  }
}
