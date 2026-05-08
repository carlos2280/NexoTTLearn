import { Button } from "@/shared/ui/primitives/button"
import type { BandejaSiguientePaso } from "@nexott-learn/shared-types"
import { ArrowRight, GraduationCap } from "lucide-react"
import { Link } from "react-router-dom"

interface EstadoAsignadoBlockProps {
  readonly siguientePaso: BandejaSiguientePaso | null
}

// §6.2 del doc canonico — primer aterrizaje en un curso recien asignado.
// Reemplaza la card "Tu siguiente paso" por una invitacion calurosa.
// El stream de pendientes (modulos OBLIGATORIOS) se sigue mostrando debajo.
export function EstadoAsignadoBlock({ siguientePaso }: EstadoAsignadoBlockProps) {
  const titulo = tituloCurso(siguientePaso)
  const href = siguientePaso?.href ?? null

  return (
    <section className="flex justify-center py-6">
      <div className="flex max-w-[520px] flex-col items-center gap-5 text-center">
        <div className="grid size-16 place-items-center rounded-2xl border border-glass-border bg-glass-1">
          <GraduationCap className="size-8 text-brand-violet" strokeWidth={1.5} />
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="font-semibold text-2xl text-text-primary tracking-tight">
            Tienes un curso nuevo
          </h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            Te asignaron {titulo}. Empieza cuando quieras — tu progreso se guardará automáticamente.
          </p>
        </div>

        {href ? (
          <Button asChild={true} variant="primary" size="md">
            <Link to={href}>
              Comenzar curso
              <ArrowRight className="size-4" strokeWidth={1.75} />
            </Link>
          </Button>
        ) : null}
      </div>
    </section>
  )
}

function tituloCurso(paso: BandejaSiguientePaso | null): string {
  if (!paso) {
    return "un curso nuevo"
  }
  if (paso.variante === "MODULO") {
    return `"${paso.contexto}"`
  }
  return `"${paso.titulo}"`
}
