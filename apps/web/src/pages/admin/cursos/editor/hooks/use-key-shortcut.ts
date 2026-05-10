import { useEffect } from "react"

interface KeyShortcutOptions {
  readonly key: string
  readonly enabled?: boolean
  readonly onTrigger: () => void
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }
  const tag = target.tagName
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
    return true
  }
  return target.isContentEditable
}

export function useKeyShortcut({ key, enabled = true, onTrigger }: KeyShortcutOptions) {
  useEffect(() => {
    if (!enabled) {
      return
    }
    const handler = (e: KeyboardEvent) => {
      if (e.key !== key || e.metaKey || e.ctrlKey || e.altKey) {
        return
      }
      if (isEditableTarget(e.target)) {
        return
      }
      e.preventDefault()
      onTrigger()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [key, enabled, onTrigger])
}
