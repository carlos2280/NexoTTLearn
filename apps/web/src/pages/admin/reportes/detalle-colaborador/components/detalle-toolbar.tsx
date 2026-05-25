import { Briefcase, User } from "lucide-react"

export interface CursoOpcion {
  readonly id: string
  readonly titulo: string
}

export interface ColaboradorOpcion {
  readonly id: string
  readonly nombre: string
  readonly email: string
}

interface DetalleToolbarProps {
  readonly cursos: readonly CursoOpcion[]
  readonly colaboradores: readonly ColaboradorOpcion[]
  readonly cursoId: string
  readonly colaboradorId: string
  readonly cargandoColaboradores: boolean
  readonly onCambiarCurso: (cursoId: string) => void
  readonly onCambiarColaborador: (colaboradorId: string) => void
}

export function DetalleToolbar({
  cursos,
  colaboradores,
  cursoId,
  colaboradorId,
  cargandoColaboradores,
  onCambiarCurso,
  onCambiarColaborador,
}: DetalleToolbarProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface px-5 py-4 shadow-[var(--shadow-card-resting)] md:flex-row md:items-center md:gap-8">
      <label className="flex items-center gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-subtle text-text-secondary">
          <Briefcase className="h-[16px] w-[16px]" aria-hidden={true} />
        </span>
        <span className="flex flex-col gap-0.5">
          <span className="nx-eyebrow text-text-tertiary">Curso</span>
          <select
            value={cursoId}
            onChange={(e) => onCambiarCurso(e.target.value)}
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

      <span aria-hidden={true} className="hidden h-9 w-px bg-border md:block" />

      <label className="flex items-center gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-subtle text-text-secondary">
          <User className="h-[16px] w-[16px]" aria-hidden={true} />
        </span>
        <span className="flex flex-col gap-0.5">
          <span className="nx-eyebrow text-text-tertiary">Colaborador</span>
          <select
            value={colaboradorId}
            onChange={(e) => onCambiarColaborador(e.target.value)}
            disabled={colaboradores.length === 0 || cargandoColaboradores}
            className="appearance-none bg-transparent pr-4 font-medium text-body text-text-primary outline-none focus-visible:underline focus-visible:decoration-2 focus-visible:decoration-aurora-violet focus-visible:underline-offset-4 disabled:cursor-not-allowed disabled:text-text-tertiary"
          >
            {cargandoColaboradores ? (
              <option value="">Cargando…</option>
            ) : colaboradores.length === 0 ? (
              <option value="">Sin colaboradores en este curso</option>
            ) : (
              colaboradores.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))
            )}
          </select>
        </span>
      </label>
    </div>
  )
}
