import { ClipboardList } from "lucide-react"

/**
 * Placeholder del subtab "Otros" — reservado para los tipos de evaluacion
 * futuros (tests del curso, peer review, etc.). Comunica el roadmap al admin
 * sin ofrecer funcionalidad falsa.
 */
export function TabOtrosProximamente() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-border border-dashed bg-subtle/40 px-6 py-16 text-center">
      <ClipboardList className="h-8 w-8 text-text-tertiary" strokeWidth={1.25} aria-hidden={true} />
      <h3 className="text-h3 text-text-primary">Próximamente</h3>
      <p className="max-w-md text-body-sm text-text-secondary">
        Aquí aparecerán las evaluaciones por tests del curso y otros tipos cuando se incorporen al
        sistema.
      </p>
    </div>
  )
}
