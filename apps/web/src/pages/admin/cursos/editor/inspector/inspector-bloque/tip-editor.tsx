import { InspectorRow } from "@/shared/ui/patterns/immersive/inspector"
import type { TipVariante } from "@nexott-learn/shared-types"
import { useState } from "react"
import { useDebouncedSave } from "../../hooks/use-debounced-save"
import type { BloqueEditorProps } from "./types"

const VARIANTES = ["info", "best-practice", "warning", "gotcha"] as const

export function TipEditor({ bloque, onSave }: BloqueEditorProps) {
  const [variante, setVariante] = useState<TipVariante>(
    (bloque.payload.variante as TipVariante) ?? "info",
  )
  const [texto, setTexto] = useState((bloque.payload.texto as string) ?? "")

  useDebouncedSave({ variante, texto }, (v) =>
    onSave({ payload: { variante: v.variante, texto: v.texto } }),
  )

  return (
    <>
      <InspectorRow label="Variante">
        <div className="grid grid-cols-2 gap-1.5">
          {VARIANTES.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setVariante(v)}
              className={`rounded-[var(--radius-sm)] border px-2 py-1.5 text-[11px] uppercase tracking-wider transition-colors ${
                variante === v
                  ? "border-brand-violet bg-brand-violet/10 text-brand-violet-soft"
                  : "border-glass-border bg-glass-1 text-text-secondary hover:border-glass-border-strong"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </InspectorRow>
      <InspectorRow label="Texto">
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={4}
          className="resize-y rounded-[var(--radius-sm)] border border-glass-border bg-glass-1 px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-violet"
        />
      </InspectorRow>
    </>
  )
}
