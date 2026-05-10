import { Button } from "@/shared/ui/primitives/button"
import type { CeldaActualEntregaReciente } from "@nexott-learn/shared-types"
import { FileCheck2, Pencil } from "lucide-react"
import type { TipoEntregaAjustar } from "./modal-ajustar-entrega"

export interface EntregaAjustable {
  readonly id: string
  readonly tipo: TipoEntregaAjustar
  readonly nota: number | null
}

interface FilaEntregaRecienteProps {
  readonly entrega: CeldaActualEntregaReciente
  readonly onAjustar: (e: EntregaAjustable) => void
}

export function FilaEntregaReciente({ entrega, onAjustar }: FilaEntregaRecienteProps) {
  const tipo = tipoDeEntrega(entrega)

  return (
    <li className="flex items-center justify-between gap-3 rounded-[var(--radius-md)] border border-glass-border bg-glass-1 px-3 py-2 text-sm">
      <span className="flex items-center gap-2 text-text-secondary">
        <FileCheck2 className="size-4" strokeWidth={1.5} aria-hidden="true" />
        {new Date(entrega.enviadaAt).toLocaleDateString("es-CL")}
      </span>
      <span className="flex items-center gap-2">
        <span className="font-semibold tabular-nums">
          {entrega.nota === null ? "—" : Math.round(entrega.nota)}
        </span>
        {tipo ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAjustar({ id: entrega.id, tipo, nota: entrega.nota })}
            aria-label="Ajustar nota"
          >
            <Pencil className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
          </Button>
        ) : null}
      </span>
    </li>
  )
}

function tipoDeEntrega(e: CeldaActualEntregaReciente): TipoEntregaAjustar | null {
  if (e.bloqueId) {
    return "bloque"
  }
  if (e.miniProyectoId) {
    return "proyecto"
  }
  return null
}
