import { Badge } from "@/shared/ui/patterns/badge"
import { Button } from "@/shared/ui/primitives/button"
import { Card } from "@/shared/ui/primitives/card"
import type { HubDiagnosticoItem } from "@nexott-learn/shared-types"
import { AlertTriangle, ArrowRight, CheckCircle2, Clock } from "lucide-react"

interface TarjetaCursoHubProps {
  readonly item: HubDiagnosticoItem
  readonly onIr: (item: HubDiagnosticoItem) => void
}

export function TarjetaCursoHub({ item, onIr }: TarjetaCursoHubProps) {
  const { contadores, estadoDiagnostico, diasRestantes, deadline } = item
  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex flex-col gap-1">
        <span className="text-text-muted text-xs uppercase tracking-wider">
          {item.empresaCliente}
        </span>
        <h3 className="font-semibold text-base text-text-primary tracking-tight">{item.titulo}</h3>
      </div>

      <DeadlineLine diasRestantes={diasRestantes} deadline={deadline} />

      <ul className="flex flex-col gap-1.5 text-sm text-text-secondary">
        <li>
          <strong className="font-medium text-text-primary">{contadores.invitados}</strong>{" "}
          invitados
        </li>
        <li>
          <strong className="font-medium text-text-primary">{contadores.sinEvaluacion}</strong> sin
          evaluación inicial
        </li>
        <li>
          <strong className="font-medium text-text-primary">{contadores.sinAsignacion}</strong> sin
          asignar módulos
        </li>
      </ul>

      <div className="mt-auto flex items-center justify-between gap-3">
        <EstadoBadge estado={estadoDiagnostico} />
        <Button size="sm" variant="ghost" onClick={() => onIr(item)}>
          {estadoDiagnostico === "al-dia" ? "Ver matriz" : "Continuar diagnóstico"}
          <ArrowRight className="size-4" strokeWidth={2} aria-hidden="true" />
        </Button>
      </div>
    </Card>
  )
}

interface DeadlineLineProps {
  readonly diasRestantes: number | null
  readonly deadline: string | null
}

function DeadlineLine({ diasRestantes, deadline }: DeadlineLineProps) {
  if (diasRestantes === null || deadline === null) {
    return <p className="text-text-muted text-xs">Sin deadline definido</p>
  }
  const urgente = diasRestantes < 14
  const Icon = urgente ? AlertTriangle : Clock
  const tone = urgente ? "text-warning" : "text-text-secondary"
  return (
    <p className={`flex items-center gap-1.5 text-xs ${tone}`}>
      <Icon className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
      Deadline en {diasRestantes} día{diasRestantes === 1 ? "" : "s"}
    </p>
  )
}

interface EstadoBadgeProps {
  readonly estado: HubDiagnosticoItem["estadoDiagnostico"]
}

function EstadoBadge({ estado }: EstadoBadgeProps) {
  switch (estado) {
    case "al-dia":
      return (
        <Badge tone="success" size="sm">
          <CheckCircle2 className="size-3" strokeWidth={2} aria-hidden="true" />
          Al día
        </Badge>
      )
    case "pendiente":
      return (
        <Badge tone="warning" size="sm" dot={true}>
          Pendiente
        </Badge>
      )
    case "sin-invitados":
      return (
        <Badge tone="neutral" size="sm">
          Sin invitados
        </Badge>
      )
    default: {
      const _exhaustive: never = estado
      return _exhaustive
    }
  }
}
