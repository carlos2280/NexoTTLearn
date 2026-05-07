import { cn } from "@/shared/lib/cn"
// biome-ignore lint/style/noNamespaceImport: Radix expone subcomponentes; namespace import es idiomatico
import * as Radix from "@radix-ui/react-radio-group"
import { type ComponentPropsWithoutRef, type ReactNode, forwardRef } from "react"

export const RadioGroup = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<typeof Radix.Root>>(
  function RadioGroup({ className, ...props }, ref) {
    return <Radix.Root ref={ref} className={cn("flex flex-col gap-2", className)} {...props} />
  },
)

interface RadioCardProps extends ComponentPropsWithoutRef<typeof Radix.Item> {
  readonly label: string
  readonly description?: ReactNode
}

export const RadioCard = forwardRef<HTMLButtonElement, RadioCardProps>(function RadioCard(
  { className, label, description, value, ...props },
  ref,
) {
  return (
    <Radix.Item
      ref={ref}
      value={value}
      className={cn(
        "group relative flex w-full items-start gap-3 text-left",
        "rounded-[var(--radius-md)] border border-glass-border bg-glass-1 p-3.5",
        "transition-all duration-200",
        "hover:border-glass-border-strong",
        "data-[state=checked]:border-brand-violet data-[state=checked]:bg-[rgb(124_58_237/0.06)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-violet",
        className,
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className={cn(
          "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border",
          "border-glass-border-strong bg-transparent transition-colors",
          "group-data-[state=checked]:border-brand-violet",
        )}
      >
        <Radix.Indicator className="block size-2 rounded-full bg-brand-violet" />
      </span>
      <span className="flex flex-1 flex-col gap-0.5">
        <span className="font-medium text-sm text-text-primary">{label}</span>
        {description ? <span className="text-text-muted text-xs">{description}</span> : null}
      </span>
    </Radix.Item>
  )
})
