import { Select, SelectItem } from "@/shared/components/ui/select"
import { cn } from "@/shared/lib/cn"
import { Popover, PopoverContent, PopoverPortal, PopoverTrigger } from "@radix-ui/react-popover"
import { ListFilter } from "lucide-react"
import type { ReactNode } from "react"
import type {
  FiltroAprobadoUi,
  FiltroEstadoUi,
  FiltrosEvaluacionesValor,
  OpcionEstado,
} from "./filtros-evaluaciones.types"

interface FiltrosPopoverProps {
  readonly valor: FiltrosEvaluacionesValor
  readonly opcionesEstado: readonly OpcionEstado[]
  readonly onCambio: (siguiente: FiltrosEvaluacionesValor) => void
}

const ETIQUETA_APROBADO: ReadonlyMap<FiltroAprobadoUi, string> = new Map([
  ["TODOS", "Todos"],
  ["SI", "Aprobados"],
  ["NO", "No aprobados"],
  ["PENDIENTE", "Pendiente de calificar"],
])

/**
 * Popover con los filtros secundarios (estado + resultado). El boton trigger
 * muestra cuantos filtros estan activos como badge.
 */
export function FiltrosPopover({ valor, opcionesEstado, onCambio }: FiltrosPopoverProps) {
  const activos = (valor.estado !== "TODOS" ? 1 : 0) + (valor.aprobado !== "TODOS" ? 1 : 0)
  return (
    <Popover>
      <PopoverTrigger asChild={true}>
        <button
          type="button"
          aria-label="Abrir filtros"
          className={cn(
            "inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg px-3",
            "border border-border-strong bg-surface text-body-sm text-text-secondary shadow-xs",
            "hover:border-border-emphasis hover:text-text-primary",
            "focus-visible:border-aurora-violet focus-visible:shadow-ring-aurora-soft focus-visible:outline-none",
          )}
        >
          <ListFilter className="h-4 w-4" strokeWidth={1.5} aria-hidden={true} />
          <span>Filtros</span>
          {activos > 0 ? (
            <span className="tabular font-mono text-aurora-violet text-caption">{activos}</span>
          ) : null}
        </button>
      </PopoverTrigger>
      <PopoverPortal>
        <PopoverContent
          side="bottom"
          align="start"
          sideOffset={8}
          collisionPadding={16}
          className="nx-motion-popover z-popover w-[280px] rounded-xl border border-border bg-surface p-4 shadow-overlay"
        >
          <div className="flex flex-col gap-4">
            <CampoSelect
              label="Estado"
              value={valor.estado}
              onValueChange={(v) => onCambio({ ...valor, estado: v as FiltroEstadoUi })}
              ariaLabel="Filtrar por estado"
            >
              {opcionesEstado.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.etiqueta}
                </SelectItem>
              ))}
            </CampoSelect>
            <CampoSelect
              label="Resultado"
              value={valor.aprobado}
              onValueChange={(v) => onCambio({ ...valor, aprobado: v as FiltroAprobadoUi })}
              ariaLabel="Filtrar por resultado"
            >
              <SelectItem value="TODOS">{ETIQUETA_APROBADO.get("TODOS")}</SelectItem>
              <SelectItem value="SI">{ETIQUETA_APROBADO.get("SI")}</SelectItem>
              <SelectItem value="NO">{ETIQUETA_APROBADO.get("NO")}</SelectItem>
              <SelectItem value="PENDIENTE">{ETIQUETA_APROBADO.get("PENDIENTE")}</SelectItem>
            </CampoSelect>
          </div>
        </PopoverContent>
      </PopoverPortal>
    </Popover>
  )
}

interface CampoSelectProps {
  readonly label: string
  readonly value: string
  readonly onValueChange: (v: string) => void
  readonly ariaLabel: string
  readonly children: ReactNode
}

function CampoSelect({ label, value, onValueChange, ariaLabel, children }: CampoSelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-caption text-text-tertiary">{label}</span>
      <Select compact={true} value={value} onValueChange={onValueChange} aria-label={ariaLabel}>
        {children}
      </Select>
    </div>
  )
}
