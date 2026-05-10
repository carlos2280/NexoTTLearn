import {
  useCrearSeccion,
  useReordenarSecciones,
} from "@/features/admin-cursos/hooks/use-editor-curso"
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
import type {
  CursoDetalle,
  ModuloDetalleAdmin,
  SeccionListAdminResponse,
} from "@nexott-learn/shared-types"
import { ChevronRight, GripVertical, Layers, Plus, Sparkles, Star } from "lucide-react"
import { useCallback, useState } from "react"
import { useKeyShortcut } from "../hooks/use-key-shortcut"

interface CanvasModuloProps {
  readonly curso: CursoDetalle
  readonly cursoId: string
  readonly modulo: ModuloDetalleAdmin
  readonly secciones: SeccionListAdminResponse
  readonly onSelectSeccion: (seccionId: string) => void
}

export function CanvasModulo({
  curso,
  cursoId,
  modulo,
  secciones,
  onSelectSeccion,
}: CanvasModuloProps) {
  const crearSeccion = useCrearSeccion(cursoId, modulo.id)
  const reordenar = useReordenarSecciones(cursoId, modulo.id)
  const area = curso.cursoAreas.find((a) => a.areaId === modulo.areaId)
  const visibles = secciones.filter((s) => s.archivadoAt === null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const [crearOpen, setCrearOpen] = useState(false)
  const handleCrearSeccion = useCallback(() => setCrearOpen(true), [])
  const handleConfirmCrearSeccion = (titulo: string) => {
    crearSeccion.mutate(
      { titulo },
      {
        onSuccess: (creada) => {
          setCrearOpen(false)
          onSelectSeccion(creada.id)
        },
      },
    )
  }

  useKeyShortcut({ key: "n", onTrigger: handleCrearSeccion })

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) {
      return
    }
    const oldIndex = visibles.findIndex((s) => s.id === active.id)
    const newIndex = visibles.findIndex((s) => s.id === over.id)
    if (oldIndex === -1 || newIndex === -1) {
      return
    }
    const reordenado = arrayMove(visibles, oldIndex, newIndex)
    reordenar.mutate({
      items: reordenado.map((s, i) => ({ id: s.id, orden: i })),
    })
  }

  return (
    <BlockCanvas
      title={
        <span className="flex flex-col gap-1">
          <span className="font-semibold text-[11px] text-text-muted uppercase tracking-[0.16em]">
            Módulo · {area?.area.nombre ?? "Sin área"}
          </span>
          <span>{modulo.titulo}</span>
        </span>
      }
      meta={
        <div className="flex items-center gap-4 text-text-muted text-xs">
          <span className="flex items-center gap-1.5">
            <Layers className="size-3.5" /> {modulo.seccionesCount} secciones
          </span>
          <span className="flex items-center gap-1.5">
            <Star className="size-3.5" /> {modulo.evaluablesCount} evaluables
          </span>
        </div>
      }
    >
      <section>
        <h3 className="mb-3 font-semibold text-[11px] text-text-muted uppercase tracking-[0.14em]">
          Secciones del módulo
        </h3>
        {visibles.length === 0 ? (
          <EmptyEstado onCrear={handleCrearSeccion} disabled={crearSeccion.isPending} />
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={visibles.map((s) => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <ul className="flex flex-col gap-2">
                {visibles.map((seccion, idx) => (
                  <SortableSeccion
                    key={seccion.id}
                    id={seccion.id}
                    titulo={seccion.titulo}
                    bloquesCount={seccion.bloquesCount}
                    evaluablesCount={seccion.evaluablesCount}
                    idx={idx}
                    onSelect={onSelectSeccion}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}
        {visibles.length > 0 ? (
          <Button
            variant="outline"
            full={true}
            onClick={handleCrearSeccion}
            disabled={crearSeccion.isPending}
            className="mt-3 border-dashed"
          >
            <Plus className="size-4" /> Nueva sección (o presiona N)
          </Button>
        ) : null}
      </section>

      {modulo.miniProyectoActivo ? (
        <section className="mt-8">
          <h3 className="mb-3 font-semibold text-[11px] text-text-muted uppercase tracking-[0.14em]">
            Mini proyecto
          </h3>
          <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-success/30 bg-success/5 p-4">
            <Sparkles className="size-5 text-success" strokeWidth={1.5} />
            <div className="flex-1">
              <p className="font-medium text-sm text-text-primary">Mini proyecto activo</p>
              <p className="text-text-muted text-xs">
                Umbral: {modulo.umbralMiniOverride ?? "hereda del área"}
              </p>
            </div>
          </div>
        </section>
      ) : null}
      <PromptDialog
        open={crearOpen}
        onOpenChange={setCrearOpen}
        eyebrow={modulo.titulo}
        title="Nueva sección"
        description="Las secciones agrupan los bloques de contenido y evaluaciones del módulo."
        label="Nombre de la sección"
        placeholder="Ej: Introducción a las APIs REST"
        confirmLabel="Crear sección"
        loading={crearSeccion.isPending}
        onConfirm={handleConfirmCrearSeccion}
      />
    </BlockCanvas>
  )
}

interface SortableSeccionProps {
  readonly id: string
  readonly titulo: string
  readonly bloquesCount: number
  readonly evaluablesCount: number
  readonly idx: number
  readonly onSelect: (id: string) => void
}

function SortableSeccion({
  id,
  titulo,
  bloquesCount,
  evaluablesCount,
  idx,
  onSelect,
}: SortableSeccionProps) {
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
          aria-label="Arrastrar sección"
          className="cursor-grab touch-none text-text-faint hover:text-text-muted active:cursor-grabbing"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <GripVertical className="size-4" strokeWidth={1.5} />
        </span>
        <span className="font-mono text-text-muted text-xs">{idx + 1}.</span>
        <span className="flex-1">
          <span className="block font-medium text-sm text-text-primary">{titulo}</span>
          <span className="block text-[11px] text-text-muted">
            {bloquesCount} bloques · {evaluablesCount} evaluables
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
      <p className="font-medium text-sm text-text-primary">Sin secciones todavía</p>
      <p className="mt-1 mb-4 text-text-muted text-xs">
        Empieza por crear la primera sección. Las secciones contienen los bloques de contenido.
      </p>
      <Button variant="primary" size="sm" onClick={onCrear} disabled={disabled}>
        <Plus className="size-4" /> Crear primera sección
      </Button>
    </div>
  )
}
