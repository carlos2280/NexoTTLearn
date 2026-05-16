import { Camera } from "lucide-react"

export function AvanceFotografiaPendiente() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-border border-dashed bg-canvas px-6 py-16 text-center">
      <span
        aria-hidden={true}
        className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-subtle text-text-tertiary"
      >
        <Camera className="h-5 w-5" />
      </span>
      <div className="flex max-w-[480px] flex-col gap-1.5">
        <h2 className="text-h3 text-text-primary">Aún no hay fotografía de cierre</h2>
        <p className="text-body-sm text-text-secondary">
          La fotografía se genera automáticamente cuando cierras el curso. Mientras tanto, consulta
          el estado actual o el histórico de cambios.
        </p>
      </div>
    </div>
  )
}
