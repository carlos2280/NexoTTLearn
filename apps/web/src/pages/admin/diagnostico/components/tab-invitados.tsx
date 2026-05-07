import { EmptyState } from "@/shared/ui/patterns/empty-state"
import { Button } from "@/shared/ui/primitives/button"
import { Tooltip } from "@/shared/ui/primitives/tooltip"
import type { InscripcionDiagnosticoItem } from "@nexott-learn/shared-types"
import { Mail, Plus, UserPlus } from "lucide-react"
import { FilaInvitado } from "./fila-invitado"

interface TabInvitadosProps {
  readonly inscripciones: readonly InscripcionDiagnosticoItem[]
  readonly onQuitar?: (inscripcion: InscripcionDiagnosticoItem) => void
  readonly cargando?: boolean
}

export function TabInvitados({ inscripciones, onQuitar, cargando }: TabInvitadosProps) {
  if (cargando && inscripciones.length === 0) {
    return <EsqueletoLista />
  }
  if (inscripciones.length === 0) {
    return (
      <EmptyState
        icon={UserPlus}
        title="Sin candidatos invitados"
        description="Empieza invitando a los participantes que tomarán este curso."
        action={
          <Tooltip content="Disponible próximamente · pendiente endpoint de invitación">
            <span>
              <Button disabled={true}>
                <Plus className="size-4" aria-hidden="true" />
                Invitar candidatos
              </Button>
            </span>
          </Tooltip>
        }
      />
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <CabeceraInvitados total={inscripciones.length} />
      <ul className="flex flex-col gap-2.5">
        {inscripciones.map((insc) => (
          <li key={insc.inscripcionId}>
            <FilaInvitado inscripcion={insc} onQuitar={onQuitar} />
          </li>
        ))}
      </ul>
    </div>
  )
}

function CabeceraInvitados({ total }: { readonly total: number }) {
  return (
    <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-0.5">
        <h2 className="font-semibold text-base text-text-primary">{total} candidatos invitados</h2>
        <p className="text-text-muted text-xs">
          Revisa el estado de cada invitación y completa los pasos siguientes.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Tooltip content="Disponible próximamente · pendiente endpoint">
          <span>
            <Button variant="secondary" size="sm" disabled={true}>
              <Mail className="size-4" aria-hidden="true" />
              Reenviar invitaciones
            </Button>
          </span>
        </Tooltip>
        <Tooltip content="Disponible próximamente · pendiente endpoint">
          <span>
            <Button size="sm" disabled={true}>
              <Plus className="size-4" aria-hidden="true" />
              Invitar más
            </Button>
          </span>
        </Tooltip>
      </div>
    </header>
  )
}

function EsqueletoLista() {
  return (
    <div className="flex flex-col gap-2.5">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: skeleton estatico, sin reordenamiento
          key={i}
          className="h-[64px] animate-pulse rounded-[var(--radius-xl)] border border-glass-border bg-glass-1"
        />
      ))}
    </div>
  )
}
