import { useEffect } from "react"

interface UseEditorShortcutsArgs {
  readonly isPublishOpen: boolean
  readonly onEscape: () => void
  readonly onPublishShortcut: () => void
}

export function useEditorShortcuts({
  isPublishOpen,
  onEscape,
  onPublishShortcut,
}: UseEditorShortcutsArgs): void {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isPublishOpen) {
        onEscape()
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "p") {
        e.preventDefault()
        onPublishShortcut()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [isPublishOpen, onEscape, onPublishShortcut])
}
