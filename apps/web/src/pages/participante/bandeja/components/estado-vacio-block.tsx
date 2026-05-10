import { EmptyState } from "@/shared/ui/patterns/empty-state"
import { ArrowRight, BookOpen } from "lucide-react"
import { CtaProximamente } from "./cta-proximamente"

// §6.1 del doc canonico — estado vacio (sin cursos asignados ni libres).
// Reemplaza por completo "Tu siguiente paso" + Stream. CTA primario lleva al
// catalogo (deshabilitado con tooltip "Proximamente" hasta que la ruta exista).
export function EstadoVacioBlock() {
  return (
    <section className="flex flex-1 items-center justify-center py-8">
      <EmptyState
        icon={BookOpen}
        title="Aún no tienes cursos"
        description="Tu bandeja estará vacía hasta que te asignen un curso o explores el catálogo por tu cuenta."
        action={
          <CtaProximamente variant="primary" size="md">
            Explorar catálogo
            <ArrowRight className="size-4" strokeWidth={1.75} />
          </CtaProximamente>
        }
      />
    </section>
  )
}
