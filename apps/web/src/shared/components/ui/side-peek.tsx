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

interface SidePeekProps {
  readonly abierto: boolean
  readonly onCambiarAbierto: (abierto: boolean) => void
  readonly titulo: ReactNode
  readonly descripcion?: ReactNode
  readonly cabeceraExtra?: ReactNode
  readonly ancho?: "md" | "lg" | "xl"
  readonly children: ReactNode
}

const ANCHO_CLASE = {
  md: "max-w-md",
  lg: "max-w-xl",
  xl: "max-w-2xl",
}

export function SidePeek({
  abierto,
  onCambiarAbierto,
  titulo,
  descripcion,
  cabeceraExtra,
  ancho = "lg",
  children,
}: SidePeekProps) {
  return (
    <DialogPrimitiveRoot open={abierto} onOpenChange={onCambiarAbierto}>
      <DialogPrimitivePortal>
        <DialogPrimitiveOverlay
          className="fixed inset-0 bg-text-primary/30 backdrop-blur-sm"
          style={{ zIndex: 180 }}
        />
        <DialogPrimitiveContent
          className={`fixed top-0 right-0 flex h-full w-full ${ANCHO_CLASE[ancho]} flex-col border-border border-l bg-surface shadow-overlay outline-none`}
          style={{ zIndex: 180 }}
        >
          <header className="flex shrink-0 items-start justify-between gap-3 border-border border-b px-6 py-4">
            <div className="flex min-w-0 flex-col gap-1">
              <DialogPrimitiveTitle className="truncate text-h3 text-text-primary">
                {titulo}
              </DialogPrimitiveTitle>
              {descripcion ? (
                <DialogPrimitiveDescription className="truncate text-body-sm text-text-secondary">
                  {descripcion}
                </DialogPrimitiveDescription>
              ) : null}
              {cabeceraExtra}
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
      </DialogPrimitivePortal>
    </DialogPrimitiveRoot>
  )
}

interface SidePeekSeccionProps {
  readonly titulo: string
  readonly children: ReactNode
  readonly accion?: ReactNode
}

export function SidePeekSeccion({ titulo, children, accion }: SidePeekSeccionProps) {
  return (
    <section className="flex flex-col gap-3 border-border border-b py-5 first:pt-0 last:border-b-0">
      <header className="flex items-center justify-between gap-2">
        <h3 className="font-medium text-body-sm text-text-secondary uppercase tracking-wide">
          {titulo}
        </h3>
        {accion}
      </header>
      {children}
    </section>
  )
}
