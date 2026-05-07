import { cn } from "@/shared/lib/cn"
// biome-ignore lint/style/noNamespaceImport: Radix expone subcomponentes; namespace import es idiomatico
import * as RadixTooltip from "@radix-ui/react-tooltip"
import type { ReactNode } from "react"

export const TooltipProvider = RadixTooltip.Provider

interface TooltipProps {
  readonly children: ReactNode
  readonly content: ReactNode
  readonly side?: "top" | "right" | "bottom" | "left"
  readonly align?: "start" | "center" | "end"
  readonly sideOffset?: number
  readonly delayDuration?: number
  readonly disabled?: boolean
}

export function Tooltip({
  children,
  content,
  side = "top",
  align = "center",
  sideOffset = 6,
  delayDuration = 200,
  disabled = false,
}: TooltipProps) {
  if (disabled) {
    return <>{children}</>
  }
  return (
    <RadixTooltip.Root delayDuration={delayDuration}>
      <RadixTooltip.Trigger asChild={true}>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          side={side}
          align={align}
          sideOffset={sideOffset}
          className={cn(
            "z-[var(--z-toast)] select-none",
            "rounded-[var(--radius-sm)] border border-glass-border bg-surface-2",
            "px-2.5 py-1.5 font-medium text-text-primary text-xs",
            "shadow-md backdrop-blur-xl",
            "data-[state=delayed-open]:animate-[fade-in_160ms_ease-out]",
          )}
        >
          {content}
          <RadixTooltip.Arrow className="fill-surface-2" width={10} height={5} />
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  )
}
