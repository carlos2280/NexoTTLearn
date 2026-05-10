import { cn } from "@/shared/lib/cn"
import { Button } from "@/shared/ui/primitives/button"
import type { CursoDetalle } from "@nexott-learn/shared-types"
import { CheckCircle2, Plus, Sparkles } from "lucide-react"
import { useState } from "react"
import { AddAreaDialog } from "../components/add-area-dialog"

interface CanvasCursoAreasProps {
  readonly cursoId: string
  readonly curso: CursoDetalle
  readonly onSelectArea: (cursoAreaId: string) => void
}

export function CanvasCursoAreas({ cursoId, curso, onSelectArea }: CanvasCursoAreasProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const sumaPesos = curso.cursoAreas.reduce((acc, a) => acc + a.peso, 0)
  const sumaCompleta = sumaPesos >= 99.99

  return (
    <section>
      <h3 className="mb-3 font-semibold text-[11px] text-text-muted uppercase tracking-[0.14em]">
        Áreas del curso
      </h3>
      {curso.cursoAreas.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-glass-border border-dashed bg-glass-1 px-6 py-12 text-center">
          <Sparkles className="mx-auto mb-3 size-5 text-brand-violet-soft" strokeWidth={1.5} />
          <p className="font-medium text-sm text-text-primary">Sin áreas todavía</p>
          <p className="mt-1 mb-4 text-text-muted text-xs">
            Agrega la primera área desde el catálogo para empezar a configurar pesos y módulos.
          </p>
          <Button variant="primary" size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="size-4" /> Agregar primera área
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            {curso.cursoAreas.map((area) => (
              <button
                key={area.id}
                type="button"
                onClick={() => onSelectArea(area.id)}
                className={cn(
                  "group flex flex-col gap-3 rounded-[var(--radius-lg)] border border-glass-border bg-glass-1 p-4 text-left",
                  "hover:-translate-y-0.5 transition-all hover:border-glass-border-strong",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="size-2.5 rounded-full"
                      style={{ background: area.area.color }}
                    />
                    <span className="font-medium text-sm text-text-primary">
                      {area.area.nombre}
                    </span>
                  </span>
                  <span className="font-mono text-text-secondary text-xs">{area.peso}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-glass-2">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${area.peso}%`, background: area.area.color }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-text-muted">
                  <span>{area.modulosCount} módulos</span>
                  <span>Umbral {area.puntajeObjetivo}</span>
                </div>
              </button>
            ))}
          </div>
          {sumaCompleta ? (
            <div className="mt-3 flex items-start gap-3 rounded-[var(--radius-lg)] border border-success/30 bg-success/5 px-4 py-3">
              <CheckCircle2
                className="mt-0.5 size-4 shrink-0 text-success"
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <div className="flex-1">
                <p className="font-medium text-sm text-text-primary">
                  Distribución de pesos completa (100%)
                </p>
                <p className="mt-0.5 text-text-muted text-xs">
                  Para incorporar otra área, primero reduce el peso de alguna existente y libera el
                  porcentaje que quieras asignarle.
                </p>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              full={true}
              onClick={() => setDialogOpen(true)}
              className="mt-3 border-dashed"
            >
              <Plus className="size-4" /> Agregar área del catálogo ·{" "}
              <span className="text-text-muted">{(100 - sumaPesos).toFixed(2)}% disponible</span>
            </Button>
          )}
        </>
      )}
      <AddAreaDialog
        cursoId={cursoId}
        curso={curso}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onAdded={onSelectArea}
      />
    </section>
  )
}
