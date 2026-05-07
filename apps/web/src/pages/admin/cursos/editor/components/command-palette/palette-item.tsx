import { Command } from "cmdk"
import type { ReactNode } from "react"

interface PaletteItemProps {
  readonly icon: ReactNode
  readonly label: string
  readonly hint?: string
  readonly onSelect: () => void
}

export function PaletteItem({ icon, label, hint, onSelect }: PaletteItemProps) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex cursor-pointer items-center gap-3 rounded-[var(--radius-md)] px-3 py-2 text-sm text-text-primary aria-selected:bg-glass-2"
    >
      <span className="text-text-secondary">{icon}</span>
      <span className="flex-1">{label}</span>
      {hint ? <span className="text-[11px] text-text-muted">{hint}</span> : null}
    </Command.Item>
  )
}
