import { cn } from "@/shared/lib/cn"
import type { BloqueRuntimePresetKey } from "@nexott-learn/shared-types"
import { motion } from "framer-motion"
import type { ReactNode } from "react"
import { presetParaBloque } from "../lib/bloque-presets"

interface BloqueShellProps {
  readonly presetKey: BloqueRuntimePresetKey
  readonly bloqueId: string
  readonly esActual: boolean
  readonly children: ReactNode
}

// Container canonico de un bloque del canvas inmersivo (canvas-bloques.md §4):
// border-left 3px del color del tipo + background discreto + ghost border +
// padding 24px + radius 16px. NO es interactivo a nivel de fila — el alumno
// interactua DENTRO del bloque (lee, ejecuta, responde).
//
// Focus indicator: cuando esActual=true se monta una barra brand-violet a la
// izquierda con layoutId compartido, asi al cambiar de bloque la barra se
// desliza con animacion (single source of truth de "donde estoy").

export function BloqueShell({ presetKey, bloqueId, esActual, children }: BloqueShellProps) {
  const preset = presetParaBloque(presetKey)

  return (
    <article
      id={`block-${bloqueId}`}
      data-actual={esActual}
      className={cn(
        "relative rounded-2xl border border-glass-border p-6 shadow-sm transition-shadow",
        "border-l-[3px]",
        preset.borderClass,
        preset.surfaceClass,
        esActual && "shadow-md",
      )}
    >
      {esActual && (
        <motion.span
          aria-hidden={true}
          layoutId="bloque-focus-indicator"
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
          className={cn(
            "pointer-events-none absolute top-2 bottom-2 left-0 w-[3px] rounded-full",
            "bg-gradient-to-b from-brand-violet to-brand-cyan",
            "shadow-glow-violet",
          )}
        />
      )}
      {children}
    </article>
  )
}
