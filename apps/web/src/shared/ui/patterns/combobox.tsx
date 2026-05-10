import { cn } from "@/shared/lib/cn"
// biome-ignore lint/style/noNamespaceImport: Radix expone subcomponentes; namespace import es idiomatico
import * as Popover from "@radix-ui/react-popover"
import { Command } from "cmdk"
import { Check, ChevronDown } from "lucide-react"
import { type ReactNode, useState } from "react"

export interface ComboboxOption<T extends string> {
  readonly value: T
  readonly label: string
  readonly hint?: string
}

interface ComboboxProps<T extends string> {
  readonly id?: string
  readonly value: T | undefined
  readonly onChange: (value: T | undefined) => void
  readonly options: readonly ComboboxOption<T>[]
  readonly placeholder?: string
  readonly searchPlaceholder?: string
  readonly emptyLabel?: ReactNode
  readonly allowCustomValue?: boolean
  readonly onCustomValue?: (value: string) => void
  readonly disabled?: boolean
  readonly invalid?: boolean
  readonly clearable?: boolean
}

export function Combobox<T extends string>({
  id,
  value,
  onChange,
  options,
  placeholder = "Selecciona una opcion",
  searchPlaceholder = "Buscar...",
  emptyLabel = "Sin resultados",
  allowCustomValue = false,
  onCustomValue,
  disabled = false,
  invalid = false,
  clearable = false,
}: ComboboxProps<T>) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const selected = options.find((option) => option.value === value)
  const showCreate =
    allowCustomValue &&
    query.trim().length > 0 &&
    !options.some((option) => option.label.toLowerCase() === query.trim().toLowerCase())

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        id={id}
        type="button"
        disabled={disabled}
        aria-invalid={invalid || undefined}
        className={cn(
          "flex h-11 w-full items-center justify-between gap-2 px-3.5 text-left",
          "rounded-[var(--radius-md)] border bg-glass-1 text-sm",
          "transition-all duration-200",
          "hover:border-glass-border-strong",
          "focus-visible:border-brand-violet focus-visible:bg-glass-2 focus-visible:outline-none",
          "focus-visible:shadow-[0_0_0_4px_rgb(124_58_237/0.18)]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          invalid ? "border-danger/60" : "border-glass-border",
          selected ? "text-text-primary" : "text-text-faint",
        )}
      >
        <span className="flex-1 truncate">{selected?.label ?? placeholder}</span>
        <ChevronDown
          className="size-4 shrink-0 text-text-muted transition-transform data-[state=open]:rotate-180"
          aria-hidden="true"
        />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          className={cn(
            "z-[var(--z-modal)] w-[var(--radix-popover-trigger-width)] min-w-[16rem]",
            "overflow-hidden rounded-[var(--radius-lg)]",
            "border border-glass-border bg-surface-1/95",
            "shadow-lg backdrop-blur-2xl",
            "data-[state=open]:animate-[fade-up_180ms_ease-out]",
          )}
        >
          <Command shouldFilter={true} className="flex flex-col">
            <div className="border-glass-border border-b px-3">
              <Command.Input
                value={query}
                onValueChange={setQuery}
                placeholder={searchPlaceholder}
                className={cn(
                  "h-10 w-full bg-transparent text-sm text-text-primary",
                  "placeholder:text-text-faint",
                  "focus:outline-none",
                )}
              />
            </div>
            <Command.List className="max-h-64 overflow-y-auto p-1.5">
              <Command.Empty className="px-2.5 py-6 text-center text-sm text-text-muted">
                {emptyLabel}
              </Command.Empty>
              {options.map((option) => {
                const isSelected = option.value === value
                return (
                  <Command.Item
                    key={option.value}
                    value={option.label}
                    onSelect={() => {
                      onChange(isSelected && clearable ? undefined : option.value)
                      setOpen(false)
                      setQuery("")
                    }}
                    className={cn(
                      "flex cursor-pointer items-center gap-2.5",
                      "rounded-[var(--radius-sm)] px-2.5 py-2 text-sm",
                      "text-text-secondary",
                      "data-[selected=true]:bg-glass-2 data-[selected=true]:text-text-primary",
                      isSelected && "text-text-primary",
                    )}
                  >
                    <Check
                      className={cn(
                        "size-3.5 shrink-0",
                        isSelected ? "text-brand-violet-soft" : "opacity-0",
                      )}
                      strokeWidth={2.5}
                      aria-hidden="true"
                    />
                    <span className="flex-1 truncate">{option.label}</span>
                    {option.hint ? (
                      <span className="text-text-muted text-xs">{option.hint}</span>
                    ) : null}
                  </Command.Item>
                )
              })}
              {showCreate && onCustomValue ? (
                <Command.Item
                  value={`__create__${query}`}
                  onSelect={() => {
                    onCustomValue(query.trim())
                    setOpen(false)
                    setQuery("")
                  }}
                  className={cn(
                    "flex cursor-pointer items-center gap-2.5",
                    "rounded-[var(--radius-sm)] px-2.5 py-2 text-sm",
                    "text-brand-violet-soft",
                    "data-[selected=true]:bg-[rgb(124_58_237/0.1)]",
                  )}
                >
                  <span>+</span>
                  <span className="flex-1 truncate">Crear &quot;{query.trim()}&quot;</span>
                </Command.Item>
              ) : null}
            </Command.List>
          </Command>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
