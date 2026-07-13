import { cn } from "@/shared/lib/cn"
import type { ReactNode } from "react"
import { EncabezadoCelda } from "./encabezado-celda"

interface CeldaBloqueProps {
  readonly glifo: string
  readonly etiqueta: string
  readonly tonoGlifo?: string
  readonly derecha?: ReactNode
  readonly bodyClassName?: string
  readonly children: ReactNode
}

/**
 * Celda de bloque del canvas inmersivo: una caja de superficie de editor
 * (`rounded-lg border bg-surface`) con una cabecera mono (`EncabezadoCelda`)
 * sobre `bg-subtle` y el cuerpo debajo. Da a los bloques evaluables (quiz) el
 * mismo lenguaje visual que la celda de código `● lenguaje`, para que en el
 * "archivo" se lean como celdas y no como tarjetas sueltas.
 */
export function CeldaBloque({
  glifo,
  etiqueta,
  tonoGlifo,
  derecha,
  bodyClassName,
  children,
}: CeldaBloqueProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      <div className="border-border border-b bg-subtle px-3 py-2">
        <EncabezadoCelda
          glifo={glifo}
          etiqueta={etiqueta}
          tonoGlifo={tonoGlifo}
          derecha={derecha}
        />
      </div>
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </div>
  )
}
