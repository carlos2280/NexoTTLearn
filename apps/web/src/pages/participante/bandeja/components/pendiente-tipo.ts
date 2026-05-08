import type { TypeChipTone } from "@/shared/ui/patterns/type-chip"
import type { PendienteTipo } from "@nexott-learn/shared-types"
import {
  BookOpen,
  CheckCircle2,
  Flag,
  Layers,
  type LucideIcon,
  Terminal,
  Video,
  Zap,
} from "lucide-react"

export function iconoPorTipo(tipo: PendienteTipo): LucideIcon {
  switch (tipo) {
    case "EJERCICIO":
      return Terminal
    case "TEST":
      return CheckCircle2
    case "LECTURA":
      return BookOpen
    case "RETO":
      return Zap
    case "VIDEO":
      return Video
    case "MODULO":
      return Layers
    case "PROYECTO":
      return Flag
    default: {
      const _exhaustive: never = tipo
      return _exhaustive
    }
  }
}

export function gradientePorTipo(tipo: PendienteTipo): string {
  switch (tipo) {
    case "EJERCICIO":
      return "from-indigo-700 via-indigo-500 to-indigo-400"
    case "TEST":
      return "from-emerald-700 via-emerald-600 to-emerald-400"
    case "LECTURA":
      return "from-slate-600 via-slate-500 to-slate-400"
    case "RETO":
      return "from-rose-700 via-rose-600 to-rose-400"
    case "VIDEO":
      return "from-sky-700 via-sky-500 to-sky-400"
    case "MODULO":
      return "from-violet-700 via-violet-500 to-violet-400"
    case "PROYECTO":
      return "from-amber-700 via-amber-600 to-amber-400"
    default: {
      const _exhaustive: never = tipo
      return _exhaustive
    }
  }
}

export function tonePorTipo(tipo: PendienteTipo): TypeChipTone {
  switch (tipo) {
    case "EJERCICIO":
      return "indigo"
    case "TEST":
      return "emerald"
    case "LECTURA":
      return "slate"
    case "RETO":
      return "rose"
    case "VIDEO":
      return "sky"
    case "MODULO":
      return "violet"
    case "PROYECTO":
      return "amber"
    default: {
      const _exhaustive: never = tipo
      return _exhaustive
    }
  }
}

export function labelPorTipo(tipo: PendienteTipo): string {
  switch (tipo) {
    case "EJERCICIO":
      return "Ejercicio"
    case "TEST":
      return "Test"
    case "LECTURA":
      return "Lectura"
    case "RETO":
      return "Reto"
    case "VIDEO":
      return "Video"
    case "MODULO":
      return "Modulo"
    case "PROYECTO":
      return "Proyecto"
    default: {
      const _exhaustive: never = tipo
      return _exhaustive
    }
  }
}
