import {
  useActualizarBloque,
  useBloques,
  useCrearBloque,
  useReordenarBloques,
} from "@/features/admin-cursos/hooks/use-editor-curso"
import { BlockCanvas } from "@/shared/ui/patterns/immersive/block-canvas"
import { BlockRenderer } from "@/shared/ui/patterns/immersive/block-renderers"
import { Button } from "@/shared/ui/primitives/button"
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type {
  ActualizarBloqueAdminInput,
  BloqueDetalleAdmin,
  CrearBloqueAdminInput,
  SeccionDetalleAdmin,
} from "@nexott-learn/shared-types"
import { GripVertical, Plus } from "lucide-react"
import { useCallback, useState } from "react"
import { useKeyShortcut } from "../hooks/use-key-shortcut"
import { BloqueEditor } from "../inspector/inspector-bloque/bloque-editor"
import { tipoLabel } from "../inspector/inspector-bloque/types"
import { InsertBloqueMenu } from "./insert-bloque-menu"

interface CanvasSeccionProps {
  readonly cursoId: string
  readonly moduloId: string
  readonly seccion: SeccionDetalleAdmin
  readonly selectedBloqueId: string | null
  readonly onSelectBloque: (bloqueId: string) => void
}

export function CanvasSeccion({
  cursoId,
  moduloId,
  seccion,
  selectedBloqueId,
  onSelectBloque,
}: CanvasSeccionProps) {
  const bloquesQuery = useBloques(cursoId, moduloId, seccion.id)
  const crearBloque = useCrearBloque(cursoId, moduloId, seccion.id)
  const actualizarBloque = useActualizarBloque(cursoId, moduloId, seccion.id)
  const reordenar = useReordenarBloques(cursoId, moduloId, seccion.id)
  const [insertOpen, setInsertOpen] = useState(false)
  const bloques = bloquesQuery.data ?? []

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const insertBloque = (input: CrearBloqueAdminInput) => {
    crearBloque.mutate(input, {
      onSuccess: (creado) => {
        onSelectBloque(creado.id)
        setInsertOpen(false)
      },
    })
  }

  const abrirInsertar = useCallback(() => setInsertOpen(true), [])
  useKeyShortcut({ key: "/", enabled: !insertOpen, onTrigger: abrirInsertar })

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) {
      return
    }
    const oldIndex = bloques.findIndex((b) => b.id === active.id)
    const newIndex = bloques.findIndex((b) => b.id === over.id)
    if (oldIndex === -1 || newIndex === -1) {
      return
    }
    const reordenado = arrayMove(bloques, oldIndex, newIndex)
    reordenar.mutate({
      items: reordenado.map((b, i) => ({ id: b.id, orden: i })),
    })
  }

  return (
    <BlockCanvas
      title={seccion.titulo}
      meta={
        <span>
          {bloques.length} bloques · {seccion.evaluablesCount} evaluables
        </span>
      }
      footer={
        <div className="flex flex-col gap-2">
          {insertOpen ? (
            <InsertBloqueMenu onPick={insertBloque} onCancel={() => setInsertOpen(false)} />
          ) : (
            <Button variant="outline" full={true} onClick={abrirInsertar} className="border-dashed">
              <Plus className="size-4" />
              Insertar bloque (o presiona /)
            </Button>
          )}
        </div>
      }
    >
      {bloquesQuery.isLoading ? (
        <SeccionSkeleton />
      ) : bloques.length === 0 && !insertOpen ? (
        <div className="rounded-[var(--radius-lg)] border border-glass-border border-dashed bg-glass-1 px-6 py-12 text-center">
          <p className="font-medium text-sm text-text-primary">Sección vacía</p>
          <p className="mt-1 text-text-muted text-xs">
            Empieza insertando un bloque desde el botón inferior, o presiona <kbd>/</kbd>.
          </p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={bloques.map((b) => b.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-3">
              {bloques.map((bloque) => (
                <SortableBloque
                  key={bloque.id}
                  bloque={bloque}
                  selected={selectedBloqueId === bloque.id}
                  onSelect={onSelectBloque}
                  onSave={(input) => actualizarBloque.mutate({ bloqueId: bloque.id, input })}
                  saving={actualizarBloque.isPending}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </BlockCanvas>
  )
}

interface SortableBloqueProps {
  readonly bloque: BloqueDetalleAdmin
  readonly selected: boolean
  readonly onSelect: (id: string) => void
  readonly onSave: (input: ActualizarBloqueAdminInput) => void
  readonly saving: boolean
}

function SortableBloque({ bloque, selected, onSelect, onSave, saving }: SortableBloqueProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: bloque.id,
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? "opacity-50" : undefined}
    >
      <div className="group relative">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Arrastrar bloque"
          className="absolute top-2 left-1 z-10 hidden cursor-grab touch-none rounded p-1 text-text-faint hover:text-text-muted active:cursor-grabbing group-hover:flex"
        >
          <GripVertical className="size-3.5" strokeWidth={1.5} />
        </button>
        {selected ? (
          <div className="rounded-[var(--radius-md)] border border-brand-violet/40 bg-glass-1 px-4 py-3">
            <p className="mb-3 font-semibold text-[11px] text-brand-violet-soft uppercase tracking-[0.14em]">
              {tipoLabel(bloque.tipo)} · editando
            </p>
            <BloqueEditor bloque={bloque} onSave={onSave} saving={saving} />
          </div>
        ) : (
          <BlockRenderer bloque={bloque} mode="edit" selected={false} onSelect={onSelect} />
        )}
      </div>
    </div>
  )
}

function SeccionSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-16 animate-pulse rounded-[var(--radius-md)] bg-glass-1" />
      ))}
    </div>
  )
}
