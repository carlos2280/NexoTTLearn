import { cn } from "@/shared/lib/cn"
// biome-ignore lint/style/noNamespaceImport: Radix expone subcomponentes; namespace import es idiomatico
import * as Radix from "@radix-ui/react-popover"
import { Check, ChevronDown, SlidersHorizontal } from "lucide-react"
import { type ReactNode, useState } from "react"

export interface FilterOption<T extends string> {
  readonly value: T
  readonly label: string
  readonly hint?: string
}

interface FilterPopoverProps<T extends string> {
  readonly label: string
  readonly icon?: ReactNode
  readonly options: readonly FilterOption<T>[]
  readonly selected: readonly T[]
  readonly onChange: (selected: readonly T[]) => void
  readonly multi?: boolean
  readonly align?: "start" | "center" | "end"
  readonly emptyLabel?: string
}

export function FilterPopover<T extends string>({
  label,
  icon,
  options,
  selected,
  onChange,
  multi = true,
  align = "start",
  emptyLabel = "Sin opciones",
}: FilterPopoverProps<T>) {
  const [open, setOpen] = useState(false)
  const count = selected.length
  const showCount = count > 0

  function toggle(value: T) {
    if (!multi) {
      onChange([value])
      setOpen(false)
      return
    }
    const exists = selected.includes(value)
    onChange(exists ? selected.filter((v) => v !== value) : [...selected, value])
  }

  return (
    <Radix.Root open={open} onOpenChange={setOpen}>
      <Radix.Trigger
        className={cn(
          "inline-flex h-10 items-center gap-2 px-3.5",
          "rounded-[var(--radius-md)] border border-glass-border bg-glass-1",
          "text-sm text-text-secondary",
          "transition-all duration-200",
          "hover:border-glass-border-strong hover:text-text-primary",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-violet",
          "data-[state=open]:border-brand-violet data-[state=open]:text-text-primary",
        )}
      >
        {icon ?? <SlidersHorizontal className="size-3.5" strokeWidth={1.75} aria-hidden="true" />}
        <span className="font-medium">{label}</span>
        {showCount ? (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-[var(--radius-full)] bg-brand-violet px-1.5 font-semibold text-[10px] text-text-on-brand">
            {count}
          </span>
        ) : null}
        <ChevronDown
          className="size-3.5 text-text-muted transition-transform data-[state=open]:rotate-180"
          aria-hidden="true"
        />
      </Radix.Trigger>
      <Radix.Portal>
        <Radix.Content
          align={align}
          sideOffset={8}
          className={cn(
            "z-[var(--z-modal)] min-w-[14rem] max-w-xs",
            "overflow-hidden rounded-[var(--radius-lg)]",
            "border border-glass-border bg-surface-1/95 p-1.5",
            "shadow-lg backdrop-blur-2xl",
            "data-[state=open]:animate-[fade-up_180ms_ease-out]",
          )}
        >
          <div className="max-h-72 overflow-y-auto">
            {options.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-text-muted">{emptyLabel}</div>
            ) : (
              options.map((option) => {
                const checked = selected.includes(option.value)
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggle(option.value)}
                    className={cn(
                      "group flex w-full items-center gap-2.5",
                      "rounded-[var(--radius-sm)] px-2.5 py-2 text-left text-sm",
                      "text-text-secondary transition-colors",
                      "hover:bg-glass-2 hover:text-text-primary",
                      checked && "text-text-primary",
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "flex size-4 shrink-0 items-center justify-center rounded-[var(--radius-xs)] border",
                        checked
                          ? "border-brand-violet bg-brand-violet"
                          : "border-glass-border-strong bg-transparent",
                      )}
                    >
                      {checked ? (
                        <Check className="size-3 text-text-on-brand" strokeWidth={3} />
                      ) : null}
                    </span>
                    <span className="flex-1 truncate">{option.label}</span>
                    {option.hint ? (
                      <span className="text-text-muted text-xs">{option.hint}</span>
                    ) : null}
                  </button>
                )
              })
            )}
          </div>
          {multi && count > 0 ? (
            <div className="mt-1 border-glass-border border-t pt-1">
              <button
                type="button"
                onClick={() => onChange([])}
                className="w-full rounded-[var(--radius-sm)] px-2.5 py-1.5 text-left text-text-muted text-xs hover:bg-glass-2 hover:text-text-primary"
              >
                Limpiar seleccion
              </button>
            </div>
          ) : null}
        </Radix.Content>
      </Radix.Portal>
    </Radix.Root>
  )
}
