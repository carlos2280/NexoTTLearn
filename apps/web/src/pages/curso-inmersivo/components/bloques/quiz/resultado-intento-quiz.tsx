import { cn } from "@/shared/lib/cn"
import type { ContenidoQuiz, IntentoBloqueResponse } from "@nexott-learn/shared-types"
import { CheckCircle2, RotateCcw } from "lucide-react"

interface ResultadoIntentoQuizProps {
  readonly intento: IntentoBloqueResponse
  readonly notaMinima: number
  /**
   * Mejor intento *previo* al actual. Sirve para distinguir entre "primera vez
   * que apruebas" (banner caluroso) y "ya estabas aprobado y reintentaste"
   * (banner sobrio). `null` si nunca habia intentado.
   */
  readonly mejorPrevio: IntentoBloqueResponse | null
}

export function ResultadoIntentoQuiz({
  intento,
  notaMinima,
  mejorPrevio,
}: ResultadoIntentoQuizProps) {
  const aprobado = intento.nota >= notaMinima
  const yaEstabaAprobado = (mejorPrevio?.nota ?? -1) >= notaMinima
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
  return "Aún no. Tienes intentos ilimitados — la mejor cuenta."
}

export function decidirMostrarSolucion(
  modo: ContenidoQuiz["solucionVisible"],
  haIntentado: boolean,
  aprobado: boolean,
): boolean {
  if (!haIntentado) {
    return false
  }
  if (modo === "tras_intento") {
    return true
  }
  if (modo === "al_aprobar") {
    return aprobado
  }
  return false
}
