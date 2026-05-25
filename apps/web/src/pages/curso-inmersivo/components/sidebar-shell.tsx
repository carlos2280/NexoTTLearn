import { cn } from "@/shared/lib/cn"
import type { ReactNode } from "react"

interface SidebarShellProps {
  readonly claseAtenuado: string
  readonly eyebrow: string
  readonly children: ReactNode
}

/**
 * Shell minimo del sidebar reutilizado en los estados degenerados (error de
 * plan, arbol vacio). Estructura visual identica al sidebar real pero solo
 * con el eyebrow y un mensaje en el cuerpo.
 */
export function SidebarShell({ claseAtenuado, eyebrow, children }: SidebarShellProps) {
  return (
    <aside
      className={cn(
        "flex flex-col gap-3 overflow-y-auto border-border border-r bg-subtle p-5",
        claseAtenuado,
      )}
    >
      <h2 className="nx-eyebrow text-text-tertiary">{eyebrow}</h2>
      {children}
    </aside>
  )
}
