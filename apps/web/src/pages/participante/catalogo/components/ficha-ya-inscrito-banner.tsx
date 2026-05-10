import { Button } from "@/shared/ui/primitives/button"
import { CheckCircle2 } from "lucide-react"
import { Link } from "react-router-dom"

interface FichaYaInscritoBannerProps {
  readonly vistaCursoHref: string
}

// §4 ficha-curso-libre.md · si ya esta inscrito y entra por URL directa,
// reemplazamos el CTA por este banner.
export function FichaYaInscritoBanner({ vistaCursoHref }: FichaYaInscritoBannerProps) {
  return (
    <section className="flex flex-col items-center gap-3 rounded-[20px] border border-emerald-400/30 bg-emerald-500/10 p-6 text-center md:p-8">
      <CheckCircle2 aria-hidden="true" strokeWidth={1.5} className="size-7 text-emerald-300" />
      <p className="font-semibold text-text-primary">Ya estas inscrito en este curso</p>
      <Button asChild={true} variant="secondary">
        <Link to={vistaCursoHref}>Ir a Mis Cursos</Link>
      </Button>
    </section>
  )
}
