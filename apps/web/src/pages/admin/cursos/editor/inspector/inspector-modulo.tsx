import {
  useActualizarModulo,
  useArchivarModulo,
  useEliminarModulo,
} from "@/features/admin-cursos/hooks/use-editor-curso"
import { ConfirmDialog } from "@/shared/ui/patterns/confirm-dialog"
import {
  InspectorPanel,
  InspectorRow,
  InspectorSection,
} from "@/shared/ui/patterns/immersive/inspector"
import { Button } from "@/shared/ui/primitives/button"
import type {
  ActualizarModuloAdminInput,
  CursoDetalle,
  ModuloDetalleAdmin,
} from "@nexott-learn/shared-types"
import { Archive, Trash2 } from "lucide-react"
import { useState } from "react"
import { useDebouncedSave } from "../hooks/use-debounced-save"
import { useEditorStore } from "../use-editor-store"

interface InspectorModuloProps {
  readonly curso: CursoDetalle
  readonly cursoId: string
  readonly modulo: ModuloDetalleAdmin
}

export function InspectorModulo({ curso, cursoId, modulo }: InspectorModuloProps) {
  const actualizar = useActualizarModulo(cursoId)
  const archivar = useArchivarModulo(cursoId)
  const eliminar = useEliminarModulo(cursoId)
  const setSelected = useEditorStore((s) => s.setSelected)
  const archivado = modulo.archivadoAt !== null

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

  const handleArchivar = () => {
    archivar.mutate({ moduloId: modulo.id, archivar: !archivado })
  }
  const [confirmEliminarOpen, setConfirmEliminarOpen] = useState(false)
  const handleEliminar = () => setConfirmEliminarOpen(true)
  const handleConfirmEliminar = () => {
    eliminar.mutate(modulo.id, {
      onSuccess: () => {
        setConfirmEliminarOpen(false)
        setSelected({ tipo: "curso" })
      },
    })
  }

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

      <InspectorSection title="Mini proyecto">
        <Button
          variant={modulo.miniProyectoActivo ? "primary" : "outline"}
          size="sm"
          onClick={() => save({ miniProyectoActivo: !modulo.miniProyectoActivo })}
          disabled={actualizar.isPending}
        >
          {modulo.miniProyectoActivo ? "Activado" : "Sin mini"}
        </Button>
      </InspectorSection>

      <InspectorSection title="Acciones" defaultOpen={false}>
        <Button
          variant="outline"
          size="sm"
          full={true}
          onClick={handleArchivar}
          disabled={archivar.isPending}
        >
          <Archive className="size-3.5" />
          {archivado ? "Desarchivar" : "Archivar"}
        </Button>
        {modulo.tieneEntregas ? null : (
          <Button
            variant="ghost"
            size="sm"
            full={true}
            onClick={handleEliminar}
            disabled={eliminar.isPending}
          >
            <Trash2 className="size-3.5 text-danger" />
            <span className="text-danger">Eliminar módulo</span>
          </Button>
        )}
      </InspectorSection>
      <ConfirmDialog
        open={confirmEliminarOpen}
        onOpenChange={setConfirmEliminarOpen}
        tone="danger"
        title="Eliminar módulo"
        description={
          <>
            Vas a eliminar el módulo <strong>{modulo.titulo}</strong> y todas sus secciones y
            bloques. Esta acción no se puede deshacer.
          </>
        }
        confirmLabel="Eliminar módulo"
        loading={eliminar.isPending}
        onConfirm={handleConfirmEliminar}
      />
    </InspectorPanel>
  )
}
