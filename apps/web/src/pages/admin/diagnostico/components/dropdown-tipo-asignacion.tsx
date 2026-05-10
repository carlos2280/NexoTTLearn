import { Badge } from "@/shared/ui/patterns/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/primitives/dropdown-menu"
import type { TipoAsignacion } from "@nexott-learn/shared-types"
import { ChevronDown, Trash2 } from "lucide-react"

interface Props {
  readonly tipoActual: TipoAsignacion | undefined
  readonly onCambiar: (tipo: TipoAsignacion) => void
  readonly onQuitar: () => void
}

function etiquetaParaTipo(tipo: TipoAsignacion): string {
  switch (tipo) {
    case "OBLIGATORIO":
      return "Oblig."
    case "RECOMENDADO":
      return "Recom."
    case "OPCIONAL":
      return "Opc."
    default: {
      const _exhaustive: never = tipo
      return _exhaustive
    }
  }
}

export function DropdownTipoAsignacion({ tipoActual, onCambiar, onQuitar }: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] px-1 py-0.5 text-xs hover:bg-glass-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-violet">
        <BadgeTipo tipo={tipoActual} />
        <ChevronDown className="size-3 text-text-muted" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[10rem]">
        <DropdownMenuItem onSelect={() => onCambiar("OBLIGATORIO")}>OBLIGATORIO</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onCambiar("RECOMENDADO")}>RECOMENDADO</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onCambiar("OPCIONAL")}>OPCIONAL</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem icon={Trash2} tone="danger" onSelect={onQuitar}>
          Quitar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function BadgeTipo({ tipo }: { readonly tipo: TipoAsignacion | undefined }) {
  if (!tipo) {
    return (
      <Badge tone="neutral" size="sm">
        Sin
      </Badge>
    )
  }
  const tone = tipo === "OBLIGATORIO" ? "danger" : tipo === "RECOMENDADO" ? "warning" : "info"
  return (
    <Badge tone={tone} size="sm">
      {etiquetaParaTipo(tipo)}
    </Badge>
  )
}
