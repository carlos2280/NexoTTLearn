import { gradienteHero, iconoCurso } from "@/pages/participante/mis-cursos/components/curso-presets"
import { cn } from "@/shared/lib/cn"
import type { CatalogoFichaHero } from "@nexott-learn/shared-types"
import { motion } from "framer-motion"

interface FichaHeroProps {
  readonly hero: CatalogoFichaHero
}

const EASE_OUT: [number, number, number, number] = [0.2, 0.8, 0.2, 1]

// §1 ficha-curso-libre.md · hero gradiente 220px con icono protagonista,
// pills (area + recomendado), titulo, descripcion corta y meta-info.
export function FichaHero({ hero }: FichaHeroProps) {
  const Icono = iconoCurso(hero.icono)
  const gradient = gradienteHero(hero.gradiente)
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.48, ease: EASE_OUT }}
      className={cn(
        "relative overflow-hidden rounded-[24px] bg-gradient-to-br p-8 md:p-10",
        gradient,
      )}
      data-testid="ficha-hero"
    >
      <div className="flex flex-col gap-5 text-white">
        <div className="flex flex-wrap items-center gap-2">
          {hero.area ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-2.5 py-0.5 font-medium text-[11px] text-white uppercase tracking-[0.06em] backdrop-blur">
              {hero.area.nombre}
            </span>
          ) : null}
          {hero.esRecomendado ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200/40 bg-amber-300/20 px-2.5 py-0.5 font-semibold text-[11px] text-white uppercase tracking-[0.08em] backdrop-blur">
              Recomendado
            </span>
          ) : null}
        </div>

        <div className="flex items-start gap-5">
          <div
            aria-hidden="true"
            className="grid size-16 shrink-0 place-items-center rounded-2xl border border-white/20 bg-white/10 backdrop-blur md:size-20"
          >
            <Icono className="size-8 text-white md:size-10" strokeWidth={1.25} />
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="font-extrabold text-3xl text-white leading-tight tracking-tight md:text-4xl">
              {hero.titulo}
            </h1>
            <p className="max-w-2xl text-sm text-white/85 leading-relaxed md:text-base">
              {hero.descripcionCorta}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-[13px] text-white/85 md:text-sm">
          <span>
            {hero.totalModulos} {hero.totalModulos === 1 ? "modulo" : "modulos"}
          </span>
          {hero.duracionEstimada ? (
            <>
              <span aria-hidden="true">·</span>
              <span>{hero.duracionEstimada}</span>
            </>
          ) : null}
          <span aria-hidden="true">·</span>
          <span>{hero.instructorEmpresa}</span>
        </div>
      </div>
    </motion.section>
  )
}
