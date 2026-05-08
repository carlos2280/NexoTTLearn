import { cn } from "@/shared/lib/cn"
import { Button } from "@/shared/ui/primitives/button"
import { Tooltip } from "@/shared/ui/primitives/tooltip"
import type { ModuloInmersivoCurso, ModuloInmersivoProgreso } from "@nexott-learn/shared-types"
import { ArrowLeft } from "lucide-react"
import { Link } from "react-router-dom"

interface InmersivoMiniHeaderProps {
  readonly curso: ModuloInmersivoCurso
  readonly moduloTitulo: string
  readonly progreso: ModuloInmersivoProgreso
}

// Mini-header sticky de 40 px (README.md §4). S1 sin module switcher, sin
// deadline pill, sin menu ⚙ funcional — el icono se muestra disabled. Volver
// con `[◀]` o atajo Esc.

export function InmersivoMiniHeader({ curso, moduloTitulo, progreso }: InmersivoMiniHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-header-inmersivo items-center gap-4 border-dock-border border-b",
        "bg-dock-glass px-4 backdrop-blur-md",
      )}
    >
      <Tooltip content="Volver al curso (Esc)">
        <Button asChild={true} size="sm" variant="ghost" className="-ml-1">
          <Link to={curso.hrefVolver}>
            <ArrowLeft className="size-4" strokeWidth={1.75} />
            <span className="text-sm text-text-secondary">Volver</span>
          </Link>
        </Button>
      </Tooltip>

      <span aria-hidden={true} className="text-text-faint">
        ·
      </span>

      <nav aria-label="Ubicacion en el curso" className="flex min-w-0 items-center gap-2">
        <span className="truncate text-sm text-text-secondary">{curso.titulo}</span>
        <span aria-hidden={true} className="text-text-faint">
          /
        </span>
        <span className="truncate font-semibold text-sm text-text-primary">{moduloTitulo}</span>
      </nav>

      <div className="ml-auto flex items-center gap-3">
        <ProgresoCompacto progreso={progreso} />
      </div>
    </header>
  )
}

function ProgresoCompacto({ progreso }: { readonly progreso: ModuloInmersivoProgreso }) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative h-1.5 w-32 overflow-hidden rounded-full bg-glass-2">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-brand-violet to-brand-cyan"
          style={{ width: `${progreso.porcentaje}%` }}
        />
      </div>
      <span className="font-medium text-caption text-text-secondary tabular-nums">
        {progreso.porcentaje}%
      </span>
    </div>
  )
}
