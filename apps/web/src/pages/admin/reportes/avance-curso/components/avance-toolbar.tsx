import { cn } from "@/shared/lib/cn"
import { Briefcase } from "lucide-react"
import type { CursoOpcion, VistaAvance } from "../avance-curso.types"

interface AvanceToolbarProps {
  readonly cursos: readonly CursoOpcion[]
  readonly cursoId: string
  readonly vista: VistaAvance
  readonly onCambiarCurso: (cursoId: string) => void
  readonly onCambiarVista: (vista: VistaAvance) => void
}

const VISTAS: ReadonlyArray<{ readonly id: VistaAvance; readonly etiqueta: string }> = [
  { id: "ACTUAL", etiqueta: "Estado actual" },
  { id: "FOTOGRAFIA_CIERRE", etiqueta: "Fotografía cierre" },
  { id: "HISTORICO", etiqueta: "Histórico" },
]

export function AvanceToolbar({
  cursos,
  cursoId,
  vista,
  onCambiarCurso,
  onCambiarVista,
}: AvanceToolbarProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface px-5 py-4 shadow-[var(--shadow-card-resting)] md:flex-row md:items-center md:justify-between">
      <SelectorCurso cursos={cursos} cursoId={cursoId} onCambiar={onCambiarCurso} />
      <TabsVista vista={vista} onCambiar={onCambiarVista} />
    </div>
  )
}

interface SelectorCursoProps {
  readonly cursos: readonly CursoOpcion[]
  readonly cursoId: string
  readonly onCambiar: (cursoId: string) => void
}

function SelectorCurso({ cursos, cursoId, onCambiar }: SelectorCursoProps) {
  return (
    <label className="flex items-center gap-3">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-subtle text-text-secondary">
        <Briefcase className="h-[16px] w-[16px]" aria-hidden={true} />
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="nx-eyebrow text-text-tertiary">Curso</span>
        <select
          value={cursoId}
          onChange={(e) => onCambiar(e.target.value)}
          disabled={cursos.length === 0}
          className="appearance-none bg-transparent pr-4 font-medium text-body text-text-primary outline-none focus-visible:underline focus-visible:decoration-2 focus-visible:decoration-aurora-violet focus-visible:underline-offset-4 disabled:cursor-not-allowed disabled:text-text-tertiary"
        >
          {cursos.length === 0 ? (
            <option value="">Sin cursos disponibles</option>
          ) : (
            cursos.map((c) => (
              <option key={c.id} value={c.id}>
                {c.titulo}
              </option>
            ))
          )}
        </select>
      </span>
    </label>
  )
}

interface TabsVistaProps {
  readonly vista: VistaAvance
  readonly onCambiar: (vista: VistaAvance) => void
}

function TabsVista({ vista, onCambiar }: TabsVistaProps) {
  return (
    <div
      role="tablist"
      aria-label="Vista del reporte"
      className="inline-flex items-center gap-1 rounded-pill border border-border bg-subtle p-1"
    >
      {VISTAS.map((v) => {
        const activo = v.id === vista
        return (
          <button
            key={v.id}
            type="button"
            role="tab"
            aria-selected={activo}
            onClick={() => onCambiar(v.id)}
            className={cn(
              "cursor-pointer rounded-pill px-3 py-1.5 text-caption transition-all duration-base ease-default",
              "focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2",
              activo
                ? "bg-surface font-medium text-text-primary shadow-[var(--shadow-card-resting)]"
                : "text-text-secondary hover:text-text-primary",
            )}
          >
            {v.etiqueta}
          </button>
        )
      })}
    </div>
  )
}
