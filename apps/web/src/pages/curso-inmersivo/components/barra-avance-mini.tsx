import { cn } from "@/shared/lib/cn"
import { useEffect, useRef, useState } from "react"

interface BarraAvanceMiniProps {
  readonly porcentaje: number
}

/**
 * Barra de avance compacta del topbar inmersivo. Redondea a entero (un
 * `22.73%` rompe la calma editorial — ref 8). Dispara un pulse aurora-cyan
 * cuando el % aumenta — recompensa silenciosa de avance.
 */
export function BarraAvanceMini({ porcentaje }: BarraAvanceMiniProps) {
  const round = Math.max(0, Math.min(100, Math.round(porcentaje)))
  const previo = useRef(round)
  const [pulse, setPulse] = useState(false)

  useEffect(() => {
    if (round > previo.current) {
      setPulse(true)
      const timer = setTimeout(() => setPulse(false), 2000)
      previo.current = round
      return () => clearTimeout(timer)
    }
    previo.current = round
    return undefined
  }, [round])

  return (
    <div className="hidden items-center gap-3 sm:flex">
      <div aria-hidden={true} className="relative h-1.5 w-32 rounded-pill bg-subtle">
        <div className="absolute inset-0 overflow-hidden rounded-pill">
          <div
            className="h-full rounded-pill bg-accent transition-all duration-slow ease-out"
            style={{ width: `${round}%` }}
          />
        </div>
        {round > 0 ? (
          <span
            aria-hidden={true}
            className={cn(
              "-translate-y-1/2 absolute top-1/2 inline-block h-2 w-2 rounded-pill bg-aurora-cyan text-aurora-cyan",
              pulse ? "nx-pulse-dot" : "",
            )}
            style={{
              left: `calc(${round}% - 4px)`,
              boxShadow: "0 0 8px 2px rgb(var(--color-aurora-cyan-rgb) / 0.4)",
            }}
          />
        ) : null}
      </div>
      <span className="tabular w-10 text-right font-mono font-semibold text-caption text-text-primary">
        {round}%
      </span>
    </div>
  )
}
