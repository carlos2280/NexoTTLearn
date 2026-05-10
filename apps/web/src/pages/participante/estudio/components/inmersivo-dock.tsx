import { cn } from "@/shared/lib/cn"
import { Button } from "@/shared/ui/primitives/button"
import { Tooltip } from "@/shared/ui/primitives/tooltip"
import type { ModuloInmersivoProgreso } from "@nexott-learn/shared-types"
import { ArrowLeft, ArrowRight, Check } from "lucide-react"
import type { ReactNode } from "react"

interface InmersivoDockProps {
  readonly progreso: ModuloInmersivoProgreso
  readonly tieneAnterior: boolean
  readonly tieneSiguiente: boolean
  readonly onAnterior: () => void
  readonly onSiguiente: () => void
  readonly onCompletarModulo: () => void
}

// Dock sticky inferior (README.md §7). Barra de progreso + contador + nav
// (Anterior/Siguiente) + atajo visible. Cuando estamos en el ultimo bloque,
// el CTA principal cambia a "Completar modulo" (no disabled).

export function InmersivoDock({
  progreso,
  tieneAnterior,
  tieneSiguiente,
  onAnterior,
  onSiguiente,
  onCompletarModulo,
}: InmersivoDockProps) {
  const esUltimo = !tieneSiguiente
  return (
    <footer
      className={cn(
        "sticky bottom-0 z-30 flex h-dock-inmersivo items-center gap-4 border-dock-border border-t",
        "bg-dock-glass px-6 backdrop-blur-md",
      )}
    >
      <ProgresoBarra progreso={progreso} />
      <AtajoKbd className="hidden lg:inline-flex" />
      <div className="flex items-center gap-2">
        <Tooltip content="Bloque anterior (Cmd + ←)">
          <Button
            size="sm"
            variant="ghost"
            onClick={onAnterior}
            disabled={!tieneAnterior}
            aria-label="Bloque anterior"
            aria-keyshortcuts="Meta+ArrowLeft"
          >
            <ArrowLeft className="size-4" strokeWidth={2} />
            <span className="hidden md:inline">Anterior</span>
          </Button>
        </Tooltip>
        {esUltimo ? (
          <Button
            size="sm"
            variant="primary"
            onClick={onCompletarModulo}
            aria-label="Completar modulo y volver al curso"
          >
            <Check className="size-4" strokeWidth={2.25} />
            Completar modulo
          </Button>
        ) : (
          <Tooltip content="Siguiente bloque (Cmd + →)">
            <Button
              size="sm"
              variant="primary"
              onClick={onSiguiente}
              aria-label="Siguiente bloque"
              aria-keyshortcuts="Meta+ArrowRight"
            >
              <span>Siguiente</span>
              <ArrowRight className="size-4" strokeWidth={2} />
            </Button>
          </Tooltip>
        )}
      </div>
    </footer>
  )
}

function ProgresoBarra({ progreso }: { readonly progreso: ModuloInmersivoProgreso }) {
  return (
    <div className="flex flex-1 items-center gap-3">
      <div
        role="progressbar"
        tabIndex={-1}
        aria-valuenow={progreso.porcentaje}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progreso del modulo: ${progreso.porcentaje}%`}
        className="relative h-1.5 max-w-sidebar-inmersivo flex-1 overflow-hidden rounded-full bg-glass-2"
      >
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-brand-violet to-brand-cyan transition-[width] duration-300"
          style={{ width: `${progreso.porcentaje}%` }}
        />
      </div>
      <span className="font-medium text-caption text-text-secondary tabular-nums">
        {progreso.porcentaje}%
      </span>
      <span className="text-caption text-text-muted">
        · {progreso.bloquesInteractuados}/{progreso.bloquesTotales} contenidos
      </span>
    </div>
  )
}

// `<kbd>` profesional con tokens (sustituye al "⌨ Cmd + → siguiente" plano).
function AtajoKbd({ className }: { readonly className?: string }) {
  return (
    <span
      aria-hidden={true}
      className={cn("items-center gap-1.5 text-eyebrow text-text-muted uppercase", className)}
    >
      <Kbd>⌘</Kbd>
      <Kbd>→</Kbd>
      <span className="ml-1 font-medium tracking-[var(--ls-kbd)]">Siguiente</span>
    </span>
  )
}

function Kbd({ children }: { readonly children: ReactNode }) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-sm border border-glass-border-strong bg-glass-2 px-1",
        "font-medium font-mono text-[10px] text-text-secondary",
      )}
    >
      {children}
    </kbd>
  )
}
