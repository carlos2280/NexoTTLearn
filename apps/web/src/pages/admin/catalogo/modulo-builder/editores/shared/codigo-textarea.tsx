import { cn } from "@/shared/lib/cn"
import type { KeyboardEvent, TextareaHTMLAttributes } from "react"

interface CodigoTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  readonly value: string
  readonly onValueChange: (value: string) => void
}

/**
 * Textarea con fuente monospace e indentación con Tab. Sin syntax highlight
 * (eso requiere una librería pesada). El render bonito vive en la vista
 * de participante, no aquí.
 */
export function CodigoTextarea({
  value,
  onValueChange,
  className,
  rows = 10,
  ...rest
}: CodigoTextareaProps) {
  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== "Tab") {
      return
    }
    e.preventDefault()
    const target = e.currentTarget
    const inicio = target.selectionStart
    const fin = target.selectionEnd
    const nuevo = `${value.slice(0, inicio)}  ${value.slice(fin)}`
    onValueChange(nuevo)
    // Restaurar cursor tras el tab
    requestAnimationFrame(() => {
      target.selectionStart = inicio + 2
      target.selectionEnd = inicio + 2
    })
  }

  return (
    <textarea
      {...rest}
      rows={rows}
      spellCheck={false}
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      onKeyDown={onKeyDown}
      className={cn(
        "w-full rounded-md border border-border bg-canvas px-3 py-2 font-mono text-body-sm text-text-primary",
        "focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30",
        className,
      )}
    />
  )
}
