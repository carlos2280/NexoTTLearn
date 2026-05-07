import { cn } from "@/shared/lib/cn"
// biome-ignore lint/style/noNamespaceImport: Radix expone subcomponentes; namespace import es idiomatico
import * as Radix from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import {
  type ComponentPropsWithoutRef,
  type HTMLAttributes,
  type ReactNode,
  forwardRef,
} from "react"
import { tv } from "tailwind-variants"

export const Dialog = Radix.Root
export const DialogTrigger = Radix.Trigger
export const DialogClose = Radix.Close

const overlay =
  "fixed inset-0 z-[var(--z-overlay)] bg-[rgb(7_6_13/0.55)] backdrop-blur-sm data-[state=open]:animate-[fade-in_180ms_ease-out] data-[state=closed]:animate-[fade-in_120ms_ease-in_reverse]"

const content = tv({
  base: [
    "fixed left-1/2 top-1/2 z-[var(--z-modal)] -translate-x-1/2 -translate-y-1/2",
    "w-full bg-surface-1 border border-glass-border-strong",
    "rounded-[var(--radius-xl)] shadow-lg",
    "focus:outline-none",
    "data-[state=open]:animate-[fade-up_220ms_cubic-bezier(0.2,0.8,0.2,1)]",
  ],
  variants: {
    size: {
      sm: "max-w-sm",
      md: "max-w-md",
      lg: "max-w-lg",
      xl: "max-w-xl",
      "2xl": "max-w-2xl",
    },
  },
  defaultVariants: { size: "md" },
})

interface DialogContentProps extends ComponentPropsWithoutRef<typeof Radix.Content> {
  readonly size?: "sm" | "md" | "lg" | "xl" | "2xl"
  readonly hideClose?: boolean
}

export const DialogContent = forwardRef<HTMLDivElement, DialogContentProps>(function DialogContent(
  { className, children, size, hideClose, ...props },
  ref,
) {
  return (
    <Radix.Portal>
      <Radix.Overlay className={overlay} />
      <Radix.Content ref={ref} className={cn(content({ size }), className)} {...props}>
        {children}
        {hideClose ? null : (
          <Radix.Close
            aria-label="Cerrar"
            className={cn(
              "absolute top-3 right-3",
              "flex size-8 items-center justify-center rounded-[var(--radius-sm)]",
              "text-text-muted hover:bg-glass-2 hover:text-text-primary",
              "transition-colors focus-visible:outline-none",
              "focus-visible:ring-2 focus-visible:ring-brand-violet",
            )}
          >
            <X className="size-4" strokeWidth={1.75} />
          </Radix.Close>
        )}
      </Radix.Content>
    </Radix.Portal>
  )
})

export function DialogHeader({
  className,
  children,
  eyebrow,
  ...props
}: HTMLAttributes<HTMLDivElement> & { readonly eyebrow?: ReactNode }) {
  return (
    <div className={cn("flex flex-col gap-1.5 px-6 pt-6 pb-2", className)} {...props}>
      {eyebrow ? (
        <span className="font-semibold text-[11px] text-brand-violet-soft uppercase tracking-wider">
          {eyebrow}
        </span>
      ) : null}
      {children}
    </div>
  )
}

export const DialogTitle = forwardRef<
  HTMLHeadingElement,
  ComponentPropsWithoutRef<typeof Radix.Title>
>(function DialogTitle({ className, ...props }, ref) {
  return (
    <Radix.Title
      ref={ref}
      className={cn("font-semibold text-lg text-text-primary tracking-tight", className)}
      {...props}
    />
  )
})

export const DialogDescription = forwardRef<
  HTMLParagraphElement,
  ComponentPropsWithoutRef<typeof Radix.Description>
>(function DialogDescription({ className, ...props }, ref) {
  return (
    <Radix.Description
      ref={ref}
      className={cn("text-sm text-text-secondary leading-relaxed", className)}
      {...props}
    />
  )
})

export function DialogBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-4 px-6 py-4", className)} {...props} />
}

export function DialogFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center justify-end gap-2 border-glass-border border-t",
        "rounded-b-[var(--radius-xl)] bg-glass-1 px-6 py-4",
        className,
      )}
      {...props}
    />
  )
}
