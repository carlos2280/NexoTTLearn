import { NxtTab, NxtTabs } from "@carlos2280/nexott-ui/react"
import type { CursoStatus } from "@nexott-learn/shared-types"

export type FiltroEstado = "all" | CursoStatus

type Conteos = Record<FiltroEstado, number>

type CursosToolbarProps = {
  readonly filtro: FiltroEstado
  readonly conteos: Conteos
  readonly onFiltroChange: (filtro: FiltroEstado) => void
}

const TABS: ReadonlyArray<{
  readonly value: FiltroEstado
  readonly label: string
}> = [
  { value: "all", label: "Todos" },
  { value: "published", label: "Publicados" },
  { value: "draft", label: "Borradores" },
  { value: "disabled", label: "Deshabilitados" },
]

export function CursosToolbar({ filtro, conteos, onFiltroChange }: CursosToolbarProps) {
  return (
    <NxtTabs
      variant="underline"
      onNxtTabChange={(event) => onFiltroChange(event.detail.value as FiltroEstado)}
    >
      {TABS.map((tab) => (
        <NxtTab
          key={tab.value}
          value={tab.value}
          label={tab.label}
          badge={conteos[tab.value]}
          active={filtro === tab.value}
        />
      ))}
    </NxtTabs>
  )
}
