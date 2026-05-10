import { cn } from "@/shared/lib/cn"
import { Check, Copy } from "lucide-react"
import { useEffect, useState } from "react"

interface CopyFieldProps {
  readonly value: string
  readonly label: string
  readonly wrap?: boolean
  readonly className?: string
}

const COPY_FEEDBACK_MS = 1800

export function CopyField({ value, label, wrap = false, className }: CopyFieldProps) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) {
      return
    }
    const t = window.setTimeout(() => setCopied(false), COPY_FEEDBACK_MS)
    return () => window.clearTimeout(t)
  }, [copied])

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div
      className={cn(
        "group relative flex w-full items-center gap-2",
        "rounded-[var(--radius-md)] border border-glass-border bg-glass-1",
        "px-3 py-2 transition-colors hover:border-glass-border-strong",
        "focus-within:border-brand-violet focus-within:shadow-[0_0_0_4px_rgb(124_58_237/0.18)]",
        className,
      )}
    >
      <code
        className={cn(
          "min-w-0 flex-1 font-mono text-sm text-text-primary tabular-nums",
          wrap ? "break-all" : "truncate",
        )}
      >
        {value}
      </code>
      <button
        type="button"
        onClick={onCopy}
        aria-label={label}
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)]",
          "text-text-muted transition-colors",
          "hover:bg-glass-2 hover:text-text-primary",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-violet",
        )}
      >
        {copied ? (
          <Check className="size-4 text-success" aria-hidden="true" />
        ) : (
          <Copy className="size-4" aria-hidden="true" />
        )}
      </button>
      <span aria-live="polite" className="sr-only">
        {copied ? "Copiado al portapapeles" : ""}
      </span>
    </div>
  )
}
