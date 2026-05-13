import { Banner } from "@/shared/components/ui/banner"
import { Button } from "@/shared/components/ui/button"

export function EstadoCargando() {
  return (
    <div className="flex flex-col gap-2 p-4">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={`skeleton-${i + 1}`} className="h-14 animate-pulse rounded-md bg-subtle" />
      ))}
    </div>
  )
}

export function EstadoVacio() {
  return (
    <div className="flex flex-col items-center gap-1 px-6 py-10 text-center">
      <p className="text-body text-text-secondary">Sin casos pendientes.</p>
      <p className="text-caption text-text-tertiary">Nada vence pronto.</p>
    </div>
  )
}

interface EstadoErrorProps {
  readonly onReintentar: () => Promise<unknown>
}

export function EstadoError({ onReintentar }: EstadoErrorProps) {
  return (
    <div className="p-4">
      <Banner tone="danger" title="No pudimos cargar el centro de revisión">
        <div className="flex flex-col gap-2">
          <span>Reintenta en un momento. Si persiste, revisa el estado del sistema.</span>
          <Button variant="ghost" size="sm" onClick={onReintentar}>
            Reintentar
          </Button>
        </div>
      </Banner>
    </div>
  )
}
