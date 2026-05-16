import { Building2 } from "lucide-react"

export interface ClienteOpcion {
  readonly id: string
  readonly nombre: string
}

interface HistoricoToolbarProps {
  readonly clientes: readonly ClienteOpcion[]
  readonly clienteId: string
  readonly onCambiarCliente: (clienteId: string) => void
}

export function HistoricoToolbar({ clientes, clienteId, onCambiarCliente }: HistoricoToolbarProps) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface px-5 py-4 shadow-[var(--shadow-card-resting)] md:flex-row md:items-center md:justify-between">
      <label className="flex items-center gap-3">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-subtle text-text-secondary">
          <Building2 className="h-[16px] w-[16px]" aria-hidden={true} />
        </span>
        <span className="flex flex-col gap-0.5">
          <span className="nx-eyebrow text-text-tertiary">Cliente</span>
          <select
            value={clienteId}
            onChange={(e) => onCambiarCliente(e.target.value)}
            disabled={clientes.length === 0}
            className="appearance-none bg-transparent pr-4 font-medium text-body text-text-primary outline-none focus-visible:underline focus-visible:decoration-2 focus-visible:decoration-aurora-violet focus-visible:underline-offset-4 disabled:cursor-not-allowed disabled:text-text-tertiary"
          >
            {clientes.length === 0 ? (
              <option value="">Sin clientes disponibles</option>
            ) : (
              clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))
            )}
          </select>
        </span>
      </label>
    </div>
  )
}
