import { cn } from "@/shared/lib/cn"
import type { IntentoBloqueResponse } from "@nexott-learn/shared-types"
import { Play } from "lucide-react"

interface ResultadoIntentoProps {
  readonly intento: IntentoBloqueResponse
  readonly notaAprobado: number
}

export function ResultadoIntento({ intento, notaAprobado }: ResultadoIntentoProps) {
  const aprobado = intento.nota >= notaAprobado
  return (
    <aside
      className={cn(
        "flex items-start gap-3 rounded-2xl border p-4",
        aprobado ? "border-success/30 bg-success-soft" : "border-warmth/30 bg-warning-soft",
      )}
    >
      <Play
        className={cn("mt-0.5 h-5 w-5 shrink-0", aprobado ? "text-success" : "text-warmth")}
        aria-hidden={true}
      />
      <div className="flex flex-col gap-1">
        <p
          className={cn("text-body-sm", aprobado ? "text-success-on-soft" : "text-warning-on-soft")}
        >
          {aprobado
            ? `Pasaron suficientes tests · ${intento.nota.toFixed(0)} / 100.`
            : `Algunos tests fallaron · ${intento.nota.toFixed(0)} / 100. Revisa la salida y vuelve a intentarlo.`}
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
