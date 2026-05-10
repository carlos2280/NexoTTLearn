import { cn } from "@/shared/lib/cn"
import type { ReactNode } from "react"

interface BlockCanvasProps {
  readonly title?: ReactNode
  readonly meta?: ReactNode
  readonly children: ReactNode
  readonly footer?: ReactNode
}

/**
 * Marco del canvas central. Limita el ancho a una columna legible (1100px)
 * y centra. Encima opcionalmente cabecera (sección + meta) y debajo footer
 * (botón "+ Insertar bloque" en modo edit).
 *
 * Diseño: el canvas es la herramienta. Cero adornos. La frescura visual
 * viene del contenido (los bloques), no de gradientes ni cards apiladas.
 */
export function BlockCanvas({ title, meta, children, footer }: BlockCanvasProps) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[1100px] px-10 py-10">
          {title || meta ? (
            <header className="mb-8 flex items-end justify-between gap-4 border-glass-border border-b pb-4">
              <h1 className="font-semibold text-2xl text-text-primary">{title}</h1>
              {meta ? <div className="text-text-muted text-xs">{meta}</div> : null}
            </header>
          ) : null}

          <div className={cn("flex flex-col gap-3")}>{children}</div>

          {footer ? <div className="mt-6">{footer}</div> : null}
        </div>
      </div>
    </div>
  )
}
