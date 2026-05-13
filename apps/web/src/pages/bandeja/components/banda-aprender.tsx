import { Button } from "@/shared/components/ui/button"
import { RUTAS } from "@/shared/constants/rutas"
import { ArrowRight } from "lucide-react"
import { useNavigate } from "react-router-dom"

interface BandaAprenderProps {
  readonly totalCursosAbiertos: number
}

export function BandaAprender({ totalCursosAbiertos }: BandaAprenderProps) {
  const navigate = useNavigate()

  return (
    <section aria-labelledby="banda-aprender-titulo" className="flex flex-col gap-3">
      <h2 id="banda-aprender-titulo" className="text-h3 text-text-primary">
        Aprender por mi cuenta
      </h2>
      {totalCursosAbiertos > 0 ? (
        <div className="flex flex-col gap-3 rounded-md border border-border bg-surface p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-body text-text-secondary">
            {totalCursosAbiertos} cursos abiertos a voluntariado
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate(RUTAS.participante.catalogo)}
          >
            Explorar catálogo <ArrowRight className="ml-2 h-3.5 w-3.5" aria-hidden={true} />
          </Button>
        </div>
      ) : (
        <p className="text-body-sm text-text-tertiary">
          En este momento no hay cursos abiertos a voluntariado. Te avisaremos cuando se abra
          alguno.
        </p>
      )}
    </section>
  )
}
