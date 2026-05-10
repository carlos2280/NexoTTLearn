import { InspectorRow } from "@/shared/ui/patterns/immersive/inspector"
import { useState } from "react"
import { useDebouncedSave } from "../../hooks/use-debounced-save"
import type { BloqueEditorProps } from "./types"

interface ArchivoCodigo {
  readonly nombre: string
  readonly contenido: string
}

export function CodigoEditor({ bloque, onSave }: BloqueEditorProps) {
  const archivos = (bloque.payload.archivos as ArchivoCodigo[]) ?? []
  const primero: ArchivoCodigo = archivos[0] ?? { nombre: "main.txt", contenido: "" }
  const [codigo, setCodigo] = useState(primero.contenido)

  useDebouncedSave(codigo, (v) =>
    onSave({
      payload: {
        ...bloque.payload,
        archivos: [{ ...primero, contenido: v }, ...archivos.slice(1)],
      },
    }),
  )

  return (
    <InspectorRow label={`Archivo: ${primero.nombre}`}>
      <textarea
        value={codigo}
        onChange={(e) => setCodigo(e.target.value)}
        rows={10}
        className="resize-y rounded-[var(--radius-sm)] border border-glass-border bg-surface-2 px-3 py-2 font-mono text-[12.5px] text-text-primary outline-none focus:border-brand-violet"
      />
    </InspectorRow>
  )
}
