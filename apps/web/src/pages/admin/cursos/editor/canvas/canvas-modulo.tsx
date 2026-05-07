import { useCrearSeccion } from "@/features/admin-cursos/hooks/use-editor-curso"
import { cn } from "@/shared/lib/cn"
import { BlockCanvas } from "@/shared/ui/patterns/immersive/block-canvas"
import { Button } from "@/shared/ui/primitives/button"
import type {
  CursoDetalle,
  ModuloDetalleAdmin,
  SeccionListAdminResponse,
} from "@nexott-learn/shared-types"
import { ChevronRight, GripVertical, Layers, Plus, Sparkles, Star } from "lucide-react"
import { useCallback } from "react"
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
  const area = curso.cursoAreas.find((a) => a.areaId === modulo.areaId)
  const visibles = secciones.filter((s) => s.archivadoAt === null)

  const handleCrearSeccion = useCallback(() => {
    const titulo = window.prompt("Nombre de la nueva sección")?.trim()
    if (!titulo || titulo.length < 3) {
      return
    }
    crearSeccion.mutate({ titulo }, { onSuccess: (creada) => onSelectSeccion(creada.id) })
  }, [crearSeccion, onSelectSeccion])

  useKeyShortcut({ key: "n", onTrigger: handleCrearSeccion })

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
          <ul className="flex flex-col gap-2">
            {visibles.map((seccion, idx) => (
              <li key={seccion.id}>
                <button
                  type="button"
                  onClick={() => onSelectSeccion(seccion.id)}
                  className={cn(
                    "group flex w-full items-center gap-3 rounded-[var(--radius-md)] border border-glass-border bg-glass-1 px-4 py-3 text-left",
                    "hover:border-glass-border-strong hover:bg-glass-2",
                  )}
                >
                  <GripVertical className="size-4 text-text-faint" strokeWidth={1.5} />
                  <span className="font-mono text-text-muted text-xs">{idx + 1}.</span>
                  <span className="flex-1">
                    <span className="block font-medium text-sm text-text-primary">
                      {seccion.titulo}
                    </span>
                    <span className="block text-[11px] text-text-muted">
                      {seccion.bloquesCount} bloques · {seccion.evaluablesCount} evaluables
                    </span>
                  </span>
                  <ChevronRight className="size-4 text-text-faint group-hover:text-text-secondary" />
                </button>
              </li>
            ))}
          </ul>
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
