import { useEffect } from "react"

interface UseEditorShortcutsArgs {
  readonly isPublishOpen: boolean
  readonly onEscape: () => void
  readonly onPublishShortcut: () => void
  readonly onPaletteShortcut: () => void
}

export function useEditorShortcuts({
  isPublishOpen,
  onEscape,
  onPublishShortcut,
  onPaletteShortcut,
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
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        onPaletteShortcut()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [isPublishOpen, onEscape, onPublishShortcut, onPaletteShortcut])
}
