import { Button } from "@/shared/components/ui/button"
import { RUTAS } from "@/shared/constants/rutas"
import { ArrowRight, Compass } from "lucide-react"
import { useNavigate } from "react-router-dom"

interface BandaAprenderProps {
  readonly totalCursosAbiertos: number
}

export function BandaAprender({ totalCursosAbiertos }: BandaAprenderProps) {
  const navigate = useNavigate()

  if (totalCursosAbiertos === 0) {
    return (
      <section aria-labelledby="banda-aprender-titulo" className="flex flex-col gap-3">
        <h2 id="banda-aprender-titulo" className="text-h3 text-text-primary">
          Aprender por mi cuenta
        </h2>
        <div className="flex items-start gap-3 rounded-2xl border border-border border-dashed bg-canvas p-5">
          <Compass className="mt-0.5 h-4 w-4 shrink-0 text-text-tertiary" aria-hidden={true} />
          <p className="text-body-sm text-text-secondary">
            En este momento no hay cursos abiertos a voluntariado. Te avisaremos cuando se abra
            alguno.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section aria-labelledby="banda-aprender-titulo" className="flex flex-col gap-3">
      <h2 id="banda-aprender-titulo" className="text-h3 text-text-primary">
        Aprender por mi cuenta
      </h2>
      <article
        className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 sm:flex-row sm:items-center sm:justify-between"
        style={{ boxShadow: "var(--shadow-card-resting)" }}
      >
        <div className="flex items-center gap-4">
          <span
            aria-hidden={true}
            className="grid h-10 w-10 place-items-center rounded-xl bg-accent-soft text-accent-on-soft"
          >
            <Compass className="h-5 w-5" />
          </span>
          <div className="flex flex-col">
            <p className="font-mono text-display-md text-text-primary leading-none">
              {totalCursosAbiertos}
            </p>
            <p className="text-caption text-text-tertiary">
              curso{totalCursosAbiertos === 1 ? "" : "s"} abierto
              {totalCursosAbiertos === 1 ? "" : "s"} a voluntariado
            </p>
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={() => navigate(RUTAS.participante.catalogo)}>
          Explorar catálogo <ArrowRight className="ml-1.5 h-3.5 w-3.5" aria-hidden={true} />
        </Button>
      </article>
    </section>
  )
}
