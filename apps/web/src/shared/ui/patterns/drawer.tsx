import { cn } from "@/shared/lib/cn"
// biome-ignore lint/style/noNamespaceImport: Radix expone subcomponentes; namespace import es idiomatico
import * as Radix from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import {
  type ComponentPropsWithoutRef,
  type HTMLAttributes,
  type ReactNode,
  forwardRef,
  useEffect,
} from "react"

/**
 * Workaround de Radix Dialog: cuando un Dialog/Popover hijo se cierra mientras
 * el Drawer sigue abierto, Radix deja `pointer-events: none` en <body> y los
 * clicks en el propio Drawer (X, overlay, footer) dejan de funcionar.
 * Vigilamos el body con un MutationObserver mientras hay un drawer abierto y
 * limpiamos el estilo en cuanto aparece.
 * Ref: https://github.com/radix-ui/primitives/issues/1241
 */
function useFixBodyPointerEvents(open: boolean) {
  useEffect(() => {
    if (!open) {
      if (document.body.style.pointerEvents === "none") {
        document.body.style.pointerEvents = ""
      }
      return undefined
    }
    const clear = () => {
      if (document.body.style.pointerEvents === "none") {
        document.body.style.pointerEvents = ""
      }
    }
    clear()
    const observer = new MutationObserver(clear)
    observer.observe(document.body, { attributes: true, attributeFilter: ["style"] })
    return () => {
      observer.disconnect()
      clear()
    }
  }, [open])
}

export function Drawer({
  open,
  onOpenChange,
  children,
  ...rest
}: ComponentPropsWithoutRef<typeof Radix.Root>) {
  useFixBodyPointerEvents(Boolean(open))
  return (
    <Radix.Root open={open} onOpenChange={onOpenChange} {...rest}>
      {children}
    </Radix.Root>
  )
}
export const DrawerTrigger = Radix.Trigger
export const DrawerClose = Radix.Close

const OVERLAY =
  "fixed inset-0 z-[var(--z-overlay)] bg-[rgb(7_6_13/0.4)] backdrop-blur-[2px] data-[state=open]:animate-[fade-in_180ms_ease-out] data-[state=closed]:animate-[fade-in_120ms_ease-in_reverse]"

interface DrawerContentProps extends ComponentPropsWithoutRef<typeof Radix.Content> {
  readonly title: string
  readonly description?: string
  readonly hideClose?: boolean
  readonly header?: ReactNode
  readonly footer?: ReactNode
}

export const DrawerContent = forwardRef<HTMLDivElement, DrawerContentProps>(function DrawerContent(
  { className, children, title, description, hideClose, header, footer, ...props },
  ref,
) {
  return (
    <Radix.Portal>
      <Radix.Overlay className={OVERLAY} />
      <Radix.Content
        ref={ref}
        aria-label={title}
        className={cn(
          "fixed inset-y-0 right-0 z-[var(--z-modal)]",
          "flex h-full w-full flex-col",
          "border-glass-border border-l bg-surface-1 shadow-xl",
          "data-[state=open]:animate-[slide-in-from-right_260ms_cubic-bezier(0.2,0.8,0.2,1)]",
          "data-[state=closed]:animate-[slide-out-to-right_200ms_cubic-bezier(0.4,0,1,1)]",
          "sm:max-w-2xl",
          "focus:outline-none",
          className,
        )}
        {...props}
      >
        <Radix.Title className="sr-only">{title}</Radix.Title>
        <Radix.Description className="sr-only">{description ?? title}</Radix.Description>

        {header ? <div className="shrink-0 border-glass-border border-b">{header}</div> : null}

        {hideClose ? null : (
          <Radix.Close
            aria-label="Cerrar panel"
            className={cn(
              "absolute top-3 right-3 z-10",
              "flex size-8 items-center justify-center rounded-[var(--radius-sm)]",
              "text-text-muted hover:bg-glass-2 hover:text-text-primary",
              "transition-colors focus-visible:outline-none",
              "focus-visible:ring-2 focus-visible:ring-brand-violet",
            )}
          >
            <X className="size-4" strokeWidth={1.75} />
          </Radix.Close>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>

        {footer ? (
          <div className="shrink-0 border-glass-border border-t bg-glass-1">{footer}</div>
        ) : null}
      </Radix.Content>
    </Radix.Portal>
  )
})

export function DrawerHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-5 py-4 pr-12", className)} {...props} />
}

export function DrawerBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-4 px-5 py-4", className)} {...props} />
}

export function DrawerFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex flex-col gap-3 px-5 py-4", className)} {...props} />
}
