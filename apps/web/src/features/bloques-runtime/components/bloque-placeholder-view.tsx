import type { BloqueRuntime, TipoBloqueRuntime } from "@nexott-learn/shared-types"
import { presetKeyDeBloque } from "@nexott-learn/shared-types"
import { Sparkles } from "lucide-react"
import { presetParaBloque } from "../lib/bloque-presets"
import { BloqueHeader } from "./bloque-header"
import { BloqueShell } from "./bloque-shell"

interface BloquePlaceholderViewProps {
  readonly bloque: Exclude<BloqueRuntime, { tipo: "PARRAFO" }>
  readonly esActual: boolean
}

// Placeholder S1 — los tipos no implementados muestran una superficie discreta
// con copy explicito *"proximamente"*. Mantiene la arquitectura visual del
// canvas (border-left, header con icono y label) sin contenido real.

export function BloquePlaceholderView({ bloque, esActual }: BloquePlaceholderViewProps) {
  const presetKey = presetKeyDeBloque(bloque)
  const preset = presetParaBloque(presetKey)
  return (
    <BloqueShell presetKey={presetKey} bloqueId={bloque.id} esActual={esActual}>
      <BloqueHeader
        presetKey={presetKey}
        titulo={bloque.titulo}
        estado={bloque.estado}
        duracionEstimadaMin={bloque.duracionEstimadaMin}
      />
      <div className="flex items-center gap-3 rounded-xl border border-glass-border bg-glass-1 p-4">
        <Sparkles className="size-4 shrink-0 text-text-muted" strokeWidth={1.75} />
        <p className="text-sm text-text-secondary leading-relaxed">
          <span className="font-medium text-text-primary">{preset.label}</span> · este tipo de
          bloque estara disponible en el siguiente sprint del modo inmersivo. Por ahora puedes
          continuar con el resto del modulo.
        </p>
      </div>
    </BloqueShell>
  )
}

// Helper exhaustivo: si la union BloqueRuntime crece, TS forzara su uso aqui.
export function tipoEsPlaceholder(
  tipo: TipoBloqueRuntime,
): tipo is Exclude<TipoBloqueRuntime, "PARRAFO"> {
  return tipo !== "PARRAFO"
}
