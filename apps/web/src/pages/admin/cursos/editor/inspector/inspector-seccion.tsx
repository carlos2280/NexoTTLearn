import { useActualizarSeccion } from "@/features/admin-cursos/hooks/use-editor-curso"
import {
  InspectorPanel,
  InspectorRow,
  InspectorSection,
} from "@/shared/ui/patterns/immersive/inspector"
import type { SeccionDetalleAdmin } from "@nexott-learn/shared-types"
import { useState } from "react"
import { useDebouncedSave } from "../hooks/use-debounced-save"

interface InspectorSeccionProps {
  readonly cursoId: string
  readonly moduloId: string
  readonly seccion: SeccionDetalleAdmin
}

export function InspectorSeccion({ cursoId, moduloId, seccion }: InspectorSeccionProps) {
  const actualizar = useActualizarSeccion(cursoId, moduloId)
  const [titulo, setTitulo] = useState(seccion.titulo)

  useDebouncedSave(titulo, (v) => {
    const next = v.trim()
    if (next !== seccion.titulo && next.length >= 3) {
      actualizar.mutate({ seccionId: seccion.id, input: { titulo: next } })
    }
  })

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
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
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
    </InspectorPanel>
  )
}
