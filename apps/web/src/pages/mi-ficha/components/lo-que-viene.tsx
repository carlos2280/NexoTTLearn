import { useMisCursos } from "@/features/me/hooks/use-mis-cursos"
import { RUTAS } from "@/shared/constants/rutas"
import { slugArea } from "@/shared/lib/slug-area"
import type { MeCursoResumen } from "@nexott-learn/shared-types"
import { ArrowUpRight } from "lucide-react"
import { Link } from "react-router-dom"

/**
 * "Lo que viene" — bloque forward-looking de /mi-ficha. Muestra los cursos
 * activos del colaborador (no cerrados) como entradas de lectura con link al
 * canvas inmersivo. Cada fila usa el color del area como acento lateral para
 * atar visualmente con "Donde estas hoy". Si no hay cursos en marcha, el
 * bloque no se renderiza — la ficha no inventa contenido.
 */
export function LoQueViene() {
  const { data, isLoading, error } = useMisCursos({ estado: "ACTIVO" })
  if (isLoading || error || !data) {
    return null
  }
  const enMarcha = data.data.filter(esCursoEnMarcha)
  if (enMarcha.length === 0) {
    return null
  }

  return (
    <section className="flex flex-col gap-5" aria-labelledby="lo-que-viene-titulo">
      <header className="flex flex-col gap-1.5">
        <span className="nx-eyebrow text-text-tertiary">Lo que viene</span>
        <h2 id="lo-que-viene-titulo" className="text-h2 text-text-primary">
          Tus pasos siguientes
        </h2>
      </header>

      <ul className="flex flex-col gap-2">
        {enMarcha.map((curso) => (
          <li key={curso.asignacionId}>
            <FilaCurso curso={curso} />
          </li>
        ))}
      </ul>
    </section>
  )
}

interface FilaCursoProps {
  readonly curso: MeCursoResumen
}

function FilaCurso({ curso }: FilaCursoProps) {
  const colorArea = curso.areaNombre
    ? `var(--color-area-${slugArea(curso.areaNombre)})`
    : "var(--color-border-strong)"

  return (
    <Link
      to={RUTAS.participante.cursoDetalle(curso.cursoId)}
      className="group grid grid-cols-[3px_1fr_auto_auto] items-center gap-4 rounded-xl border border-border bg-surface px-5 py-4 transition-colors duration-base ease-default hover:bg-subtle"
    >
      <span
        aria-hidden="true"
        className="h-8 w-[3px] rounded-pill"
        style={{ background: colorArea }}
      />
      <div className="flex min-w-0 flex-col gap-0.5">
        {curso.areaNombre ? (
          <span className="nx-eyebrow text-text-tertiary">{curso.areaNombre}</span>
        ) : null}
        <span className="font-medium text-body text-text-primary">{curso.cursoTitulo}</span>
        <span className="text-caption text-text-tertiary">{microcopyEstado(curso)}</span>
      </div>
      <span className="tabular text-body-sm text-text-secondary">{curso.porcentajeAvance}%</span>
      <ArrowUpRight
        className="h-4 w-4 text-text-tertiary transition-colors duration-base ease-default group-hover:text-text-secondary"
        aria-hidden="true"
      />
    </Link>
  )
}

function esCursoEnMarcha(c: MeCursoResumen): boolean {
  if (c.rol === "ASIGNADO") {
    return (
      c.estadoAsignado === "ASIGNADO" ||
      c.estadoAsignado === "EN_PROGRESO" ||
      c.estadoAsignado === "LISTO"
    )
  }
  return (
    c.estadoVoluntario === "INSCRITO" ||
    c.estadoVoluntario === "EN_PROGRESO" ||
    c.estadoVoluntario === "LISTO"
  )
}

function microcopyEstado(c: MeCursoResumen): string {
  const estado = c.rol === "ASIGNADO" ? c.estadoAsignado : c.estadoVoluntario
  if (estado === "LISTO") {
    return "Listo · esperando cierre"
  }
  if (estado === "ASIGNADO" || estado === "INSCRITO") {
    return "Aun no has empezado"
  }
  const pendientes = c.skillsPendientesCount
  if (pendientes === 0) {
    return "Todas las skills demostradas"
  }
  const label = pendientes === 1 ? "1 skill por demostrar" : `${pendientes} skills por demostrar`
  return label
}
