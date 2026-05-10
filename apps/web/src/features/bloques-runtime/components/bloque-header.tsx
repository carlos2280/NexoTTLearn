import { cn } from "@/shared/lib/cn"
import { TypeChip } from "@/shared/ui/patterns/type-chip"
import type { BloqueRuntimeEstado, BloqueRuntimePresetKey } from "@nexott-learn/shared-types"
import { presetParaBloque, presetParaEstado } from "../lib/bloque-presets"

interface BloqueHeaderProps {
  readonly presetKey: BloqueRuntimePresetKey
  readonly titulo: string
  readonly estado: BloqueRuntimeEstado
  readonly duracionEstimadaMin: number | null
}

// Cabecera comun a todos los bloques del canvas: icono enmarcado + label de
// tipo + pills derechos (duracion + estado). Dentro vive el contenido especifico
// del tipo (rich-text, IDE, video player, etc.).

export function BloqueHeader({
  presetKey,
  titulo,
  estado,
  duracionEstimadaMin,
}: BloqueHeaderProps) {
  const preset = presetParaBloque(presetKey)
  const estadoPreset = presetParaEstado(estado)
  const Icon = preset.icon

  return (
    <header className="mb-5 flex items-start justify-between gap-4">
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl border border-glass-border",
            preset.surfaceClass,
          )}
        >
          <Icon className={cn("size-5", iconColorClass(preset.tone))} strokeWidth={1.75} />
        </span>
        <div className="flex flex-col gap-1">
          <TypeChip tone={preset.tone}>{preset.label}</TypeChip>
          <h3 className="font-semibold text-base text-text-primary leading-snug">{titulo}</h3>
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        {duracionEstimadaMin !== null && duracionEstimadaMin > 0 && (
          <span className="text-text-muted text-xs">~{duracionEstimadaMin} min</span>
        )}
        <TypeChip tone={estadoPreset.tone}>{estadoPreset.label}</TypeChip>
      </div>
    </header>
  )
}

function iconColorClass(tone: ReturnType<typeof presetParaBloque>["tone"]): string {
  switch (tone) {
    case "indigo":
      return "text-indigo-300"
    case "emerald":
      return "text-emerald-300"
    case "slate":
      return "text-slate-300"
    case "rose":
      return "text-rose-300"
    case "sky":
      return "text-sky-300"
    case "violet":
      return "text-violet-300"
    case "amber":
      return "text-amber-300"
    case "fuchsia":
      return "text-fuchsia-300"
    default: {
      const _exhaustive: never = tone
      return _exhaustive
    }
  }
}
