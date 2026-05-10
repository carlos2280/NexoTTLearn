import { InspectorRow } from "@/shared/ui/patterns/immersive/inspector"
import { useState } from "react"
import { useDebouncedSave } from "../../hooks/use-debounced-save"
import type { BloqueEditorProps } from "./types"

export function RecursoEditor({ bloque, onSave }: BloqueEditorProps) {
  const [url, setUrl] = useState((bloque.payload.url as string) ?? "")
  const [descripcion, setDescripcion] = useState((bloque.payload.descripcion as string) ?? "")
  const [esDescarga, setEsDescarga] = useState(Boolean(bloque.payload.esDescarga))
  useDebouncedSave({ url, descripcion, esDescarga }, (v) =>
    onSave({
      payload: {
        url: v.url,
        descripcion: v.descripcion || undefined,
        esDescarga: v.esDescarga,
      },
    }),
  )
  return (
    <>
      <InspectorRow label="URL del recurso">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="rounded-[var(--radius-sm)] border border-glass-border bg-glass-1 px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-violet"
        />
      </InspectorRow>
      <InspectorRow label="Descripción">
        <input
          type="text"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          className="rounded-[var(--radius-sm)] border border-glass-border bg-glass-1 px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-violet"
        />
      </InspectorRow>
      <InspectorRow label="Tipo">
        <label className="flex items-center gap-2 text-sm text-text-secondary">
          <input
            type="checkbox"
            checked={esDescarga}
            onChange={(e) => setEsDescarga(e.target.checked)}
          />
          Es descarga (no enlace externo)
        </label>
      </InspectorRow>
    </>
  )
}
