import {
  Tooltip as RadixTooltip,
  TooltipArrow,
  TooltipContent,
  TooltipPortal,
  TooltipProvider,
  TooltipTrigger,
} from "@radix-ui/react-tooltip"
import type { ReactNode } from "react"

interface TooltipProps {
  readonly contenido: ReactNode
  readonly children: ReactNode
  readonly side?: "top" | "right" | "bottom" | "left"
  readonly align?: "start" | "center" | "end"
  readonly sideOffset?: number
  readonly delayDuration?: number
  readonly atajo?: string
}

/**
 * Tooltip NexoTT.
 *
 * Surface oscura (text-primary), texto blanco, radius generoso, sombra elevada,
 * micro-fade-in. Opcional: muestra un atajo de teclado al lado del texto en mono.
 *
 * Asume que TooltipProvider vive en el shell raíz (admin/participante).
 * Si lo usas fuera, envuelve manualmente con <TooltipProvider>.
 */
export function Tooltip({
  contenido,
  children,
  side = "top",
  align = "center",
  sideOffset = 8,
  delayDuration,
  atajo,
}: TooltipProps) {
  return (
    <RadixTooltip delayDuration={delayDuration}>
      <TooltipTrigger asChild={true}>{children}</TooltipTrigger>
      <TooltipPortal>
        <TooltipContent
          side={side}
          align={align}
          sideOffset={sideOffset}
          className="nx-motion-popover z-tooltip inline-flex items-center gap-2 rounded-lg bg-text-primary px-3 py-1.5 text-caption text-surface shadow-overlay"
        >
          <span className="leading-none">{contenido}</span>
          {atajo ? (
            <span className="font-mono text-[10px] text-text-tertiary tracking-wider">{atajo}</span>
          ) : null}
          <TooltipArrow className="fill-text-primary" width={10} height={5} />
        </TooltipContent>
      </TooltipPortal>
    </RadixTooltip>
  )
}

/**
 * Re-export del provider para casos donde se monta fuera de un shell.
 */
export { TooltipProvider }
