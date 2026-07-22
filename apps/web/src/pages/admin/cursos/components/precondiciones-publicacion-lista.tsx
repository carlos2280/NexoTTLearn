import { Banner } from "@/shared/components/ui/banner"
import { AlertTriangle } from "lucide-react"
import type { PrecondicionFallida } from "../lib/precondiciones-publicacion"

interface PrecondicionesPublicacionListaProps {
  readonly precondiciones: readonly PrecondicionFallida[]
}

/**
 * Checklist de las precondiciones D63 que impiden publicar el curso. El backend
 * ya devuelve la lista completa en el 422; aca solo la pintamos para que el
 * admin sepa exactamente que corregir (P19).
 */
export function PrecondicionesPublicacionLista({
  precondiciones,
}: PrecondicionesPublicacionListaProps) {
  return (
    <Banner tone="warning" title="Corrige esto antes de publicar:" icon={AlertTriangle}>
      <ul className="mt-1 list-disc space-y-1 pl-5">
        {precondiciones.map((p) => (
          <li key={`${p.codigo}::${p.mensaje}`}>
            {p.mensaje}
            {p.detalle ? <span className="mt-0.5 block opacity-80">{p.detalle}</span> : null}
          </li>
        ))}
      </ul>
    </Banner>
  )
}
