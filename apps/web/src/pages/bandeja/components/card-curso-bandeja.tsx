import { type TonoDeadline, formatearDeadline } from "@/features/me/lib/deadline-curso"
import { Button } from "@/shared/components/ui/button"
import { RUTAS } from "@/shared/constants/rutas"
import { cn } from "@/shared/lib/cn"
import { ArrowRight } from "lucide-react"
import type { ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import type { MeCursoResumenConSkills } from "../types"

type Variante = "destacada" | "compacta"

interface CardCursoBandejaProps {
  readonly curso: MeCursoResumenConSkills
  readonly variante: Variante
}

const CLASES_DEADLINE: Record<TonoDeadline, string> = {
  lejos: "text-text-tertiary",
  cercano: "text-warmth",
  vencido: "text-danger",
}

const SHADOW_RESTING = "var(--shadow-card-resting)"
const SHADOW_ELEVATED = "var(--shadow-card-elevated)"

function glowDeArea(areaCodigo?: string | null): string {
  if (!areaCodigo) {
    return SHADOW_ELEVATED
  }
  return `var(--shadow-glow-area-${areaCodigo}, ${SHADOW_ELEVATED})`
}

function colorArea(areaCodigo?: string | null): string | undefined {
  return areaCodigo ? `var(--color-area-${areaCodigo})` : undefined
}

/**
 * Card de un curso activo en la bandeja del participante. La barra superior
 * y el glow en hover usan el color del área principal del curso — firma
 * visual sutil que comunica "de qué va el curso" sin gritar.
 *
 *  - `destacada` → única en pantalla cuando hay 1 solo curso activo. Layout
 *    horizontal generoso, capacidades pendientes visibles, eyebrow del área.
 *  - `compacta`  → grilla 2-4 / 5+ cursos. Layout vertical limpio.
 */
export function CardCursoBandeja({ curso, variante }: CardCursoBandejaProps) {
  return variante === "destacada" ? <CardDestacada curso={curso} /> : <CardCompacta curso={curso} />
}

function CardDestacada({ curso }: { readonly curso: MeCursoResumenConSkills }) {
  const navigate = useNavigate()
  const deadline = formatearDeadline(curso.fechaDeadline)
  const avance = Math.round(curso.porcentajeAvance)
  const skillsPendientes = curso.skillsPendientesCount

  return (
    <article
      className="relative flex flex-col gap-5 overflow-hidden rounded-2xl border border-border bg-surface p-7"
      style={{ boxShadow: SHADOW_RESTING }}
    >
      <BarraSuperiorArea areaCodigo={curso.areaCodigo} />
      <header className="flex flex-col gap-1.5">
        <EyebrowDestacado areaCodigo={curso.areaCodigo} areaNombre={curso.areaNombre} />
        <h3 className="text-h2 text-text-primary leading-tight">{curso.cursoTitulo}</h3>
      </header>
      <BarraAvance porcentaje={avance} />
      <dl className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
        <ItemMeta label="Deadline">
          <span className={cn("text-body-sm", CLASES_DEADLINE[deadline.tono])}>
            {deadline.textoFecha} · {deadline.textoRelativo}
          </span>
        </ItemMeta>
        {skillsPendientes !== undefined && skillsPendientes > 0 ? (
          <ItemMeta label="Por demostrar">
            <span className="text-body-sm text-text-primary">
              {skillsPendientes} {skillsPendientes === 1 ? "capacidad" : "capacidades"}
            </span>
          </ItemMeta>
        ) : null}
      </dl>
      <div className="mt-2">
        <Button onClick={() => navigate(RUTAS.participante.cursoDetalle(curso.cursoId))}>
          Continuar curso <ArrowRight className="ml-2 h-4 w-4" aria-hidden={true} />
        </Button>
      </div>
    </article>
  )
}

function CardCompacta({ curso }: { readonly curso: MeCursoResumenConSkills }) {
  const navigate = useNavigate()
  const deadline = formatearDeadline(curso.fechaDeadline)
  const avance = Math.round(curso.porcentajeAvance)
  const glowHover = glowDeArea(curso.areaCodigo)

  return (
    <article
      className="hover:-translate-y-0.5 relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-border bg-surface p-5 transition-all duration-base ease-out"
      style={{ boxShadow: SHADOW_RESTING }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = glowHover
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = SHADOW_RESTING
      }}
    >
      <BarraSuperiorArea areaCodigo={curso.areaCodigo} />
      <h3 className="line-clamp-2 text-body-lg text-text-primary leading-snug">
        {curso.cursoTitulo}
      </h3>
      <BarraAvance porcentaje={avance} />
      <div className="mt-auto flex items-center justify-between gap-3">
        <span className={cn("text-caption", CLASES_DEADLINE[deadline.tono])}>
          {deadline.textoRelativo}
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

function BarraSuperiorArea({ areaCodigo }: { readonly areaCodigo?: string | null }) {
  const bg = colorArea(areaCodigo)
  if (!bg) {
    return null
  }
  return (
    <span
      aria-hidden={true}
      className="absolute top-0 right-0 left-0 h-[2px]"
      style={{ background: bg }}
    />
  )
}

function EyebrowDestacado({
  areaCodigo,
  areaNombre,
}: { readonly areaCodigo?: string | null; readonly areaNombre?: string | null }) {
  if (areaCodigo && areaNombre) {
    return (
      <span className="nx-eyebrow" style={{ color: `var(--color-area-${areaCodigo}-on-soft)` }}>
        {areaNombre} · Curso activo
      </span>
    )
  }
  return <span className="nx-eyebrow text-text-tertiary">Curso activo</span>
}

function ItemMeta({ label, children }: { readonly label: string; readonly children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="font-mono text-[10px] text-text-tertiary uppercase tracking-wider">{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}

function BarraAvance({ porcentaje }: { readonly porcentaje: number }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-caption text-text-tertiary">Avance</span>
        <span className="tabular font-medium font-mono text-caption text-text-secondary">
          {porcentaje}%
        </span>
      </div>
      <div aria-hidden={true} className="h-1 w-full overflow-hidden rounded-pill bg-subtle">
        <div
          className="h-full rounded-pill bg-accent transition-all duration-slow ease-default"
          style={{ width: `${porcentaje}%` }}
        />
      </div>
    </div>
  )
}
