import type { CursoCard } from "@nexott-learn/shared-types"
import { gradienteHero, iconoCurso } from "./curso-presets"

interface CourseCardHeroProps {
  readonly curso: CursoCard
}

// Zona de color superior de la course-card (160px). Gradiente del curso +
// 3 shapes decorativos + icono blanco con drop-shadow + cliente overlay
// (solo en COMPLETADO).
export function CourseCardHero({ curso }: CourseCardHeroProps) {
  const Icono = iconoCurso(curso.icono)
  return (
    <div
      className={`relative h-40 overflow-hidden bg-gradient-to-br ${gradienteHero(curso.gradiente)}`}
    >
      <span
        aria-hidden="true"
        className="-top-8 -right-8 absolute size-32 rounded-full bg-white/12"
      />
      <span
        aria-hidden="true"
        className="-bottom-10 -left-6 absolute size-24 rounded-full bg-white/8"
      />
      <span
        aria-hidden="true"
        className="absolute top-1/3 right-1/4 size-16 rounded-full bg-white/10"
      />

      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"
      />

      <div className="absolute inset-0 grid place-items-center">
        <Icono
          aria-hidden="true"
          strokeWidth={1.5}
          className="size-14 text-white drop-shadow-[0_4px_16px_rgb(0_0_0_/_0.35)] transition-transform duration-300 group-hover/card:rotate-[-6deg] group-hover/card:scale-110"
        />
      </div>

      {curso.cliente !== null ? (
        <span className="absolute top-3 right-3 rounded-full border border-white/30 bg-black/25 px-2.5 py-0.5 font-medium text-[10.5px] text-white/90 uppercase tracking-[0.06em] backdrop-blur-sm">
          {curso.cliente}
        </span>
      ) : null}

      {curso.recienAsignado ? (
        <span
          aria-label="Curso recien asignado"
          className="absolute top-3 left-3 size-2 rounded-full bg-danger ring-2 ring-white/40"
        />
      ) : null}
    </div>
  )
}
