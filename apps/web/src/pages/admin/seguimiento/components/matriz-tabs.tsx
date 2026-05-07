import { type TabItem, Tabs } from "@/shared/ui/patterns/tabs"
import type { SeguimientoTab } from "@nexott-learn/shared-types"
import { Calendar, History, Trophy } from "lucide-react"

// Tab "Final" deshabilitado: el back solo expone "inicial" | "actual" en MVP.
type TabValue = SeguimientoTab | "final"

const ITEMS: readonly TabItem<TabValue>[] = [
  { value: "inicial", label: "Inicial", icon: History },
  { value: "actual", label: "Progreso", icon: Calendar },
  { value: "final", label: "Final", icon: Trophy, disabled: true },
]

interface MatrizTabsProps {
  readonly value: SeguimientoTab
  readonly onChange: (next: SeguimientoTab) => void
}

export function MatrizTabs({ value, onChange }: MatrizTabsProps) {
  const handle = (next: TabValue) => {
    if (next !== "final") {
      onChange(next)
    }
  }
  return <Tabs<TabValue> items={ITEMS} value={value} onChange={handle} ariaLabel="Tabs de matriz" />
}
