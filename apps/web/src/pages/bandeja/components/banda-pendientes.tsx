import { Button } from "@/shared/components/ui/button"
import { RUTAS } from "@/shared/constants/rutas"
import { cn } from "@/shared/lib/cn"
import type { MeCursoResumen } from "@nexott-learn/shared-types"
import { useNavigate } from "react-router-dom"
import { type TonoDeadline, formatearDeadline } from "../lib/deadline"

interface BandaPendientesProps {
  readonly cursos: readonly MeCursoResumen[]
}

const CLASES_DEADLINE: Record<TonoDeadline, string> = {
  lejos: "text-text-tertiary",
  cercano: "text-warmth",
  vencido: "text-danger",
}

export function BandaPendientes({ cursos }: BandaPendientesProps) {
  if (cursos.length === 0) {
    return null
  }

  return (
    <section aria-labelledby="banda-pendientes-titulo" className="flex flex-col gap-3">
      <h2 id="banda-pendientes-titulo" className="text-h3 text-text-primary">
        Pendientes en tus cursos
      </h2>
      <ul className="flex flex-col gap-2">
        {cursos.map((curso) => (
          <FilaCurso key={curso.asignacionId} curso={curso} />
        ))}
      </ul>
    </section>
  )
}

interface FilaCursoProps {
  readonly curso: MeCursoResumen
}

function FilaCurso({ curso }: FilaCursoProps) {
  const navigate = useNavigate()
  const deadline = formatearDeadline(curso.fechaDeadline)
  const esVoluntario = curso.rol === "VOLUNTARIO"

  return (
    <li className="flex flex-col gap-2 rounded-md border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="truncate text-body text-text-primary">
          {curso.cursoTitulo}
          {esVoluntario ? (
            <span className="ml-2 text-caption text-text-tertiary">(voluntario)</span>
          ) : null}
        </p>
        <p className={cn("text-caption", CLASES_DEADLINE[deadline.tono])}>
          {esVoluntario && deadline.tono === "lejos"
            ? "sin deadline · ritmo libre"
            : `deadline ${deadline.textoFecha} (${deadline.textoRelativo})`}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-4">
        <BarraAvance porcentaje={curso.porcentajeAvance} />
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate(RUTAS.participante.misCursos)}
        >
          Continuar
        </Button>
      </div>
    </li>
  )
}

function BarraAvance({ porcentaje }: { readonly porcentaje: number }) {
  return (
    <div className="flex items-center gap-2">
      <div aria-hidden={true} className="h-1.5 w-24 overflow-hidden rounded-pill bg-subtle">
        <div className="h-full rounded-pill bg-accent" style={{ width: `${porcentaje}%` }} />
      </div>
      <span className="tabular w-9 text-right text-caption text-text-secondary">{porcentaje}%</span>
    </div>
  )
}
