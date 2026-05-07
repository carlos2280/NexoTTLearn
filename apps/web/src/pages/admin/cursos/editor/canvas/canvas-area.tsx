import { useCrearModulo } from "@/features/admin-cursos/hooks/use-editor-curso"
import { cn } from "@/shared/lib/cn"
import { BlockCanvas } from "@/shared/ui/patterns/immersive/block-canvas"
import { Button } from "@/shared/ui/primitives/button"
import type { CursoAreaDetalle, ModuloListAdminResponse } from "@nexott-learn/shared-types"
import { ChevronRight, Layers, Package, Plus, Sparkles, Star } from "lucide-react"

interface CanvasAreaProps {
  readonly cursoId: string
  readonly cursoArea: CursoAreaDetalle
  readonly modulos: ModuloListAdminResponse
  readonly onSelectModulo: (moduloId: string) => void
}

export function CanvasArea({ cursoId, cursoArea, modulos, onSelectModulo }: CanvasAreaProps) {
  const crearModulo = useCrearModulo(cursoId)
  const modulosArea = modulos.filter((m) => m.areaId === cursoArea.areaId && m.archivadoAt === null)

  const handleCrear = () => {
    const titulo = window.prompt("Nombre del nuevo módulo")?.trim()
    if (!titulo || titulo.length < 3) {
      return
    }
    crearModulo.mutate(
      { titulo, areaId: cursoArea.areaId },
      { onSuccess: (creado) => onSelectModulo(creado.id) },
    )
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
          <ul className="flex flex-col gap-2">
            {modulosArea.map((modulo) => (
              <li key={modulo.id}>
                <button
                  type="button"
                  onClick={() => onSelectModulo(modulo.id)}
                  className={cn(
                    "group flex w-full items-center gap-3 rounded-[var(--radius-md)] border border-glass-border bg-glass-1 px-4 py-3 text-left",
                    "hover:border-glass-border-strong hover:bg-glass-2",
                  )}
                >
                  <Package className="size-4 text-text-muted" strokeWidth={1.5} />
                  <span className="flex-1">
                    <span className="block font-medium text-sm text-text-primary">
                      {modulo.titulo}
                    </span>
                    <span className="block text-[11px] text-text-muted">
                      {modulo.seccionesCount} secciones · {modulo.evaluablesCount} evaluables
                    </span>
                  </span>
                  <ChevronRight className="size-4 text-text-faint group-hover:text-text-secondary" />
                </button>
              </li>
            ))}
          </ul>
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
    </BlockCanvas>
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
