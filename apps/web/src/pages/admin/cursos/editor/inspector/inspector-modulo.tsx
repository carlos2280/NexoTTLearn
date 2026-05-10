import { useActualizarModulo } from "@/features/admin-cursos/hooks/use-editor-curso"
import {
  InspectorPanel,
  InspectorRow,
  InspectorSection,
} from "@/shared/ui/patterns/immersive/inspector"
import type {
  ActualizarModuloAdminInput,
  CursoDetalle,
  ModuloDetalleAdmin,
} from "@nexott-learn/shared-types"
import { useState } from "react"
import { useDebouncedSave } from "../hooks/use-debounced-save"

interface InspectorModuloProps {
  readonly curso: CursoDetalle
  readonly cursoId: string
  readonly modulo: ModuloDetalleAdmin
}

export function InspectorModulo({ curso, cursoId, modulo }: InspectorModuloProps) {
  const actualizar = useActualizarModulo(cursoId)

  const save = (input: ActualizarModuloAdminInput) => {
    actualizar.mutate({ moduloId: modulo.id, input })
  }

  const [titulo, setTitulo] = useState(modulo.titulo)
  const [descripcion, setDescripcion] = useState(modulo.descripcion ?? "")
  useDebouncedSave(titulo, (v) => {
    const next = v.trim()
    if (next !== modulo.titulo && next.length >= 3) {
      save({ titulo: next })
    }
  })
  useDebouncedSave(descripcion, (v) => {
    const next = v.trim()
    if (next !== (modulo.descripcion ?? "")) {
      save({ descripcion: next })
    }
  })

  return (
    <InspectorPanel
      eyebrow="Módulo"
      title={modulo.titulo}
      subtitle={
        <span>
          {modulo.seccionesCount} secciones · {modulo.evaluablesCount} evaluables
        </span>
      }
    >
      <InspectorSection title="Identidad">
        <InspectorRow label="Nombre">
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="rounded-[var(--radius-sm)] border border-glass-border bg-glass-1 px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-violet"
          />
        </InspectorRow>
        <InspectorRow label="Descripción">
          <textarea
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={3}
            className="resize-none rounded-[var(--radius-sm)] border border-glass-border bg-glass-1 px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-violet"
          />
        </InspectorRow>
      </InspectorSection>

      <InspectorSection title="Pertenencia">
        <InspectorRow label="Área del curso">
          <select
            value={modulo.areaId}
            onChange={(e) => {
              if (e.target.value !== modulo.areaId) {
                save({ areaId: e.target.value })
              }
            }}
            className="rounded-[var(--radius-sm)] border border-glass-border bg-glass-1 px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-violet"
          >
            {curso.cursoAreas.map((a) => (
              <option key={a.id} value={a.areaId}>
                {a.area.nombre}
              </option>
            ))}
          </select>
        </InspectorRow>
      </InspectorSection>
    </InspectorPanel>
  )
}
