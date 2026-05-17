import { cn } from "@/shared/lib/cn"
import type { IntentoBloqueResponse } from "@nexott-learn/shared-types"
import { CheckCircle2, RotateCcw } from "lucide-react"

interface ResultadoIntentoProps {
  readonly intento: IntentoBloqueResponse
  readonly notaAprobado: number
  /**
   * Mejor intento *previo* al actual (antes de enviar). Permite distinguir
   * primera aprobacion de un re-envio cuando ya estabas aprobado.
   */
  readonly mejorPrevio: IntentoBloqueResponse | null
}

export function ResultadoIntento({ intento, notaAprobado, mejorPrevio }: ResultadoIntentoProps) {
  const aprobado = intento.nota >= notaAprobado
  const yaEstabaAprobado = (mejorPrevio?.nota ?? -1) >= notaAprobado
  const primeraVez = aprobado && !yaEstabaAprobado

  const Icono = aprobado ? CheckCircle2 : RotateCcw
  const mensaje = construirMensaje({ aprobado, primeraVez })

  return (
    <aside
      className={cn(
        "flex items-start gap-3 rounded-2xl border p-4",
        aprobado ? "border-success/30 bg-success-soft" : "border-warmth/30 bg-warning-soft",
        primeraVez && "nx-aurora-pulse",
      )}
    >
      <Icono
        className={cn("mt-0.5 h-5 w-5 shrink-0", aprobado ? "text-success" : "text-warmth")}
        aria-hidden={true}
      />
      <p className={cn("text-body-sm", aprobado ? "text-success-on-soft" : "text-warning-on-soft")}>
        {mensaje}
      </p>
    </aside>
  )
}

function construirMensaje(args: { aprobado: boolean; primeraVez: boolean }): string {
  if (args.primeraVez) {
    return "Lo lograste. Acabas de demostrar capacidad nueva."
  }
  if (args.aprobado) {
    return "Aprobado. Tu mejor intento sigue contando."
  }
  return "Aún no. Revisa los tests que fallaron y vuelve a intentarlo — la mejor cuenta."
}
