import { cn } from "@/shared/lib/cn"
import { BlockCanvas } from "@/shared/ui/patterns/immersive/block-canvas"
import type { CursoDetalle } from "@nexott-learn/shared-types"
import { Layers, Mic, Sparkles, Target, Users } from "lucide-react"
import type { ReactNode } from "react"
import { CanvasCursoAreas } from "./canvas-curso-areas"

interface CanvasCursoProps {
  readonly curso: CursoDetalle
  readonly cursoId: string
  readonly onSelectArea: (cursoAreaId: string) => void
}

export function CanvasCurso({ curso, cursoId, onSelectArea }: CanvasCursoProps) {
  return (
    <BlockCanvas
      title={
        <span className="flex flex-col gap-1">
          <span className="font-semibold text-[11px] text-text-muted uppercase tracking-[0.16em]">
            Curso · {curso.empresaCliente}
          </span>
          <span>{curso.titulo}</span>
        </span>
      }
      meta={
        <div className="flex items-center gap-4 text-xs">
          <Stat icon={<Target className="size-3.5" />} label={`${curso.cursoAreas.length} áreas`} />
          <Stat
            icon={<Layers className="size-3.5" />}
            label={`${curso.contadores.modulos} módulos`}
          />
          <Stat
            icon={<Users className="size-3.5" />}
            label={`${curso.contadores.inscripcionesActivas} candidatos`}
          />
        </div>
      }
    >
      <CanvasCursoAreas cursoId={cursoId} curso={curso} onSelectArea={onSelectArea} />

      <section className="mt-8">
        <h3 className="mb-3 font-semibold text-[11px] text-text-muted uppercase tracking-[0.14em]">
          Hitos del curso
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <HitoCard
            icon={<Sparkles className="size-4" strokeWidth={1.5} />}
            title="Proyecto Transversal"
            activo={curso.proyectoTransversal.activo}
            peso={curso.pesoProyectoTransversal}
          />
          <HitoCard
            icon={<Mic className="size-4" strokeWidth={1.5} />}
            title="Entrevista IA"
            activo={curso.entrevistaIAConfig.activa}
            peso={curso.pesoEntrevistaIA}
          />
        </div>
      </section>
    </BlockCanvas>
  )
}

function Stat({ icon, label }: { readonly icon: ReactNode; readonly label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-text-muted">
      {icon}
      {label}
    </span>
  )
}

function HitoCard({
  icon,
  title,
  activo,
  peso,
}: {
  readonly icon: ReactNode
  readonly title: string
  readonly activo: boolean
  readonly peso: number
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-[var(--radius-lg)] border p-4",
        activo ? "border-success/30 bg-success/5" : "border-glass-border bg-glass-1 opacity-60",
      )}
    >
      <span
        className={cn(
          "flex size-9 items-center justify-center rounded-[var(--radius-md)]",
          activo ? "bg-success/15 text-success" : "bg-glass-2 text-text-muted",
        )}
      >
        {icon}
      </span>
      <div className="flex-1">
        <p className="font-medium text-sm text-text-primary">{title}</p>
        <p className="text-text-muted text-xs">
          {activo ? `Activo · ${peso}% del curso` : "Inactivo"}
        </p>
      </div>
    </div>
  )
}
