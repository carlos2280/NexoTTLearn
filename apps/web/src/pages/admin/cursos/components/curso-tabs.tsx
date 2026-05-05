import { NxtTab, NxtTabs } from "@carlos2280/nexott-ui/react"

export type TabActiva = "general" | "modulos" | "ponderaciones"

interface CursoTabsProps {
  readonly activa: TabActiva
  readonly onCambioTab: (tab: TabActiva) => void
  // Si false, los tabs Modulos y Ponderaciones quedan disabled (modo crear:
  // aun no hay cursoId, no podemos pegarle al endpoint).
  readonly modulosHabilitado: boolean
  readonly modulosCount?: number
  readonly participantesCount?: number
  readonly convocatoriasCount?: number
}

// "general", "modulos" y "ponderaciones" estan activos. Las demas se
// renderizan disabled como anticipo del nav final.
// TODO(tabs): cuando NxtTab exponga `title`/tooltip nativo, mostrar
// "Proximamente" al hover. Por ahora el `disabled` ya comunica el estado.
export function CursoTabs({
  activa,
  onCambioTab,
  modulosHabilitado,
  modulosCount = 0,
  participantesCount = 0,
  convocatoriasCount = 0,
}: CursoTabsProps) {
  return (
    <NxtTabs
      variant="underline"
      onNxtTabChange={(event) => {
        const value = event.detail.value
        if (value === "general" || value === "modulos" || value === "ponderaciones") {
          onCambioTab(value)
        }
      }}
    >
      <NxtTab label="General" value="general" icon="edit" active={activa === "general"} />
      <NxtTab
        label="Modulos"
        value="modulos"
        icon="layers"
        badge={modulosCount}
        active={activa === "modulos"}
        disabled={!modulosHabilitado}
      />
      <NxtTab
        label="Ponderaciones"
        value="ponderaciones"
        icon="bar-chart"
        active={activa === "ponderaciones"}
        disabled={!modulosHabilitado}
      />
      <NxtTab
        label="Participantes"
        value="participantes"
        icon="users"
        badge={participantesCount}
        disabled={true}
      />
      <NxtTab
        label="Convocatorias"
        value="convocatorias"
        icon="calendar"
        badge={convocatoriasCount}
        disabled={true}
      />
    </NxtTabs>
  )
}
