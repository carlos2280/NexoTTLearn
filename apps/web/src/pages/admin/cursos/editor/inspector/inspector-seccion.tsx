import {
  InspectorPanel,
  InspectorRow,
  InspectorSection,
} from "@/shared/ui/patterns/immersive/inspector"
import { Button } from "@/shared/ui/primitives/button"
import type { SeccionDetalleAdmin } from "@nexott-learn/shared-types"
import { Archive, Trash2 } from "lucide-react"

interface InspectorSeccionProps {
  readonly seccion: SeccionDetalleAdmin
  readonly onArchivar: () => void
  readonly onEliminar: () => void
}

export function InspectorSeccion({ seccion, onArchivar, onEliminar }: InspectorSeccionProps) {
  return (
    <InspectorPanel
      eyebrow="Sección"
      title={seccion.titulo}
      subtitle={
        <span>
          {seccion.bloquesCount} bloques · {seccion.evaluablesCount} evaluables
        </span>
      }
    >
      <InspectorSection title="Propiedades">
        <InspectorRow label="Título">
          <input
            type="text"
            defaultValue={seccion.titulo}
            className="rounded-[var(--radius-sm)] border border-glass-border bg-glass-1 px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-violet"
          />
        </InspectorRow>
        <InspectorRow label="Orden">
          <span className="text-sm text-text-secondary">#{seccion.orden + 1}</span>
        </InspectorRow>
      </InspectorSection>

      <InspectorSection title="Estado" defaultOpen={false}>
        <p className="text-text-muted text-xs">
          {seccion.tieneEntregas
            ? "Tiene entregas: solo se permite edición no destructiva."
            : "Sin entregas aún."}
        </p>
      </InspectorSection>

      <InspectorSection title="Acciones" defaultOpen={false}>
        <Button variant="outline" size="sm" full={true} onClick={onArchivar}>
          <Archive className="size-3.5" />
          {seccion.archivadoAt ? "Desarchivar" : "Archivar"}
        </Button>
        {seccion.tieneEntregas ? null : (
          <Button variant="ghost" size="sm" full={true} onClick={onEliminar}>
            <Trash2 className="size-3.5 text-danger" />
            <span className="text-danger">Eliminar sección</span>
          </Button>
        )}
      </InspectorSection>
    </InspectorPanel>
  )
}
