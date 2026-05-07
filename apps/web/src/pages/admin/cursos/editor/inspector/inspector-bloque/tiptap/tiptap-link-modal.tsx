import { Button } from "@/shared/ui/primitives/button"
import { useEffect, useRef, useState } from "react"

interface TiptapLinkModalProps {
  readonly open: boolean
  readonly initialUrl: string
  readonly onClose: () => void
  readonly onApply: (url: string | null) => void
}

export function TiptapLinkModal({ open, initialUrl, onClose, onApply }: TiptapLinkModalProps) {
  const [url, setUrl] = useState(initialUrl)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setUrl(initialUrl)
      const id = window.setTimeout(() => inputRef.current?.focus(), 0)
      return () => window.clearTimeout(id)
    }
    return undefined
  }, [open, initialUrl])

  if (!open) {
    return null
  }

  const handleApply = () => {
    const trimmed = url.trim()
    onApply(trimmed.length > 0 ? trimmed : null)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          onClose()
        }
      }}
      role="presentation"
    >
      <dialog
        open={true}
        aria-modal="true"
        className="w-[min(420px,90vw)] rounded-[var(--radius-lg)] border border-glass-border bg-surface-2 p-5 text-text-primary shadow-xl"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <h2 className="mb-3 font-semibold text-base text-text-primary">Insertar enlace</h2>
        <input
          ref={inputRef}
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleApply()
            }
          }}
          placeholder="https://…"
          className="w-full rounded-[var(--radius-sm)] border border-glass-border bg-glass-1 px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-violet"
        />
        <div className="mt-4 flex items-center justify-end gap-2">
          {initialUrl.length > 0 ? (
            <Button variant="ghost" size="sm" onClick={() => onApply(null)}>
              Quitar enlace
            </Button>
          ) : null}
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button size="sm" onClick={handleApply}>
            Aplicar
          </Button>
        </div>
      </dialog>
    </div>
  )
}
