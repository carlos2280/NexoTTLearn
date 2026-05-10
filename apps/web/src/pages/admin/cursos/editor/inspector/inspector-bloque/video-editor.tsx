import { InspectorRow } from "@/shared/ui/patterns/immersive/inspector"
import { useState } from "react"
import { useDebouncedSave } from "../../hooks/use-debounced-save"
import type { BloqueEditorProps } from "./types"

export function VideoEditor({ bloque, onSave }: BloqueEditorProps) {
  const [url, setUrl] = useState((bloque.payload.url as string) ?? "")
  const [proveedor, setProveedor] = useState((bloque.payload.proveedor as string) ?? "youtube")
  useDebouncedSave({ url, proveedor }, (v) =>
    onSave({ payload: { url: v.url, proveedor: v.proveedor } }),
  )
  return (
    <>
      <InspectorRow label="URL del video">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
          className="rounded-[var(--radius-sm)] border border-glass-border bg-glass-1 px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-violet"
        />
      </InspectorRow>
      <InspectorRow label="Proveedor">
        <select
          value={proveedor}
          onChange={(e) => setProveedor(e.target.value)}
          className="rounded-[var(--radius-sm)] border border-glass-border bg-glass-1 px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-violet"
        >
          <option value="youtube">YouTube</option>
          <option value="vimeo">Vimeo</option>
          <option value="interno">Interno</option>
        </select>
      </InspectorRow>
    </>
  )
}
