import { cn } from "@/shared/lib/cn"
import type { ReactNode } from "react"

interface EncabezadoCeldaProps {
  readonly glifo: string
  readonly etiqueta: string
  /** Clase de color del glifo (p. ej. `text-accent`). Neutro por defecto. */
  readonly tonoGlifo?: string
  readonly derecha?: ReactNode
}

/**
 * Cabecera mono de una "celda" del archivo inmersivo: un glifo de color
 * (`?` quiz, `>` ejercicio) + una etiqueta tipo comentario, en la misma familia
 * que la cabecera del editor (`● lenguaje`). Se usa suelta como marcador de
 * región o dentro de `CeldaBloque` como barra superior de la caja.
 */
export function EncabezadoCelda({
  glifo,
  etiqueta,
  tonoGlifo = "text-text-tertiary",
  derecha,
}: EncabezadoCeldaProps) {
  return (
    <div className="flex items-center gap-2">
      <span aria-hidden={true} className={cn("font-code text-body-sm leading-none", tonoGlifo)}>
        {glifo}
      </span>
      <span className="font-code text-[color:var(--color-syntax-comment)] text-caption tracking-wide">
        {etiqueta}
      </span>
      {derecha ? <div className="ml-auto flex items-center">{derecha}</div> : null}
    </div>
  )
}
