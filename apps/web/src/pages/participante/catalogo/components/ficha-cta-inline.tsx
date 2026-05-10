import { Button } from "@/shared/ui/primitives/button"

interface FichaCtaInlineProps {
  readonly onInscribirse: () => void
  readonly cargando: boolean
}

// §2.4 ficha-curso-libre.md · CTA inline antes del fold + nota explicativa.
// Sin modal de confirmacion (F-02 doc), inscripcion directa.
export function FichaCtaInline({ onInscribirse, cargando }: FichaCtaInlineProps) {
  return (
    <section className="flex flex-col items-center gap-3 rounded-[20px] border border-glass-border bg-surface-1 p-6 text-center md:p-8">
      <Button onClick={onInscribirse} loading={cargando} variant="primary" size="lg">
        Inscribirme gratis
      </Button>
      <p className="max-w-md text-[12.5px] text-text-muted leading-relaxed">
        Al inscribirte este curso aparecera en tu seccion Mis Cursos. Puedes abandonarlo en
        cualquier momento desde alli.
      </p>
    </section>
  )
}
