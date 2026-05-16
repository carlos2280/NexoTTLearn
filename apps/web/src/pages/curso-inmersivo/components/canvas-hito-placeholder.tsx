import { Sparkles } from "lucide-react"

type HitoTipo = "transversal" | "entrevistaIa"

interface CanvasHitoPlaceholderProps {
  readonly hito: HitoTipo
}

const META_HITO: Record<HitoTipo, { eyebrow: string; titulo: string; descripcion: string }> = {
  transversal: {
    eyebrow: "Hito de cierre",
    titulo: "Proyecto transversal",
    descripcion:
      "El proyecto integrador que cierra el curso. Subes un repositorio y un evaluador automático mide tu trabajo en tres capas. Esta pantalla está en preparación.",
  },
  entrevistaIa: {
    eyebrow: "Hito de cierre",
    titulo: "Entrevista IA",
    descripcion:
      "Una conversación de simulacro con un evaluador IA para practicar antes de cliente real. Esta pantalla está en preparación.",
  },
}

/**
 * Canvas central temporal mientras se implementan las pantallas 05 (Proyecto
 * transversal) y 06 (Entrevista IA). El hito vive como ítem del sidebar; al
 * hacer click, el canvas adopta este placeholder sin cambiar de ruta.
 *
 * Cuando 05/06 se implementen, este placeholder se reemplaza por los canvas
 * especializados correspondientes.
 */
export function CanvasHitoPlaceholder({ hito }: CanvasHitoPlaceholderProps) {
  const meta = META_HITO[hito]
  return (
    <main className="flex flex-1 items-center justify-center overflow-y-auto bg-canvas px-6 py-10">
      <article className="flex max-w-md flex-col items-start gap-3">
        <span className="nx-eyebrow inline-flex items-center gap-2 text-aurora-violet">
          <Sparkles className="h-3.5 w-3.5" aria-hidden={true} />
          {meta.eyebrow}
        </span>
        <h2 className="text-display-md text-text-primary leading-tight">{meta.titulo}</h2>
        <p className="text-body text-text-secondary">{meta.descripcion}</p>
      </article>
    </main>
  )
}
