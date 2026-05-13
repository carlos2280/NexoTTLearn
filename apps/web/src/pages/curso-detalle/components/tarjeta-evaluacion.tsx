import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"

interface TarjetaEvaluacionProps {
  readonly titulo: string
  readonly descripcion: string
  readonly disponible: boolean
  readonly mensajeBloqueo?: string
  readonly textoCta?: string
  readonly onAccion?: () => void
}

/**
 * Tarjeta genérica para Transversal (§5.3) y Entrevista IA. Cuando esté
 * disponible, muestra CTA y abre el flujo destino. Cuando no, explica el
 * motivo y oculta la CTA (P-08: nada bloquea, sólo informa).
 */
export function TarjetaEvaluacion({
  titulo,
  descripcion,
  disponible,
  mensajeBloqueo,
  textoCta,
  onAccion,
}: TarjetaEvaluacionProps) {
  return (
    <article className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-5">
      <header className="flex items-center justify-between gap-3">
        <h3 className="text-h3 text-text-primary">{titulo}</h3>
        <Badge tono={disponible ? "success" : "contorno"}>
          {disponible ? "Disponible" : "Bloqueado"}
        </Badge>
      </header>
      <p className="text-body-sm text-text-secondary">{descripcion}</p>
      {!disponible && mensajeBloqueo ? (
        <p className="text-caption text-text-tertiary">{mensajeBloqueo}</p>
      ) : null}
      {disponible && textoCta && onAccion ? (
        <div className="mt-1">
          <Button onClick={onAccion}>{textoCta}</Button>
        </div>
      ) : null}
    </article>
  )
}
