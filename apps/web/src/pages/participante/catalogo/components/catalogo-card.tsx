import { gradienteHero, iconoCurso } from "@/pages/participante/mis-cursos/components/curso-presets"
import { cn } from "@/shared/lib/cn"
import type { CatalogoVitrinaItem } from "@nexott-learn/shared-types"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"
import { Link } from "react-router-dom"

interface CatalogoCardProps {
  readonly curso: CatalogoVitrinaItem
  readonly index: number
}

const EASE_OUT: [number, number, number, number] = [0.2, 0.8, 0.2, 1]

// §2 vitrina.md · tarjeta de catalogo. Mas compacta que la de mis-cursos
// (V-05): sin barra de progreso, sin estado de modulo. Pill RECOMENDADO
// segun esRecomendado.
export function CatalogoCard({ curso, index }: CatalogoCardProps) {
  const Icono = iconoCurso(curso.icono)
  const gradient = gradienteHero(curso.gradiente)
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.36, ease: EASE_OUT, delay: 0.16 + index * 0.05 }}
    >
      <Link
        to={curso.href}
        className="group/card hover:-translate-y-[5px] relative flex h-full flex-col overflow-hidden rounded-[20px] border border-glass-border bg-surface-1 shadow-md transition-all duration-300 ease-out hover:border-glass-border-strong hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-violet/50"
      >
        <div
          className={cn(
            "relative grid h-[180px] w-full place-items-center bg-gradient-to-br",
            gradient,
            "transition-opacity duration-300 group-hover/card:opacity-90",
          )}
          aria-hidden="true"
        >
          <Icono className="size-14 text-white/95" strokeWidth={1.25} />
          {curso.esRecomendado ? (
            <span className="absolute top-3 left-3 rounded-full border border-amber-300/30 bg-amber-500/20 px-2 py-0.5 font-semibold text-[10.5px] text-amber-100 uppercase tracking-[0.08em] backdrop-blur">
              Recomendado
            </span>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col gap-3 p-5">
          {curso.area ? (
            <span
              className="inline-flex w-fit items-center gap-1.5 rounded-full border border-glass-border bg-surface-2 px-2 py-0.5 font-medium text-[10.5px] text-text-secondary uppercase tracking-[0.06em]"
              data-testid="catalogo-card-area"
            >
              <span
                aria-hidden="true"
                className="size-1.5 rounded-full"
                style={{ backgroundColor: curso.area.colorHex }}
              />
              {curso.area.nombre}
            </span>
          ) : null}

          <div className="flex flex-1 flex-col gap-1">
            <h3 className="font-bold text-[17px] text-text-primary leading-tight">
              {curso.titulo}
            </h3>
            <p className="line-clamp-2 text-[13px] text-text-secondary leading-snug">
              {curso.descripcionCorta}
            </p>
          </div>

          <div className="flex items-center justify-between border-glass-border border-t pt-3 text-[12px] text-text-muted">
            <span>
              {curso.totalModulos} {curso.totalModulos === 1 ? "modulo" : "modulos"}
              {curso.duracionEstimada ? ` · ${curso.duracionEstimada}` : ""}
            </span>
            <span className="flex items-center gap-1 font-medium text-brand-violet-soft">
              Ver curso
              <ArrowRight className="size-3.5" strokeWidth={1.75} />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
