import {
  Close as DialogPrimitiveClose,
  Content as DialogPrimitiveContent,
  Description as DialogPrimitiveDescription,
  Overlay as DialogPrimitiveOverlay,
  Portal as DialogPrimitivePortal,
  Root as DialogPrimitiveRoot,
  Title as DialogPrimitiveTitle,
} from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import type { ReactNode } from "react"

interface DialogProps {
  readonly abierto: boolean
  readonly onCambiarAbierto: (abierto: boolean) => void
  readonly titulo: string
  readonly descripcion?: ReactNode
  readonly ancho?: "sm" | "md" | "lg"
  readonly children: ReactNode
}

const ANCHO_CLASE = {
  sm: "max-w-md",
  md: "max-w-xl",
  lg: "max-w-3xl",
}

export function Dialog({
  abierto,
  onCambiarAbierto,
  titulo,
  descripcion,
  ancho = "sm",
  children,
}: DialogProps) {
  return (
    <DialogPrimitiveRoot open={abierto} onOpenChange={onCambiarAbierto}>
      <DialogPrimitivePortal>
        <DialogPrimitiveOverlay
          className="nx-motion-overlay fixed inset-0 bg-text-primary/30 backdrop-blur-sm"
          style={{ zIndex: 200 }}
        />
        <div
          className="pointer-events-none fixed inset-0 flex items-center justify-center px-4 py-8"
          style={{ zIndex: 200 }}
        >
          <DialogPrimitiveContent
            className={`nx-motion-dialog pointer-events-auto flex max-h-[calc(100vh-4rem)] w-full ${ANCHO_CLASE[ancho]} flex-col overflow-hidden rounded-lg border border-border bg-surface shadow-overlay outline-none`}
          >
            <header className="flex shrink-0 items-start justify-between gap-3 border-border border-b px-6 py-4">
              <div className="flex min-w-0 flex-col gap-0.5">
                <DialogPrimitiveTitle className="text-h3 text-text-primary">
                  {titulo}
                </DialogPrimitiveTitle>
                {descripcion ? (
                  <DialogPrimitiveDescription className="text-body-sm text-text-secondary">
                    {descripcion}
                  </DialogPrimitiveDescription>
                ) : null}
              </div>
              <DialogPrimitiveClose
                aria-label="Cerrar"
                className="-mt-1 -mr-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-text-tertiary transition-colors duration-fast ease-default hover:bg-subtle hover:text-text-primary"
              >
                <X className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
              </DialogPrimitiveClose>
            </header>
            <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
          </DialogPrimitiveContent>
        </div>
      </DialogPrimitivePortal>
    </DialogPrimitiveRoot>
  )
}

export function DialogFooter({ children }: { readonly children: ReactNode }) {
  return (
    <footer className="-mx-6 -mb-5 mt-6 flex items-center justify-end gap-2 border-border border-t bg-subtle/40 px-6 py-3">
      {children}
    </footer>
  )
}
