import { Button } from "@/shared/ui/primitives/button"
import type { VistaCursoSiguientePaso } from "@nexott-learn/shared-types"
import { ChevronRight, Compass } from "lucide-react"
import { Link } from "react-router-dom"

interface VistaCursoHeroCtaProps {
  readonly siguientePaso: VistaCursoSiguientePaso
}

// §4.2.6 CTA Continuar / Comenzar / Empezar transversal / Ver expediente.
// §4.2.7 (8) cuando variante=NINGUNO el bloque entero NO se renderiza.
export function VistaCursoHeroCta({ siguientePaso }: VistaCursoHeroCtaProps) {
  if (siguientePaso.variante === "NINGUNO" || siguientePaso.href === null) {
    return null
  }
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-glass-border bg-surface-1 px-4 py-3">
      <p className="flex min-w-0 items-center gap-2 text-sm text-text-secondary">
        <Compass className="size-4 shrink-0 text-brand-violet-soft" strokeWidth={1.75} />
        <span className="truncate">{siguientePaso.hint}</span>
      </p>
      <Button asChild={true} variant="primary" size="md">
        <Link to={siguientePaso.href}>
          {siguientePaso.cta}
          <ChevronRight className="size-4" strokeWidth={2} />
        </Link>
      </Button>
    </div>
  )
}
