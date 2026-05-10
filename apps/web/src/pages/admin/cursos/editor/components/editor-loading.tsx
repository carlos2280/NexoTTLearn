import { Loader2 } from "lucide-react"

export function EditorLoading() {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-surface-0 text-text-secondary">
      <div className="flex items-center gap-3">
        <Loader2 className="size-4 animate-spin text-brand-violet-soft" />
        <span className="text-sm">Cargando editor…</span>
      </div>
    </div>
  )
}
