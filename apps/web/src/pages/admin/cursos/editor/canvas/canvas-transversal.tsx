import {
  useActualizarProyectoTransversal,
  useEliminarProyectoTransversal,
  useProyectoTransversal,
  useUpsertProyectoTransversal,
} from "@/features/admin-cursos/hooks/use-proyecto-transversal"
import { ConfirmDialog } from "@/shared/ui/patterns/confirm-dialog"
import { BlockCanvas } from "@/shared/ui/patterns/immersive/block-canvas"
import { Button } from "@/shared/ui/primitives/button"
import type { CursoDetalle, ProyectoTransversalDetalleAdmin } from "@nexott-learn/shared-types"
import { FileText, Sparkles, Trash2 } from "lucide-react"
import { type ReactNode, useState } from "react"
import { useDebouncedSave } from "../hooks/use-debounced-save"
import { useEditorStore } from "../use-editor-store"

interface CanvasTransversalProps {
  readonly curso: CursoDetalle
  readonly cursoId: string
}

export function CanvasTransversal({ curso, cursoId }: CanvasTransversalProps) {
  const query = useProyectoTransversal(cursoId)
  const setSelected = useEditorStore((s) => s.setSelected)
  const upsert = useUpsertProyectoTransversal(cursoId)

  if (query.isLoading) {
    return (
      <BlockCanvas title="Proyecto Transversal">
        <p className="text-sm text-text-muted">Cargando…</p>
      </BlockCanvas>
    )
  }

  if (query.data === null || query.data === undefined) {
    return (
      <BlockCanvas
        title={
          <span className="flex items-center gap-2">
            <Sparkles className="size-5 text-text-muted" strokeWidth={1.5} />
            Proyecto Transversal
          </span>
        }
        meta={
          <span className="text-text-muted text-xs">
            Inactivo · {curso.pesoProyectoTransversal}% del curso
          </span>
        }
      >
        <div className="rounded-[var(--radius-lg)] border border-glass-border border-dashed bg-glass-1 px-8 py-12 text-center">
          <Sparkles className="mx-auto mb-3 size-8 text-text-muted" strokeWidth={1.2} />
          <p className="mb-1 font-medium text-sm text-text-primary">Sin proyecto configurado</p>
          <p className="mb-6 text-text-muted text-xs">
            Activa el proyecto transversal definiendo título y enunciado.
          </p>
          <Button
            size="sm"
            onClick={() =>
              upsert.mutate(
                {
                  titulo: "Proyecto Transversal",
                  enunciado: "Describe aquí el enunciado del proyecto.",
                },
                { onSuccess: () => setSelected({ tipo: "transversal" }) },
              )
            }
            disabled={upsert.isPending}
          >
            Activar proyecto
          </Button>
        </div>
      </BlockCanvas>
    )
  }

  return (
    <CanvasTransversalCargado
      cursoId={cursoId}
      peso={curso.pesoProyectoTransversal}
      pt={query.data}
    />
  )
}

interface CargadoProps {
  readonly cursoId: string
  readonly peso: number
  readonly pt: ProyectoTransversalDetalleAdmin
}

function CanvasTransversalCargado({ cursoId, peso, pt }: CargadoProps) {
  const actualizar = useActualizarProyectoTransversal(cursoId)
  const eliminar = useEliminarProyectoTransversal(cursoId)
  const setSelected = useEditorStore((s) => s.setSelected)

  const [titulo, setTitulo] = useState(pt.titulo)
  const [enunciado, setEnunciado] = useState(pt.enunciado)

  useDebouncedSave(titulo, (v) => {
    const next = v.trim()
    if (next.length > 0 && next !== pt.titulo) {
      actualizar.mutate({ titulo: next })
    }
  })
  useDebouncedSave(enunciado, (v) => {
    const next = v.trim()
    if (next.length > 0 && next !== pt.enunciado) {
      actualizar.mutate({ enunciado: next })
    }
  })

  const [confirmDesactivarOpen, setConfirmDesactivarOpen] = useState(false)
  const handleEliminar = () => setConfirmDesactivarOpen(true)
  const handleConfirmDesactivar = () => {
    eliminar.mutate(undefined, {
      onSuccess: () => {
        setConfirmDesactivarOpen(false)
        setSelected({ tipo: "curso" })
      },
    })
  }

  return (
    <BlockCanvas
      title={
        <span className="flex items-center gap-2">
          <Sparkles className="size-5 text-brand-violet-soft" strokeWidth={1.5} />
          Proyecto Transversal
        </span>
      }
      meta={<span className="text-text-muted text-xs">Activo · {peso}% del curso</span>}
    >
      <CanvasField label="Título" icon={<FileText className="size-3.5 text-text-muted" />}>
        <input
          type="text"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          className="w-full rounded-[var(--radius-sm)] border border-glass-border bg-glass-1 px-3 py-2 text-sm text-text-primary outline-none focus:border-brand-violet"
        />
      </CanvasField>

      <CanvasField label="Enunciado" icon={<FileText className="size-3.5 text-text-muted" />}>
        <textarea
          value={enunciado}
          onChange={(e) => setEnunciado(e.target.value)}
          rows={8}
          className="w-full resize-none rounded-[var(--radius-sm)] border border-glass-border bg-glass-1 px-3 py-2 text-sm text-text-primary leading-relaxed outline-none focus:border-brand-violet"
        />
      </CanvasField>

      <div className="mt-4 flex justify-end">
        <Button variant="ghost" size="sm" onClick={handleEliminar} disabled={eliminar.isPending}>
          <Trash2 className="size-3.5 text-danger" />
          <span className="text-danger">Desactivar proyecto</span>
        </Button>
      </div>
      <ConfirmDialog
        open={confirmDesactivarOpen}
        onOpenChange={setConfirmDesactivarOpen}
        tone="danger"
        title="Desactivar proyecto transversal"
        description="Al desactivarlo se perderá la configuración actual (título, enunciado y rúbrica). Tendrás que volver a definirlo si lo reactivas."
        confirmLabel="Desactivar proyecto"
        loading={eliminar.isPending}
        onConfirm={handleConfirmDesactivar}
      />
    </BlockCanvas>
  )
}

interface CanvasFieldProps {
  readonly label: string
  readonly icon: ReactNode
  readonly children: ReactNode
}

function CanvasField({ label, icon, children }: CanvasFieldProps) {
  return (
    <div className="flex flex-col gap-2 rounded-[var(--radius-lg)] border border-glass-border bg-glass-1 p-4">
      <div className="flex items-center gap-1.5">
        {icon}
        <span className="font-medium text-[11px] text-text-muted uppercase tracking-[0.12em]">
          {label}
        </span>
      </div>
      {children}
    </div>
  )
}
