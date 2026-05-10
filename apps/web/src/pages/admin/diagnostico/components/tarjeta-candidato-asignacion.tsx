import { Badge } from "@/shared/ui/patterns/badge"
import { Button } from "@/shared/ui/primitives/button"
import { Card } from "@/shared/ui/primitives/card"
import type {
  AsignacionModulo,
  CandidatoAsignacion,
  TipoAsignacion,
} from "@nexott-learn/shared-types"
import { CheckCircle2, History } from "lucide-react"
import { AvatarIniciales } from "./avatar-iniciales"
import { DropdownTipoAsignacion } from "./dropdown-tipo-asignacion"

interface Props {
  readonly candidato: CandidatoAsignacion
  readonly modulos: readonly AsignacionModulo[]
  readonly tiposPorModulo: ReadonlyMap<string, TipoAsignacion>
  readonly onCambiarTipo: (moduloId: string, tipo: TipoAsignacion) => void
  readonly onQuitar: (moduloId: string) => void
  readonly onVerExpediente?: (inscripcionId: string) => void
}

export function TarjetaCandidatoAsignacion({
  candidato,
  modulos,
  tiposPorModulo,
  onCambiarTipo,
  onQuitar,
  onVerExpediente,
}: Props) {
  const moduloPorId = new Map(modulos.map((m) => [m.id, m]))
  const moduloIds = Array.from(tiposPorModulo.keys())
  const moduloIdsOrdenados = moduloIds
    .map((id) => moduloPorId.get(id))
    .filter((m): m is AsignacionModulo => m !== undefined)
    .sort((a, b) => a.orden - b.orden)
  const sinAsignaciones = moduloIdsOrdenados.length === 0

  return (
    <Card variant="glass" padding="md" className="flex flex-col gap-3">
      <header className="flex items-center gap-3">
        <AvatarIniciales
          nombre={candidato.participante.nombre}
          apellido={candidato.participante.apellido}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-medium text-sm text-text-primary">
            {candidato.participante.nombre} {candidato.participante.apellido}
          </span>
          <span className="truncate text-text-muted text-xs">{candidato.participante.email}</span>
        </div>
        {candidato.tieneEvaluacion ? null : (
          <Badge tone="warning" size="sm" dot={true}>
            Sin evaluación
          </Badge>
        )}
      </header>

      {sinAsignaciones && candidato.tieneEvaluacion && candidato.cumple.length > 0 ? (
        <p className="inline-flex items-center gap-1.5 text-sm text-success">
          <CheckCircle2 className="size-4" aria-hidden="true" />
          Cumple todas las áreas · directo a Transversal
        </p>
      ) : null}

      {sinAsignaciones && !candidato.tieneEvaluacion ? (
        <p className="text-text-muted text-xs italic">
          Sin sugerencias automáticas. Asigna módulos manualmente.
        </p>
      ) : null}

      {moduloIdsOrdenados.length > 0 ? (
        <ul className="flex flex-col gap-1.5">
          {moduloIdsOrdenados.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between gap-3 rounded-[var(--radius-sm)] bg-glass-2 px-3 py-2"
            >
              <span className="truncate text-sm text-text-primary">{m.titulo}</span>
              <DropdownTipoAsignacion
                tipoActual={tiposPorModulo.get(m.id)}
                onCambiar={(tipo) => onCambiarTipo(m.id, tipo)}
                onQuitar={() => onQuitar(m.id)}
              />
            </li>
          ))}
        </ul>
      ) : null}

      {candidato.cumple.length > 0 && !sinAsignaciones ? (
        <p className="text-text-muted text-xs">
          Cumple: {candidato.cumple.map((c) => c.areaNombre).join(" · ")}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onVerExpediente?.(candidato.inscripcionId)}
          disabled={!onVerExpediente}
        >
          <History className="size-4" aria-hidden="true" />
          Expediente
        </Button>
      </div>
    </Card>
  )
}
