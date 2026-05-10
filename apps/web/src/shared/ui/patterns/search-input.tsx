import { cn } from "@/shared/lib/cn"
import { Search, X } from "lucide-react"
import { type InputHTMLAttributes, forwardRef, useEffect, useImperativeHandle, useRef } from "react"

interface SearchInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "size"> {
  readonly value: string
  readonly onChange: (value: string) => void
  readonly onClear?: () => void
  /** Atajo "/" enfoca el input cuando no hay otro input/textarea activo. */
  readonly globalShortcut?: boolean
  readonly inputSize?: "sm" | "md"
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  {
    value,
    onChange,
    onClear,
    globalShortcut = false,
    inputSize = "md",
    placeholder = "Buscar...",
    className,
    ...props
  },
  forwardedRef,
) {
  const innerRef = useRef<HTMLInputElement>(null)
  useImperativeHandle(forwardedRef, () => innerRef.current as HTMLInputElement)

  useEffect(() => {
    if (!globalShortcut) {
      return
    }
    function handle(event: KeyboardEvent) {
      if (event.key !== "/") {
        return
      }
      const target = event.target as HTMLElement | null
      // biome-ignore lint/nursery/noSecrets: selector CSS, no es un secreto
      if (target?.matches?.("input, textarea, [contenteditable='true']")) {
        return
      }
      event.preventDefault()
      innerRef.current?.focus()
    }
    window.addEventListener("keydown", handle)
    return () => window.removeEventListener("keydown", handle)
  }, [globalShortcut])

  const heightClass = inputSize === "sm" ? "h-9 text-xs" : "h-11 text-sm"
  const showClear = value.length > 0

  return (
    <div className={cn("relative w-full", className)}>
      <Search
        aria-hidden="true"
        className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3.5 size-4 text-text-muted"
        strokeWidth={1.5}
      />
      <input
        ref={innerRef}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full bg-glass-1 pr-11 pl-10 text-text-primary placeholder:text-text-faint",
          "rounded-[var(--radius-md)] border border-glass-border",
          "transition-all duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)]",
          "hover:border-glass-border-strong",
          "focus-visible:border-brand-violet focus-visible:bg-glass-2 focus-visible:outline-none",
          "focus-visible:shadow-[0_0_0_4px_rgb(124_58_237/0.18)]",
          "[&::-webkit-search-cancel-button]:hidden",
          heightClass,
        )}
        {...props}
      />
      {showClear ? (
        <button
          type="button"
          aria-label="Limpiar busqueda"
          onClick={() => {
            onChange("")
            onClear?.()
            innerRef.current?.focus()
          }}
          className={cn(
            "-translate-y-1/2 absolute top-1/2 right-2",
            "flex size-7 items-center justify-center rounded-[var(--radius-sm)]",
            "text-text-muted hover:bg-glass-2 hover:text-text-primary",
            "transition-colors focus-visible:outline-none",
            "focus-visible:ring-2 focus-visible:ring-brand-violet",
          )}
        >
          <X className="size-3.5" strokeWidth={2} />
        </button>
      ) : globalShortcut ? (
        <kbd
          className={cn(
            "-translate-y-1/2 absolute top-1/2 right-3",
            "rounded-[var(--radius-xs)] border border-glass-border bg-glass-2",
            "px-1.5 py-0.5 font-mono text-[10px] text-text-muted",
          )}
        >
          /
        </kbd>
      ) : null}
    </div>
  )
})
