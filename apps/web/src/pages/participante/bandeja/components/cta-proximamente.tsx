import { Button, type ButtonProps } from "@/shared/ui/primitives/button"
import { Tooltip } from "@/shared/ui/primitives/tooltip"
import type { ReactNode } from "react"

interface CtaProximamenteProps {
  readonly children: ReactNode
  readonly variant?: ButtonProps["variant"]
  readonly size?: ButtonProps["size"]
}

// CTA inhabilitado con tooltip "Proximamente". Lo usan los estados especiales
// (catalogo, mis-cursos, expediente) cuando la ruta destino aun no existe.
// Patron: el wrapper <span> es quien recibe el hover/focus del Tooltip de
// Radix — un <button disabled> no propaga pointer events. El boton interno
// usa aria-disabled (no disabled real) para mantener accesibilidad y permitir
// que el span capture hover.
export function CtaProximamente({
  children,
  variant = "primary",
  size = "md",
}: CtaProximamenteProps) {
  return (
    <Tooltip content="Próximamente">
      <span className="inline-flex">
        <Button
          type="button"
          variant={variant}
          size={size}
          aria-disabled={true}
          onClick={(event) => event.preventDefault()}
          className="cursor-not-allowed opacity-50"
        >
          {children}
        </Button>
      </span>
    </Tooltip>
  )
}
