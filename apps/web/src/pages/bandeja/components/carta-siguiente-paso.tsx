import { Button } from "@/shared/components/ui/button"
import { cn } from "@/shared/lib/cn"
import { ArrowRight } from "lucide-react"
import type { CSSProperties } from "react"
import { useNavigate } from "react-router-dom"
import type { CopySiguiente } from "../types"

interface CartaSiguientePasoProps {
  readonly copy: CopySiguiente
}

/**
 * Carta unificada del siguiente paso. La atmósfera modula fondo y borde de
 * la card; el área del curso destino (si la hay) añade barra superior 2px
 * + eyebrow `ÁREA · CURSO` en tinta del área. Sutil pero ancla la firma.
 */
export function CartaSiguientePaso({ copy }: CartaSiguientePasoProps) {
  const navigate = useNavigate()
  const variantesCarta = VARIANTES_POR_ATMOSFERA[copy.atmosfera]
  const Icono = copy.icono
  return (
    <article
      className={cn(
        "relative flex flex-col gap-4 overflow-hidden rounded-2xl p-7",
        variantesCarta.className,
      )}
      style={variantesCarta.style}
    >
      {copy.atmosfera === "aurora" ? <HaloAurora /> : null}
      {copy.atmosfera === "urgencia" ? (
        <span aria-hidden={true} className="absolute inset-y-0 left-0 w-1 bg-warmth" />
      ) : null}
      <BarraSuperiorArea areaCodigo={copy.areaCodigo} atmosfera={copy.atmosfera} />
      <div className="relative flex flex-col gap-4">
        <Eyebrow copy={copy} eyebrowColorBase={variantesCarta.eyebrowColor} icono={Icono} />
        <h2 className={cn("text-text-primary leading-tight", variantesCarta.tituloSize)}>
          {copy.titulo}
        </h2>
        <p className="max-w-prose text-body text-text-secondary">{copy.descripcion}</p>
        <div className="mt-2 flex items-center gap-3">
          <Button variant={copy.ctaVariant} onClick={() => navigate(copy.ruta)}>
            {copy.cta} <ArrowRight className="ml-2 h-4 w-4" aria-hidden={true} />
          </Button>
          <span className="text-caption text-text-tertiary">{copy.porQueAqui}</span>
        </div>
      </div>
    </article>
  )
}

interface EyebrowProps {
  readonly copy: CopySiguiente
  readonly eyebrowColorBase: string
  readonly icono: CopySiguiente["icono"]
}

function Eyebrow({ copy, eyebrowColorBase, icono: Icono }: EyebrowProps) {
  // Si tenemos área del curso, eyebrow enriquecido `ÁREA · TITULO` en color
  // del área (sustituye al genérico). Solo en atmósferas neutras (rutina /
  // calmada) — aurora y urgencia mantienen su eyebrow propio.
  const usarEyebrowArea =
    copy.areaCodigo &&
    copy.areaNombre &&
    (copy.atmosfera === "rutina" || copy.atmosfera === "calmada")
  if (usarEyebrowArea) {
    return (
      <div className="flex items-center gap-2">
        <Icono
          className="h-4 w-4"
          style={{ color: `var(--color-area-${copy.areaCodigo}-on-soft)` }}
          aria-hidden={true}
        />
        <span
          className="nx-eyebrow"
          style={{ color: `var(--color-area-${copy.areaCodigo}-on-soft)` }}
        >
          {copy.areaNombre} · {copy.eyebrow}
        </span>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-2">
      <Icono className={cn("h-4 w-4", eyebrowColorBase)} aria-hidden={true} />
      <span className={cn("nx-eyebrow", eyebrowColorBase)}>{copy.eyebrow}</span>
    </div>
  )
}

function BarraSuperiorArea({
  areaCodigo,
  atmosfera,
}: { readonly areaCodigo?: string | null; readonly atmosfera: CopySiguiente["atmosfera"] }) {
  // No pintar barra cuando la atmósfera ya tiene firma visual fuerte: aurora
  // (halo) o urgencia (banda lateral warmth). Pintar solo en rutina/calmada.
  if (!areaCodigo || atmosfera === "aurora" || atmosfera === "urgencia") {
    return null
  }
  return (
    <span
      aria-hidden={true}
      className="absolute top-0 right-0 left-0 h-[2px]"
      style={{ background: `var(--color-area-${areaCodigo})` }}
    />
  )
}

interface VariantesCarta {
  readonly className: string
  readonly style?: CSSProperties
  readonly eyebrowColor: string
  readonly tituloSize: string
}

const VARIANTES_POR_ATMOSFERA: Record<CopySiguiente["atmosfera"], VariantesCarta> = {
  aurora: {
    className: "border border-accent/20",
    style: {
      background: "var(--gradient-card-acento)",
      boxShadow: "var(--shadow-card-elevated)",
    },
    eyebrowColor: "text-aurora-violet",
    tituloSize: "text-display-md",
  },
  urgencia: {
    className: "border border-warmth/40 bg-surface",
    style: { boxShadow: "var(--shadow-card-elevated)" },
    eyebrowColor: "text-warmth",
    tituloSize: "text-h1",
  },
  rutina: {
    className: "border border-border bg-surface",
    style: { boxShadow: "var(--shadow-card-resting)" },
    eyebrowColor: "text-text-tertiary",
    tituloSize: "text-h1",
  },
  calmada: {
    className: "border border-border border-dashed bg-canvas",
    eyebrowColor: "text-text-tertiary",
    tituloSize: "text-h2",
  },
}

function HaloAurora() {
  return (
    <div
      aria-hidden={true}
      className="-top-24 -right-24 pointer-events-none absolute h-56 w-56 rounded-full opacity-40 blur-3xl"
      style={{ background: "var(--gradient-aurora-soft)" }}
    />
  )
}
