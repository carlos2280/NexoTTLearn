import { RUTAS } from "@/shared/constants/rutas"
import type { CursoDisponibleVoluntario } from "@nexott-learn/shared-types"
import { ArrowUpRight, CalendarClock, Users } from "lucide-react"
import { useNavigate } from "react-router-dom"

interface CatalogoCardProps {
  readonly curso: CursoDisponibleVoluntario
}

const formatoFecha = new Intl.DateTimeFormat("es-ES", { day: "2-digit", month: "short" })

function formatearRangoFechas(inicio: string, deadline: string): string {
  const ini = formatoFecha.format(new Date(inicio))
  const fin = formatoFecha.format(new Date(deadline))
  return `${ini} → ${fin}`
}

/**
 * Card de curso en el catalogo de voluntariado. Es enteramente clickable y
 * navega al curso inmersivo en modo `preview` — desde alli el participante ve
 * el detalle real (modulos, secciones, bloques en lectura) y se inscribe con
 * el ConfirmDialog del footer sticky.
 *
 * No hay "Inscribirme" inline en la card por decision de UX (Capa 2): la
 * inscripcion ocurre tras explorar el preview, no a ciegas.
 */
export function CatalogoCard({ curso }: CatalogoCardProps) {
  const navigate = useNavigate()
  const codigo = curso.areaPrincipal.codigo
  const irAlPreview = () => navigate(RUTAS.participante.cursoDetalle(curso.cursoId))

  return (
    <article
      onClick={irAlPreview}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          irAlPreview()
        }
      }}
      aria-label={`Ver detalle del curso ${curso.titulo}`}
      className="group hover:-translate-y-0.5 flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-all duration-base ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
      style={{ boxShadow: "var(--shadow-card-resting)" }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `var(--shadow-glow-area-${codigo}), var(--shadow-card-elevated)`
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "var(--shadow-card-resting)"
      }}
    >
      <div
        className="relative h-24 overflow-hidden"
        style={{
          background: `linear-gradient(135deg, var(--color-area-${codigo}) 0%, rgb(var(--color-area-${codigo}-rgb) / 0.7) 60%, rgb(var(--color-area-${codigo}-rgb) / 0.4) 100%)`,
        }}
      >
        <div className="nx-grain absolute inset-0 opacity-30" />
        <span className="absolute top-3 right-3 inline-flex items-center rounded-pill bg-white/95 px-2.5 py-0.5 font-mono font-semibold text-[10px] text-text-primary uppercase tracking-wider">
          {codigo}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex flex-col gap-1.5">
          <span className="nx-eyebrow text-text-tertiary">{curso.cliente.nombre}</span>
          <h3 className="text-h3 text-text-primary leading-tight">{curso.titulo}</h3>
        </div>

        {curso.skillsDestacadas.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {curso.skillsDestacadas.slice(0, 3).map((skill) => (
              <span
                key={skill.id}
                className="inline-flex items-center rounded-pill border bg-surface px-2.5 py-1 font-medium font-mono text-[11px]"
                style={{
                  borderColor: `rgb(var(--color-area-${skill.areaCodigo}-rgb) / 0.3)`,
                  color: `var(--color-area-${skill.areaCodigo}-on-soft)`,
                }}
              >
                {skill.etiquetaVisible}
              </span>
            ))}
            {curso.skillsDestacadas.length > 3 ? (
              <span className="inline-flex items-center font-mono text-[11px] text-text-tertiary">
                +{curso.skillsDestacadas.length - 3}
              </span>
            ) : null}
          </div>
        ) : null}

        <div className="flex items-center gap-4 text-caption text-text-secondary">
          <span className="inline-flex items-center gap-1.5">
            <CalendarClock className="h-3.5 w-3.5" aria-hidden={true} />
            {formatearRangoFechas(curso.fechaInicio, curso.fechaDeadline)}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" aria-hidden={true} />
            {curso.voluntariosInscritos}
          </span>
        </div>

        <div className="mt-auto flex items-center justify-end pt-2">
          <span className="inline-flex items-center gap-1 font-mono text-[11px] text-text-tertiary transition-colors duration-base ease-default group-hover:text-text-secondary">
            Ver detalle
            <ArrowUpRight className="h-3 w-3" aria-hidden={true} />
          </span>
        </div>
      </div>
    </article>
  )
}
