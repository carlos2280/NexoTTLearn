import { useEffect } from "react"

/** Atajo global de una sola tecla; ignora cuando el foco esta en input/textarea. */
export function useShortcut(key: string, handler: () => void, enabled = true): void {
  useEffect(() => {
    if (!enabled) {
      return
    }
    function listener(event: KeyboardEvent) {
      if (event.key !== key) {
        return
      }
      if (event.metaKey || event.ctrlKey || event.altKey) {
        return
      }
      const target = event.target as HTMLElement | null
      // biome-ignore lint/nursery/noSecrets: selector CSS, no es un secreto
      if (target?.matches?.("input, textarea, [contenteditable='true']")) {
        return
      }
      event.preventDefault()
      handler()
    }
    window.addEventListener("keydown", listener)
    return () => window.removeEventListener("keydown", listener)
  }, [key, handler, enabled])
}
