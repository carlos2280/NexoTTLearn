import { gradienteHero, iconoCurso } from "@/pages/participante/mis-cursos/components/curso-presets"
import type { GradientePreset, IconoCursoPreset } from "@nexott-learn/shared-types"

interface VistaCursoHeroArtProps {
  readonly gradiente: GradientePreset
  readonly icono: IconoCursoPreset
}

// §4.2.1 zona de gradiente del hero. 240x240 cuadrado con shapes y icono.
export function VistaCursoHeroArt({ gradiente, icono }: VistaCursoHeroArtProps) {
  const Icono = iconoCurso(icono)
  return (
    <div
      className={`group/art relative size-[240px] shrink-0 overflow-hidden rounded-3xl bg-gradient-to-br ${gradienteHero(gradiente)} shadow-lg`}
    >
      <span
        aria-hidden="true"
        className="-top-16 -right-16 absolute size-56 rounded-full bg-white/12"
      />
      <span
        aria-hidden="true"
        className="-bottom-12 -left-10 absolute size-44 rounded-full bg-white/8"
      />
      <span
        aria-hidden="true"
        className="absolute top-1/3 right-1/3 size-24 rounded-full bg-white/10"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"
      />
      <div className="absolute inset-0 grid place-items-center">
        <Icono
          aria-hidden="true"
          strokeWidth={1.5}
          className="size-24 text-white drop-shadow-[0_6px_24px_rgb(0_0_0_/_0.4)] transition-transform duration-300 group-hover/art:rotate-[-3deg] group-hover/art:scale-105"
        />
      </div>
    </div>
  )
}
