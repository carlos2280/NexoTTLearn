import { cn } from "@/shared/lib/cn"
// biome-ignore lint/style/noNamespaceImport: Radix expone decenas de subcomponentes; namespace import es idiomatico
import * as Radix from "@radix-ui/react-dropdown-menu"
import { Check, ChevronRight, type LucideIcon } from "lucide-react"
import { type ComponentPropsWithoutRef, type HTMLAttributes, forwardRef } from "react"

/* ── Roots ─────────────────────────────────────────────────── */
export const DropdownMenu = Radix.Root
export const DropdownMenuTrigger = Radix.Trigger
export const DropdownMenuGroup = Radix.Group
export const DropdownMenuPortal = Radix.Portal
export const DropdownMenuSub = Radix.Sub
export const DropdownMenuRadioGroup = Radix.RadioGroup

/* ── Content ───────────────────────────────────────────────── */
export const DropdownMenuContent = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof Radix.Content>
>(function DropdownMenuContent({ className, sideOffset = 8, ...props }, ref) {
  return (
    <Radix.Portal>
      <Radix.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn(
          "z-[var(--z-modal)] min-w-[var(--radix-dropdown-menu-trigger-width)]",
          "overflow-hidden rounded-[var(--radius-lg)]",
          "border border-glass-border bg-surface-1/95 p-1.5",
          "shadow-lg backdrop-blur-2xl",
          "data-[state=open]:animate-[fade-up_180ms_ease-out]",
          "data-[state=closed]:animate-[fade-in_120ms_ease-in]",
          className,
        )}
        {...props}
      />
    </Radix.Portal>
  )
})

/* ── Item ──────────────────────────────────────────────────── */
type DropdownItemProps = ComponentPropsWithoutRef<typeof Radix.Item> & {
  readonly icon?: LucideIcon
  readonly tone?: "default" | "danger"
  readonly inset?: boolean
}

export const DropdownMenuItem = forwardRef<HTMLDivElement, DropdownItemProps>(
  function DropdownMenuItem(
    { className, icon: Icon, tone = "default", inset, children, ...props },
    ref,
  ) {
    return (
      <Radix.Item
        ref={ref}
        className={cn(
          "group relative flex cursor-pointer select-none items-center gap-2.5",
          "rounded-[var(--radius-sm)] px-2.5 py-2 text-sm outline-none",
          "transition-colors duration-150",
          "focus:bg-glass-2 focus:text-text-primary",
          "data-[disabled]:pointer-events-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-40",
          tone === "default" && "text-text-secondary",
          tone === "danger" && "text-danger focus:bg-[rgb(244_63_94/0.1)] focus:text-danger",
          inset && "pl-8",
          className,
        )}
        {...props}
      >
        {Icon ? (
          <Icon
            aria-hidden="true"
            className={cn(
              "size-4 shrink-0",
              tone === "default" && "text-text-muted group-focus:text-text-primary",
            )}
          />
        ) : null}
        <span className="flex-1 truncate">{children}</span>
      </Radix.Item>
    )
  },
)

/* ── Label ─────────────────────────────────────────────────── */
export const DropdownMenuLabel = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof Radix.Label>
>(function DropdownMenuLabel({ className, ...props }, ref) {
  return (
    <Radix.Label
      ref={ref}
      className={cn(
        "px-2.5 py-1.5 font-semibold text-[11px] text-text-muted uppercase tracking-wider",
        className,
      )}
      {...props}
    />
  )
})

/* ── Separator ─────────────────────────────────────────────── */
export const DropdownMenuSeparator = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof Radix.Separator>
>(function DropdownMenuSeparator({ className, ...props }, ref) {
  return (
    <Radix.Separator
      ref={ref}
      className={cn("-mx-1.5 my-1.5 h-px bg-glass-border", className)}
      {...props}
    />
  )
})

/* ── Shortcut hint ─────────────────────────────────────────── */
export function DropdownMenuShortcut({
  className,
  ...props
}: { readonly className?: string } & HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn("ml-auto font-mono text-[11px] text-text-muted tracking-widest", className)}
      {...props}
    />
  )
}

/* ── Checkbox / Radio items ────────────────────────────────── */
export const DropdownMenuCheckboxItem = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof Radix.CheckboxItem>
>(function DropdownMenuCheckboxItem({ className, children, checked, ...props }, ref) {
  return (
    <Radix.CheckboxItem
      ref={ref}
      checked={checked}
      className={cn(
        "relative flex cursor-pointer select-none items-center gap-2 rounded-[var(--radius-sm)]",
        "py-2 pr-2.5 pl-8 text-sm text-text-secondary outline-none",
        "focus:bg-glass-2 focus:text-text-primary",
        "data-[disabled]:pointer-events-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-40",
        className,
      )}
      {...props}
    >
      <span className="absolute left-2.5 flex size-4 items-center justify-center">
        <Radix.ItemIndicator>
          <Check className="size-3.5 text-brand-violet-soft" />
        </Radix.ItemIndicator>
      </span>
      {children}
    </Radix.CheckboxItem>
  )
})

/* ── Sub menu ──────────────────────────────────────────────── */
export const DropdownMenuSubTrigger = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof Radix.SubTrigger>
>(function DropdownMenuSubTrigger({ className, children, ...props }, ref) {
  return (
    <Radix.SubTrigger
      ref={ref}
      className={cn(
        "flex cursor-pointer select-none items-center gap-2 rounded-[var(--radius-sm)]",
        "px-2.5 py-2 text-sm text-text-secondary outline-none",
        "focus:bg-glass-2 focus:text-text-primary",
        "data-[state=open]:bg-glass-2",
        className,
      )}
      {...props}
    >
      <span className="flex-1 truncate">{children}</span>
      <ChevronRight className="size-3.5 text-text-muted" aria-hidden="true" />
    </Radix.SubTrigger>
  )
})

export const DropdownMenuSubContent = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof Radix.SubContent>
>(function DropdownMenuSubContent({ className, ...props }, ref) {
  return (
    <Radix.SubContent
      ref={ref}
      className={cn(
        "z-[var(--z-modal)] min-w-[12rem] overflow-hidden",
        "rounded-[var(--radius-lg)] border border-glass-border bg-surface-1/95",
        "p-1.5 shadow-lg backdrop-blur-2xl",
        className,
      )}
      {...props}
    />
  )
})
