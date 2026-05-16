import { Button } from "@/shared/components/ui/button"
import { RUTAS } from "@/shared/constants/rutas"
import { cn } from "@/shared/lib/cn"
import type { BandejaCursoPendiente, TonoDeadline } from "@nexott-learn/shared-types"
import { ArrowRight, Calendar } from "lucide-react"
import { useNavigate } from "react-router-dom"

interface BandaPendientesProps {
  readonly pendientes: readonly BandejaCursoPendiente[]
}

const TEXTO_DEADLINE: Record<TonoDeadline, string> = {
  lejos: "text-text-tertiary",
  cercano: "text-warmth",
  vencido: "text-danger",
}

const BORDE_DEADLINE: Record<TonoDeadline, string> = {
  lejos: "border-border",
  cercano: "border-warmth/30",
  vencido: "border-danger/30",
}

export function BandaPendientes({ pendientes }: BandaPendientesProps) {
  if (pendientes.length === 0) {
    return null
  }

  return (
    <section aria-labelledby="banda-pendientes-titulo" className="flex flex-col gap-4">
      <header className="flex items-baseline justify-between gap-2">
        <h2 id="banda-pendientes-titulo" className="text-h3 text-text-primary">
          Pendientes en tus cursos
        </h2>
        <span className="text-caption text-text-tertiary">
          {pendientes.length} curso{pendientes.length === 1 ? "" : "s"} activo
          {pendientes.length === 1 ? "" : "s"}
        </span>
      </header>
      <ul className="flex flex-col gap-3">
        {pendientes.map((curso) => (
          <FilaCurso key={curso.asignacionId} curso={curso} />
        ))}
      </ul>
    </section>
  )
}

interface FilaCursoProps {
  readonly curso: BandejaCursoPendiente
}

function FilaCurso({ curso }: FilaCursoProps) {
  const navigate = useNavigate()
  const esVoluntario = curso.rol === "VOLUNTARIO"

  return (
    <li
      className={cn(
        "group flex flex-col gap-4 rounded-2xl border bg-surface p-5 transition-all duration-base ease-default sm:flex-row sm:items-center sm:justify-between",
        BORDE_DEADLINE[curso.tonoDeadline],
        "hover:-translate-y-0.5",
      )}
      style={{ boxShadow: "var(--shadow-card-resting)" }}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-center gap-2">
          <p className="truncate text-body-lg text-text-primary">{curso.cursoTitulo}</p>
          {esVoluntario ? (
            <span className="rounded-pill border border-border bg-subtle px-2 py-0.5 font-mono text-[10px] text-text-tertiary uppercase tracking-wider">
              Voluntario
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <Calendar
            className={cn("h-3.5 w-3.5", TEXTO_DEADLINE[curso.tonoDeadline])}
            aria-hidden={true}
          />
          <span className={cn("text-caption", TEXTO_DEADLINE[curso.tonoDeadline])}>
            {textoDeadline(curso)}
          </span>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-4">
        <BarraAvance porcentaje={curso.porcentajeAvance} />
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate(RUTAS.participante.cursoDetalle(curso.cursoId))}
        >
          Continuar <ArrowRight className="ml-1.5 h-3.5 w-3.5" aria-hidden={true} />
        </Button>
      </div>
    </li>
  )
}

function BarraAvance({ porcentaje }: { readonly porcentaje: number }) {
  return (
    <div className="flex items-center gap-2">
      <div aria-hidden={true} className="h-1.5 w-28 overflow-hidden rounded-pill bg-subtle">
        <div
          className="h-full rounded-pill bg-accent transition-all duration-slow ease-out"
          style={{ width: `${porcentaje}%` }}
        />
      </div>
      <span className="tabular w-10 text-right font-mono font-semibold text-caption text-text-primary">
        {porcentaje}%
      </span>
    </div>
  )
}

function textoDeadline(curso: BandejaCursoPendiente): string {
  if (curso.rol === "VOLUNTARIO") {
    return "Sin deadline · ritmo libre"
  }
  if (curso.tonoDeadline === "vencido") {
    return `Deadline vencido hace ${Math.abs(curso.diasRestantes)} día${Math.abs(curso.diasRestantes) === 1 ? "" : "s"}`
  }
  if (curso.diasRestantes === 0) {
    return "Deadline hoy"
  }
  if (curso.diasRestantes === 1) {
    return "Queda 1 día para el deadline"
  }
  if (curso.tonoDeadline === "cercano") {
    return `Quedan ${curso.diasRestantes} días`
  }
  return `Deadline en ${curso.diasRestantes} días`
}
