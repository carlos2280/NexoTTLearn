import { useCrearModulo, useReordenarModulos } from "@/features/admin-cursos/hooks/use-editor-curso"
import { cn } from "@/shared/lib/cn"
import { BlockCanvas } from "@/shared/ui/patterns/immersive/block-canvas"
import { PromptDialog } from "@/shared/ui/patterns/prompt-dialog"
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
import type { CursoAreaDetalle, ModuloListAdminResponse } from "@nexott-learn/shared-types"
import { ChevronRight, GripVertical, Layers, Plus, Sparkles, Star } from "lucide-react"
import { useState } from "react"

interface CanvasAreaProps {
  readonly cursoId: string
  readonly cursoArea: CursoAreaDetalle
  readonly modulos: ModuloListAdminResponse
  readonly onSelectModulo: (moduloId: string) => void
}

export function CanvasArea({ cursoId, cursoArea, modulos, onSelectModulo }: CanvasAreaProps) {
  const crearModulo = useCrearModulo(cursoId)
  const reordenar = useReordenarModulos(cursoId)
  const modulosArea = modulos.filter((m) => m.areaId === cursoArea.areaId && m.archivadoAt === null)
  const [crearOpen, setCrearOpen] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleCrear = () => setCrearOpen(true)

  const handleConfirmCrear = (titulo: string) => {
    crearModulo.mutate(
      { titulo, areaId: cursoArea.areaId },
      {
        onSuccess: (creado) => {
          setCrearOpen(false)
          onSelectModulo(creado.id)
        },
      },
    )
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) {
      return
    }
    const oldIndex = modulosArea.findIndex((m) => m.id === active.id)
    const newIndex = modulosArea.findIndex((m) => m.id === over.id)
    if (oldIndex === -1 || newIndex === -1) {
      return
    }
    const reordenado = arrayMove(modulosArea, oldIndex, newIndex)
    reordenar.mutate({
      items: reordenado.map((m, i) => ({ id: m.id, orden: i })),
    })
  }

  return (
    <BlockCanvas
      title={
        <span className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="size-3 rounded-full"
            style={{ background: cursoArea.area.color }}
          />
          <span className="flex flex-col gap-1">
            <span className="font-semibold text-[11px] text-text-muted uppercase tracking-[0.16em]">
              Área del curso
            </span>
            <span>{cursoArea.area.nombre}</span>
          </span>
        </span>
      }
      meta={
        <div className="flex items-center gap-4 text-text-muted text-xs">
          <span className="flex items-center gap-1.5">
            <Layers className="size-3.5" /> {cursoArea.peso}% del curso
          </span>
          <span className="flex items-center gap-1.5">
            <Star className="size-3.5" /> Umbral {cursoArea.puntajeObjetivo}
          </span>
        </div>
      }
    >
      <section>
        <h3 className="mb-3 font-semibold text-[11px] text-text-muted uppercase tracking-[0.14em]">
          Módulos en esta área ({modulosArea.length})
        </h3>
        {modulosArea.length === 0 ? (
          <EmptyEstado onCrear={handleCrear} disabled={crearModulo.isPending} />
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={modulosArea.map((m) => m.id)}
              strategy={verticalListSortingStrategy}
            >
              <ul className="flex flex-col gap-2">
                {modulosArea.map((modulo) => (
                  <SortableModulo
                    key={modulo.id}
                    id={modulo.id}
                    titulo={modulo.titulo}
                    seccionesCount={modulo.seccionesCount}
                    evaluablesCount={modulo.evaluablesCount}
                    onSelect={onSelectModulo}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}
        {modulosArea.length > 0 ? (
          <Button
            variant="outline"
            full={true}
            onClick={handleCrear}
            disabled={crearModulo.isPending}
            className="mt-3 border-dashed"
          >
            <Plus className="size-4" /> Agregar módulo a {cursoArea.area.nombre}
          </Button>
        ) : null}
      </section>
      <PromptDialog
        open={crearOpen}
        onOpenChange={setCrearOpen}
        eyebrow={cursoArea.area.nombre}
        title="Nuevo módulo"
        description="Asigna un nombre claro. Podrás editarlo más tarde y configurar sus secciones desde el editor."
        label="Nombre del módulo"
        placeholder="Ej: Fundamentos de Node.js"
        confirmLabel="Crear módulo"
        loading={crearModulo.isPending}
        onConfirm={handleConfirmCrear}
      />
    </BlockCanvas>
  )
}

interface SortableModuloProps {
  readonly id: string
  readonly titulo: string
  readonly seccionesCount: number
  readonly evaluablesCount: number
  readonly onSelect: (id: string) => void
}

function SortableModulo({
  id,
  titulo,
  seccionesCount,
  evaluablesCount,
  onSelect,
}: SortableModuloProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  })

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={isDragging ? "opacity-50" : undefined}
    >
      <button
        type="button"
        onClick={() => onSelect(id)}
        className={cn(
          "group flex w-full items-center gap-3 rounded-[var(--radius-md)] border border-glass-border bg-glass-1 px-4 py-3 text-left",
          "hover:border-glass-border-strong hover:bg-glass-2",
        )}
      >
        <span
          {...attributes}
          {...listeners}
          aria-label="Arrastrar módulo"
          className="cursor-grab touch-none text-text-faint hover:text-text-muted active:cursor-grabbing"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <GripVertical className="size-4" strokeWidth={1.5} />
        </span>
        <span className="flex-1">
          <span className="block font-medium text-sm text-text-primary">{titulo}</span>
          <span className="block text-[11px] text-text-muted">
            {seccionesCount} secciones · {evaluablesCount} evaluables
          </span>
        </span>
        <ChevronRight className="size-4 text-text-faint group-hover:text-text-secondary" />
      </button>
    </li>
  )
}

interface EmptyEstadoProps {
  readonly onCrear: () => void
  readonly disabled: boolean
}

function EmptyEstado({ onCrear, disabled }: EmptyEstadoProps) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-glass-border border-dashed bg-glass-1 px-6 py-10 text-center">
      <Sparkles className="mx-auto mb-3 size-5 text-brand-violet-soft" strokeWidth={1.5} />
      <p className="font-medium text-sm text-text-primary">Sin módulos en esta área</p>
      <p className="mt-1 mb-4 text-text-muted text-xs">
        Empieza agregando el primer módulo. Los módulos contienen las secciones de contenido.
      </p>
      <Button variant="primary" size="sm" onClick={onCrear} disabled={disabled}>
        <Plus className="size-4" /> Crear primer módulo
      </Button>
    </div>
  )
}
