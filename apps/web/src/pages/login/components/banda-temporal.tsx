import { cn } from "@/shared/lib/cn"
import { Clock } from "lucide-react"
import { useEffect, useState } from "react"

interface BandaTemporalProps {
  readonly expiraEn: Date
  readonly etiqueta?: string
  readonly onExpirar?: () => void
}

function formatearTiempo(ms: number): string {
  if (ms <= 0) {
    return "0:00"
  }
  const totalSegundos = Math.floor(ms / 1000)
  const minutos = Math.floor(totalSegundos / 60)
  const segundos = totalSegundos % 60
  return `${minutos}:${segundos.toString().padStart(2, "0")}`
}

export function BandaTemporal(props: BandaTemporalProps) {
  const { expiraEn, etiqueta = "Vence en", onExpirar } = props
  const [restanteMs, setRestanteMs] = useState<number>(Math.max(0, expiraEn.getTime() - Date.now()))

  useEffect(() => {
    const tick = (): void => {
      const restante = Math.max(0, expiraEn.getTime() - Date.now())
      setRestanteMs(restante)
      if (restante <= 0 && onExpirar) {
        onExpirar()
      }
    }
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [expiraEn, onExpirar])

  const expirada = restanteMs <= 0
  const enWarning = restanteMs > 0 && restanteMs <= 60_000

  return (
    <div
      className={cn(
        "flex items-center gap-2 text-caption",
        expirada ? "text-danger" : enWarning ? "text-warning" : "text-text-tertiary",
      )}
      aria-live="polite"
    >
      <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {expirada ? (
        <span>El tiempo expiró. Vuelve a iniciar sesión.</span>
      ) : (
        <span>
          {etiqueta} <span className="tabular font-medium">{formatearTiempo(restanteMs)}</span>
        </span>
      )}
    </div>
  )
}
