import { Button } from "@/shared/components/ui/button"

interface PantallaErrorProps {
  readonly titulo: string
  readonly descripcion: string
  readonly onVolver: () => void
}

/**
 * Pantalla completa de error para los casos fatales del inmersivo (sin acceso,
 * fallo al cargar). Mantiene la calma editorial: una sola jerarquía + CTA
 * único para volver al lugar conocido (bandeja).
 */
export function PantallaError({ titulo, descripcion, onVolver }: PantallaErrorProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-6">
      <article className="flex max-w-md flex-col items-center gap-3 text-center">
        <h2 className="text-h2 text-text-primary">{titulo}</h2>
        <p className="text-body text-text-secondary">{descripcion}</p>
        <div className="mt-2">
          <Button onClick={onVolver}>Volver a la bandeja</Button>
        </div>
      </article>
    </div>
  )
}
