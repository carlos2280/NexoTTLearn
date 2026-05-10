import { cn } from "@/shared/lib/cn"
// biome-ignore lint/style/noNamespaceImport: Radix expone decenas de subcomponentes; namespace import es idiomatico
import * as Radix from "@radix-ui/react-context-menu"
import type { LucideIcon } from "lucide-react"
import { type ComponentPropsWithoutRef, forwardRef } from "react"

/* ── Roots ─────────────────────────────────────────────────── */
export const ContextMenu = Radix.Root
export const ContextMenuTrigger = Radix.Trigger
export const ContextMenuGroup = Radix.Group
export const ContextMenuPortal = Radix.Portal

/* ── Content ───────────────────────────────────────────────── */
export const ContextMenuContent = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof Radix.Content>
>(function ContextMenuContent({ className, ...props }, ref) {
  return (
    <Radix.Portal>
      <Radix.Content
        ref={ref}
        className={cn(
          "z-[var(--z-modal)] min-w-[10rem]",
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
type ContextItemProps = ComponentPropsWithoutRef<typeof Radix.Item> & {
  readonly icon?: LucideIcon
  readonly tone?: "default" | "danger"
}

export const ContextMenuItem = forwardRef<HTMLDivElement, ContextItemProps>(
  function ContextMenuItem({ className, icon: Icon, tone = "default", children, ...props }, ref) {
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

/* ── Separator ─────────────────────────────────────────────── */
export const ContextMenuSeparator = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof Radix.Separator>
>(function ContextMenuSeparator({ className, ...props }, ref) {
  return (
    <Radix.Separator
      ref={ref}
      className={cn("-mx-1.5 my-1.5 h-px bg-glass-border", className)}
      {...props}
    />
  )
})

/* ── Label ─────────────────────────────────────────────────── */
export const ContextMenuLabel = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof Radix.Label>
>(function ContextMenuLabel({ className, ...props }, ref) {
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
