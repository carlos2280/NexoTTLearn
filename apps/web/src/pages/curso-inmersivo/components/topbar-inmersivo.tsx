import { Button } from "@/shared/components/ui/button"
import { RUTAS } from "@/shared/constants/rutas"
import { ChevronLeft } from "lucide-react"
import { useNavigate } from "react-router-dom"

interface TopbarInmersivoProps {
  readonly cursoTitulo: string
  readonly clienteNombre: string | null
  /** `null` cuando no aplica (modo preview, sin asignacion). */
  readonly porcentajeAvance: number | null
}

/**
 * Topbar minimal del modo inmersivo. Una sola fila, baja densidad, sin
 * navegación de producto: el ParticipanteShell desaparece para que el
 * canvas respire. Único punto de salida = "volver" → bandeja.
 */
export function TopbarInmersivo({
  cursoTitulo,
  clienteNombre,
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
        {clienteNombre ? (
          <span className="truncate font-mono text-[10px] text-text-tertiary uppercase tracking-wider">
            {clienteNombre}
          </span>
        ) : null}
        <h1 className="truncate text-body-lg text-text-primary leading-tight">{cursoTitulo}</h1>
      </div>
      {porcentajeAvance !== null ? <BarraAvanceMini porcentaje={porcentajeAvance} /> : null}
    </header>
  )
}

function BarraAvanceMini({ porcentaje }: { readonly porcentaje: number }) {
  return (
    <div className="hidden items-center gap-3 sm:flex">
      <div aria-hidden={true} className="h-1.5 w-32 overflow-hidden rounded-pill bg-subtle">
        <div
          className="h-full rounded-pill bg-accent transition-all duration-slow ease-out"
          style={{ width: `${porcentaje}%` }}
        />
      </div>
      <span className="tabular w-12 text-right font-mono font-semibold text-caption text-text-primary">
        {porcentaje}%
      </span>
    </div>
  )
}
