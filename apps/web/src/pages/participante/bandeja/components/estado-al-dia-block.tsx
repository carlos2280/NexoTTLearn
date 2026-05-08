import { ArrowRight, Sparkles } from "lucide-react"
import { CtaProximamente } from "./cta-proximamente"

// §6.5 del doc canonico — sin pendientes, al menos 1 curso EN_PROGRESO.
// Reemplaza el bloque del Stream (la card "Tu siguiente paso" se mantiene
// arriba). Dos CTAs: ver mis cursos / explorar catalogo, ambos deshabilitados
// hasta que esas pantallas existan.
export function EstadoAlDiaBlock() {
  return (
    <section className="flex justify-center py-8">
      <div className="flex max-w-[520px] flex-col items-center gap-5 text-center">
        <div className="grid size-14 place-items-center rounded-2xl border border-glass-border bg-glass-1">
          <Sparkles className="size-7 text-brand-cyan" strokeWidth={1.5} />
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="font-semibold text-2xl text-text-primary tracking-tight">¡Vas al día!</h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            No tienes pendientes urgentes. Puedes adelantar contenido o explorar nuevos cursos en el
            catálogo.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
          <CtaProximamente variant="secondary" size="md">
            Ver mis cursos
          </CtaProximamente>
          <CtaProximamente variant="primary" size="md">
            Explorar catálogo
            <ArrowRight className="size-4" strokeWidth={1.75} />
          </CtaProximamente>
        </div>
      </div>
    </section>
  )
}
