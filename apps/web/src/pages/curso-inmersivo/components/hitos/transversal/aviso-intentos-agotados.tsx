import { Info } from "lucide-react"

/**
 * Aviso "sin intentos" del hito transversal (B1). Reemplaza el CTA de enviar
 * cuando el participante agotó su cupo. Copy honesto y cálido: el admin toma el
 * relevo, no es un "reprobado" definitivo (coherente con el manifiesto NexoTT).
 */
export function AvisoIntentosAgotados() {
  return (
    <article
      // El aviso reemplaza al CTA tras un refetch del cupo: `aria-live="polite"`
      // lo hace anunciable por lectores de pantalla sin robar el foco.
      aria-live="polite"
      className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-5"
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-text-tertiary" aria-hidden={true} />
      <p className="text-body-sm text-text-secondary">
        Sin intentos disponibles. Tu administrador revisará tu caso.
      </p>
    </article>
  )
}
