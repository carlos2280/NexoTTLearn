import { cn } from "@/shared/lib/cn"
import {
  Content as RadixContent,
  Group as RadixGroup,
  Icon as RadixIcon,
  Item as RadixItem,
  ItemIndicator as RadixItemIndicator,
  ItemText as RadixItemText,
  Label as RadixLabel,
  Portal as RadixPortal,
  Root as RadixRoot,
  ScrollDownButton as RadixScrollDownButton,
  ScrollUpButton as RadixScrollUpButton,
  Separator as RadixSeparator,
  Trigger as RadixTrigger,
  Value as RadixValue,
  Viewport as RadixViewport,
} from "@radix-ui/react-select"
import { Check, ChevronDown, ChevronUp } from "lucide-react"
import { type ComponentPropsWithoutRef, type ElementRef, type ReactNode, forwardRef } from "react"

interface SelectProps {
  readonly id?: string
  readonly value?: string
  readonly defaultValue?: string
  readonly onValueChange?: (value: string) => void
  readonly placeholder?: ReactNode
  readonly disabled?: boolean
  readonly required?: boolean
  readonly name?: string
  readonly hasError?: boolean
  readonly compact?: boolean
  readonly variant?: "default" | "ghost"
  readonly className?: string
  readonly children: ReactNode
  readonly "aria-label"?: string
  readonly "aria-labelledby"?: string
  readonly "aria-describedby"?: string
  readonly "aria-invalid"?: boolean | "true" | "false"
}

/**
 * Select NexoTT — wrapper sobre Radix Select.
 *
 * Por que Radix y no `<select>` nativo: el popup nativo lo pinta el SO,
 * imposible tematizar en dark mode con identidad NexoTT. Radix nos da
 * trigger + content controlados con tokens (surface-raised, border-strong,
 * focus aurora-violet, hover bg-subtle, check aurora).
 *
 * Variantes del trigger:
 * - `default`: rounded-lg, borde y shadow. Formularios densos.
 * - `ghost`: rounded-pill, sin borde ni bg. Para componer dentro de pills /
 *   toolbars (ej. "Estado: Activos").
 *
 * Notas API vs nativo:
 * - Usa `onValueChange(value)` en vez de `onChange(e)`.
 * - Radix prohibe `<SelectItem value="">`. Para placeholder usa la prop
 *   `placeholder` y deja el `value` undefined / fuera del set de items.
 */
export function Select({
  id,
  value,
  defaultValue,
  onValueChange,
  placeholder,
  disabled,
  required,
  name,
  hasError,
  compact,
  variant = "default",
  className,
  children,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledby,
  "aria-describedby": ariaDescribedby,
  "aria-invalid": ariaInvalid,
}: SelectProps) {
  const esGhost = variant === "ghost"

  return (
    <RadixRoot
      value={value}
      defaultValue={defaultValue}
      onValueChange={onValueChange}
      disabled={disabled}
      required={required}
      name={name}
    >
      <RadixTrigger
        id={id}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledby}
        aria-describedby={ariaDescribedby}
        aria-invalid={ariaInvalid ?? (hasError ? true : undefined)}
        data-invalid={hasError || undefined}
        className={cn(
          "group/select inline-flex w-full items-center justify-between gap-2 text-left",
          "transition-[border-color,box-shadow] duration-base ease-default",
          "outline-none disabled:cursor-not-allowed disabled:opacity-60",
          esGhost
            ? [
                "h-8 rounded-pill pr-1 pl-1 font-medium text-body-sm text-text-primary",
                "data-[placeholder]:text-text-tertiary",
              ]
            : [
                "rounded-lg border bg-surface text-text-primary shadow-xs",
                "border-border-strong",
                "hover:border-border-emphasis hover:shadow-sm",
                "disabled:hover:border-border-strong disabled:hover:shadow-xs",
                "data-[state=open]:border-aurora-violet data-[state=open]:shadow-ring-aurora-soft",
                "focus-visible:border-aurora-violet focus-visible:shadow-ring-aurora-soft",
                "data-[invalid]:border-danger data-[invalid]:focus-visible:shadow-ring-danger-soft",
                "data-[placeholder]:text-text-tertiary",
                compact ? "h-9 px-3 text-body-sm" : "h-12 px-4 text-input",
                "disabled:bg-subtle",
              ],
          className,
        )}
      >
        <RadixValue placeholder={placeholder} />
        <RadixIcon asChild={true}>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-text-tertiary",
              "transition-colors duration-base ease-default",
              "group-data-[state=open]/select:text-aurora-violet",
              "group-data-[invalid]/select:text-danger",
            )}
            strokeWidth={1.5}
            aria-hidden={true}
          />
        </RadixIcon>
      </RadixTrigger>

      <RadixPortal>
        <RadixContent
          position="popper"
          sideOffset={6}
          className={cn(
            "z-popover overflow-hidden rounded-lg border border-border-strong bg-surface-raised",
            "shadow-lg",
            "min-w-[var(--radix-select-trigger-width)]",
          )}
        >
          <RadixScrollUpButton className="flex h-6 cursor-default items-center justify-center bg-surface-raised text-text-tertiary">
            <ChevronUp className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
          </RadixScrollUpButton>
          <RadixViewport className="max-h-[min(320px,var(--radix-select-content-available-height))] p-1">
            {children}
          </RadixViewport>
          <RadixScrollDownButton className="flex h-6 cursor-default items-center justify-center bg-surface-raised text-text-tertiary">
            <ChevronDown className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
          </RadixScrollDownButton>
        </RadixContent>
      </RadixPortal>
    </RadixRoot>
  )
}

type SelectItemProps = ComponentPropsWithoutRef<typeof RadixItem>

export const SelectItem = forwardRef<ElementRef<typeof RadixItem>, SelectItemProps>(
  function SelectItem({ className, children, ...rest }, ref) {
    return (
      <RadixItem
        ref={ref}
        className={cn(
          "relative flex w-full cursor-pointer select-none items-center gap-2",
          "rounded-md py-2 pr-2 pl-7 text-body-sm text-text-primary outline-none",
          "transition-colors duration-fast ease-default",
          "data-[highlighted]:bg-subtle data-[highlighted]:text-text-primary",
          "data-[state=checked]:font-medium data-[state=checked]:text-aurora-violet",
          "data-[disabled]:pointer-events-none data-[disabled]:text-text-disabled",
          className,
        )}
        {...rest}
      >
        <span className="absolute left-2 inline-flex h-3.5 w-3.5 items-center justify-center">
          <RadixItemIndicator>
            <Check
              className="h-3.5 w-3.5 text-aurora-violet"
              strokeWidth={2.5}
              aria-hidden={true}
            />
          </RadixItemIndicator>
        </span>
        <RadixItemText>{children}</RadixItemText>
      </RadixItem>
    )
  },
)

type SelectGroupProps = ComponentPropsWithoutRef<typeof RadixGroup>

export function SelectGroup(props: SelectGroupProps) {
  return <RadixGroup {...props} />
}

type SelectLabelProps = ComponentPropsWithoutRef<typeof RadixLabel>

export function SelectLabel({ className, ...rest }: SelectLabelProps) {
  return (
    <RadixLabel
      className={cn("nx-eyebrow px-2 pt-2 pb-1 text-text-tertiary", className)}
      {...rest}
    />
  )
}

type SelectSeparatorProps = ComponentPropsWithoutRef<typeof RadixSeparator>

export function SelectSeparator({ className, ...rest }: SelectSeparatorProps) {
  return <RadixSeparator className={cn("my-1 h-px bg-border", className)} {...rest} />
}
