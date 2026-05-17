import { useObtenerIntentoEntrevistaIa } from "@/features/entrevista-ia/hooks/use-obtener-intento-entrevista-ia"
import type { TurnoEntrevistaIa } from "@nexott-learn/shared-types"
import { Loader2 } from "lucide-react"
import { VistaAprobadoEntrevistaIa } from "./vista-aprobado-entrevista-ia"
import { VistaAunNoEntrevistaIa } from "./vista-aun-no-entrevista-ia"

interface CierreEntrevistaProps {
  readonly intentoId: string
  readonly turnos: readonly TurnoEntrevistaIa[]
  readonly fechaISO: string
  /**
   * Devuelve al brief (lo usa la vista 3b "Hacer otra entrevista"). El
   * brief recargara la disponibilidad y decidira si mostrar "Iniciar
   * entrevista" o vista 5 bloqueada (`RATE_LIMIT_HORA`, etc.).
   */
  readonly onCerrar: () => void
}

/**
 * Orquesta la vista de cierre tras `finalizado=true`: hace `GET
 * /intentos-entrevista-ia/:id` para obtener el veredicto real del backend
 * (`aprobado`) y monta la vista 3a (aprobado) o 3b (aún no) — spec 06 F3.
 *
 * Los turnos vienen del chat (ya en memoria) para evitar un round-trip
 * adicional y un estado vacío en el drawer "Releer la entrevista".
 */
export function CierreEntrevista({ intentoId, turnos, fechaISO, onCerrar }: CierreEntrevistaProps) {
  const intento = useObtenerIntentoEntrevistaIa(intentoId)

  if (intento.isLoading || !intento.data) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2
          className="h-5 w-5 animate-spin text-text-tertiary"
          aria-label="Procesando entrevista"
        />
      </div>
    )
  }

  if (intento.data.aprobado === true) {
    return <VistaAprobadoEntrevistaIa turnos={turnos} fechaISO={fechaISO} />
  }
  return <VistaAunNoEntrevistaIa turnos={turnos} fechaISO={fechaISO} onCerrar={onCerrar} />
}
