import type { CursoCard } from "@nexott-learn/shared-types"
import { motion } from "framer-motion"
import { CheckCircle2, CircleDashed, Compass } from "lucide-react"
import { Link } from "react-router-dom"
import { CourseCardHero } from "./course-card-hero"
import { CourseCardProgress } from "./course-card-progress"
import { labelNivel, statusTexto } from "./curso-presets"

interface CourseCardComponentProps {
  readonly curso: CursoCard
  readonly index: number
}

const EASE_OUT: [number, number, number, number] = [0.2, 0.8, 0.2, 1]

// §4.5 anatomia completa. Hero (color) + body (badges, titulo, descripcion,
// progress, hint). Click en toda la card. Glow espectral inferior en hover
// (permanente si recienCompletado §6.6).
export function CourseCardComponent({ curso, index }: CourseCardComponentProps) {
  const HintIcon = iconoHint(curso.hint.tipo)
  const status = statusTexto(curso.estado)
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.36, ease: EASE_OUT, delay: 0.18 + index * 0.06 }}
      className="group relative"
    >
      <Link
        to={curso.href}
        className="group/card hover:-translate-y-[5px] relative flex flex-col overflow-hidden rounded-[20px] border border-glass-border bg-surface-1 shadow-md transition-all duration-300 ease-out hover:border-glass-border-strong hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-violet/50"
      >
        <CourseCardHero curso={curso} />

        <div className="flex flex-col gap-3 p-5">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-glass-border bg-surface-2 px-2 py-0.5 font-medium text-[10.5px] text-text-secondary uppercase tracking-[0.06em]">
              <span className="size-1.5 rounded-full bg-brand-violet-soft" />
              {labelNivel(curso.nivel)}
            </span>
            <span className="rounded-full border border-glass-border bg-surface-2 px-2 py-0.5 font-medium text-[10.5px] text-text-muted">
              {curso.cantidadModulos} mod
            </span>
            <span
              className={
                curso.tipoInscripcion === "SOLICITUD"
                  ? "rounded-full border border-brand-violet/25 bg-brand-violet/10 px-2 py-0.5 font-medium text-[10.5px] text-brand-violet-soft"
                  : "rounded-full border border-brand-cyan/30 bg-brand-cyan/10 px-2 py-0.5 font-medium text-[10.5px] text-brand-cyan"
              }
            >
              {curso.tipoInscripcion === "SOLICITUD" ? "Asignado" : "Libre"}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <h3 className="font-bold text-[17px] text-text-primary leading-tight">
              {curso.titulo}
            </h3>
            <p className="line-clamp-2 text-[13px] text-text-secondary leading-snug">
              {curso.descripcionCorta}
            </p>
          </div>

          <CourseCardProgress estado={curso.estado} />
          <p className="font-medium text-[12px] text-text-secondary">{status}</p>

          <p className="flex items-center gap-1.5 border-glass-border border-t pt-3 text-[12.5px] text-text-muted">
            <HintIcon className="size-3.5 shrink-0" strokeWidth={1.75} />
            <span className="truncate">{curso.hint.texto}</span>
          </p>
        </div>
      </Link>

      <span
        aria-hidden="true"
        className={
          curso.recienCompletado
            ? "-z-10 pointer-events-none absolute inset-x-8 bottom-0 h-12 rounded-full bg-[image:var(--gradient-spectral-soft)] opacity-70 blur-2xl"
            : "-z-10 pointer-events-none absolute inset-x-8 bottom-0 h-12 rounded-full bg-[image:var(--gradient-spectral-soft)] opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-90"
        }
      />
    </motion.div>
  )
}

function iconoHint(tipo: CursoCard["hint"]["tipo"]) {
  switch (tipo) {
    case "COMENZAR_POR":
    case "SIGUIENTE":
      return Compass
    case "NOTA_FINAL":
      return CheckCircle2
    case "ABANDONADO":
    case "CERRADO":
      return CircleDashed
    default: {
      const _exhaustive: never = tipo
      return _exhaustive
    }
  }
}
