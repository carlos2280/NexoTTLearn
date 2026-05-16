import { Button } from "@/shared/components/ui/button"
import { RUTAS } from "@/shared/constants/rutas"
import { cn } from "@/shared/lib/cn"
import type { AreaTagEmbed } from "@nexott-learn/shared-types"
import { ChevronLeft } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"

interface TopbarInmersivoProps {
  readonly cursoTitulo: string
  readonly clienteNombre: string | null
  readonly areaPrincipal: AreaTagEmbed | null
  /** `null` cuando no aplica (modo preview, sin asignacion). */
  readonly porcentajeAvance: number | null
}

/**
 * Topbar minimal del modo inmersivo. Una sola fila, baja densidad, sin
 * navegación de producto: el ParticipanteShell desaparece para que el
 * canvas respire. Único punto de salida = "volver" → bandeja.
 *
 * Eyebrow muestra `cliente · ÁREA` (área en color de su token) como firma
 * sutil del curso. La barra de avance tiene glow aurora-cyan en el extremo
 * y dispara un pulse cuando el % aumenta — recompensa silenciosa de avance.
 */
export function TopbarInmersivo({
  cursoTitulo,
  clienteNombre,
  areaPrincipal,
  porcentajeAvance,
}: TopbarInmersivoProps) {
  const navigate = useNavigate()
  return (
    <header
      className="flex items-center gap-4 border-border border-b bg-surface px-6 py-3"
      style={{ boxShadow: "var(--shadow-sm)" }}
    >
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(RUTAS.bandeja)}
        aria-label="Volver a la bandeja"
      >
        <ChevronLeft className="mr-1 h-4 w-4" aria-hidden={true} /> Volver
      </Button>
      <span aria-hidden={true} className="h-5 w-px bg-border" />
      <div className="flex min-w-0 flex-1 flex-col">
        <EyebrowContexto clienteNombre={clienteNombre} area={areaPrincipal} />
        <h1 className="truncate text-body-lg text-text-primary leading-tight">{cursoTitulo}</h1>
      </div>
      {porcentajeAvance !== null ? <BarraAvanceMini porcentaje={porcentajeAvance} /> : null}
    </header>
  )
}

interface EyebrowContextoProps {
  readonly clienteNombre: string | null
  readonly area: AreaTagEmbed | null
}

function EyebrowContexto({ clienteNombre, area }: EyebrowContextoProps) {
  if (!(clienteNombre || area)) {
    return null
  }
  return (
    <span className="flex items-center gap-1.5 truncate font-mono text-[10px] uppercase tracking-wider">
      {clienteNombre ? <span className="text-text-tertiary">{clienteNombre}</span> : null}
      {clienteNombre && area ? (
        <span aria-hidden={true} className="text-text-tertiary">
          ·
        </span>
      ) : null}
      {area ? (
        <span
          className="font-semibold"
          style={{ color: `var(--color-area-${area.codigo}-on-soft)` }}
        >
          {area.nombre}
        </span>
      ) : null}
    </span>
  )
}

function BarraAvanceMini({ porcentaje }: { readonly porcentaje: number }) {
  // Ref 8: redondeo entero — 22.73% rompe la calma editorial. Siempre entero.
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
