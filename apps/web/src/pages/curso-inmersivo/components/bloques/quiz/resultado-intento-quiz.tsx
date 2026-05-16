import { cn } from "@/shared/lib/cn"
import type { ContenidoQuiz, IntentoBloqueResponse } from "@nexott-learn/shared-types"
import { CheckCircle2, XCircle } from "lucide-react"

interface ResultadoIntentoQuizProps {
  readonly intento: IntentoBloqueResponse
  readonly notaMinima: number
}

export function ResultadoIntentoQuiz({ intento, notaMinima }: ResultadoIntentoQuizProps) {
  const aprobado = intento.nota >= notaMinima
  const Icono = aprobado ? CheckCircle2 : XCircle
  return (
    <aside
      className={cn(
        "flex items-start gap-3 rounded-2xl border p-4",
        aprobado ? "border-success/30 bg-success-soft" : "border-warmth/30 bg-warning-soft",
      )}
    >
      <Icono
        className={cn("mt-0.5 h-5 w-5 shrink-0", aprobado ? "text-success" : "text-warmth")}
        aria-hidden={true}
      />
      <div className="flex flex-col gap-1">
        <p
          className={cn("text-body-sm", aprobado ? "text-success-on-soft" : "text-warning-on-soft")}
        >
          {aprobado
            ? `Aprobado · ${intento.nota.toFixed(0)} / 100. Tu mejor intento ahora cuenta para tu nota de skill.`
            : `Intento registrado · ${intento.nota.toFixed(0)} / 100. Sigue intentando — la mejor nota gana.`}
        </p>
        {intento.esMejorIntento ? (
          <p className="font-mono text-[10px] text-text-tertiary uppercase tracking-wider">
            Nuevo mejor intento
          </p>
        ) : null}
      </div>
    </aside>
  )
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
