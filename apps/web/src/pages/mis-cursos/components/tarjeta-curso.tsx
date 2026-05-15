import { type TonoDeadline, formatearDeadline } from "@/features/me/lib/deadline-curso"
import { Button } from "@/shared/components/ui/button"
import { RUTAS } from "@/shared/constants/rutas"
import { cn } from "@/shared/lib/cn"
import type { MeCursoResumen } from "@nexott-learn/shared-types"
import { useNavigate } from "react-router-dom"
import { tonoEstado } from "../mis-cursos.types"

interface TarjetaCursoProps {
  readonly curso: MeCursoResumen
}

const CLASES_DEADLINE: Record<TonoDeadline, string> = {
  lejos: "text-text-tertiary",
  cercano: "text-warmth",
  vencido: "text-danger",
}

export function TarjetaCurso({ curso }: TarjetaCursoProps) {
  const navigate = useNavigate()
  const deadline = formatearDeadline(curso.fechaDeadline)
  const esVoluntario = curso.rol === "VOLUNTARIO"
  const tono = tonoEstado(curso)
  const colorEstado = `var(--color-state-${tono.slug})`

  return (
    <article
      className="group hover:-translate-y-0.5 relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-border bg-surface p-5 transition-all duration-base ease-out"
      style={{ boxShadow: "var(--shadow-card-resting)" }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "var(--shadow-card-elevated)"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "var(--shadow-card-resting)"
      }}
    >
      <span
        aria-hidden="true"
        className="absolute top-0 right-0 left-0 h-[2px]"
        style={{ background: colorEstado }}
      />

      <header className="flex flex-col gap-2">
        <h3 className="line-clamp-2 text-h3 text-text-primary">{curso.cursoTitulo}</h3>
        <ChipEstado slug={tono.slug} etiqueta={tono.etiqueta} color={colorEstado} />
      </header>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-caption text-text-tertiary">Avance</span>
          <span className="tabular font-medium font-mono text-caption text-text-secondary">
            {curso.porcentajeAvance}%
          </span>
        </div>
        <div aria-hidden={true} className="h-1 w-full overflow-hidden rounded-pill bg-subtle">
          <div
            className="h-full rounded-pill bg-accent transition-all duration-slow ease-default"
            style={{ width: `${curso.porcentajeAvance}%` }}
          />
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 pt-1">
        <span className="text-caption text-text-tertiary">
          {esVoluntario ? "Voluntario" : "Asignado"}
          <span className="text-text-disabled"> · </span>
          <span className={cn(CLASES_DEADLINE[deadline.tono])}>
            {esVoluntario && deadline.tono === "lejos"
              ? "ritmo libre"
              : `${deadline.textoFecha} · ${deadline.textoRelativo}`}
          </span>
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(RUTAS.participante.cursoDetalle(curso.cursoId))}
          aria-label={`Continuar con ${curso.cursoTitulo}`}
        >
          Continuar
        </Button>
      </div>
    </article>
  )
}

interface ChipEstadoProps {
  readonly slug: string
  readonly etiqueta: string
  readonly color: string
}

function ChipEstado({ slug, etiqueta, color }: ChipEstadoProps) {
  return (
    <span
      className="inline-flex w-fit items-center gap-1.5 rounded-pill border px-2.5 py-1 font-medium text-caption"
      style={{
        background: `var(--color-state-${slug}-soft)`,
        borderColor: `rgb(var(--color-state-${slug}-rgb) / 0.3)`,
        color: `var(--color-state-${slug}-on-soft)`,
      }}
    >
      <span className="h-1.5 w-1.5 rounded-pill" style={{ background: color }} />
      {etiqueta}
    </span>
  )
}
