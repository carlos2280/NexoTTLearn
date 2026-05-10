import { cn } from "@/shared/lib/cn"
import { Check } from "lucide-react"
import { useId } from "react"
import { AreaColorDot } from "./area-color-dot"

const COLORES = ["indigo", "emerald", "violet", "amber", "rose", "cyan", "slate"] as const

interface AreaColorPickerProps {
  readonly value: string
  readonly onChange: (value: string) => void
  readonly id?: string
}

export function AreaColorPicker({ value, onChange, id }: AreaColorPickerProps) {
  const groupName = useId()
  return (
    <div id={id} className="flex flex-wrap gap-2">
      {COLORES.map((color) => {
        const selected = value === color
        return (
          <label
            key={color}
            className={cn(
              "relative flex size-9 cursor-pointer items-center justify-center rounded-[var(--radius-md)] border transition-all",
              "focus-within:outline-none focus-within:ring-2 focus-within:ring-brand-violet",
              selected
                ? "border-brand-violet bg-[rgb(124_58_237/0.08)]"
                : "border-glass-border bg-glass-1 hover:border-glass-border-strong",
            )}
          >
            <input
              type="radio"
              name={groupName}
              value={color}
              checked={selected}
              onChange={() => onChange(color)}
              aria-label={color}
              className="sr-only"
            />
            <AreaColorDot color={color} size="sm" />
            {selected ? (
              <Check
                aria-hidden="true"
                className="absolute size-3.5 text-text-on-brand"
                strokeWidth={2.5}
              />
            ) : null}
          </label>
        )
      })}
    </div>
  )
}
