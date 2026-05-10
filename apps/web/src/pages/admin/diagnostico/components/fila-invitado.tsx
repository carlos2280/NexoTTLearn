import { cn } from "@/shared/lib/cn"
import { Badge } from "@/shared/ui/patterns/badge"
import { Button } from "@/shared/ui/primitives/button"
import { Card } from "@/shared/ui/primitives/card"
import { Tooltip } from "@/shared/ui/primitives/tooltip"
import type { EstadoInvitado, InscripcionDiagnosticoItem } from "@nexott-learn/shared-types"
import { CheckCircle2, UserMinus } from "lucide-react"
import type { ReactNode } from "react"
import { AvatarIniciales } from "./avatar-iniciales"

interface FilaInvitadoProps {
  readonly inscripcion: InscripcionDiagnosticoItem
  readonly onQuitar?: (inscripcion: InscripcionDiagnosticoItem) => void
}

export function FilaInvitado({ inscripcion, onQuitar }: FilaInvitadoProps) {
  const { participante, estadoInvitado, evaluacion, asignacion } = inscripcion
  return (
    <Card variant="glass" padding="sm" className="flex items-center gap-4">
      <AvatarIniciales nombre={participante.nombre} apellido={participante.apellido} />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium text-sm text-text-primary">
            {participante.nombre} {participante.apellido}
          </span>
          <BadgeEstadoInvitado estado={estadoInvitado} />
        </div>
        <span className="truncate text-text-muted text-xs">{participante.email}</span>
      </div>
      <MetricaCol etiqueta="Evaluación inicial">
        <span className="font-medium text-sm text-text-secondary">
          {evaluacion.areasConDato} / {evaluacion.areasTotales}
        </span>
      </MetricaCol>
      <MetricaCol etiqueta="Asignación">
        <span
          className={cn(
            "inline-flex items-center gap-1 font-medium text-sm",
            asignacion.confirmada ? "text-success" : "text-text-muted",
          )}
        >
          {asignacion.confirmada ? (
            <>
              <CheckCircle2 className="size-3.5" aria-hidden="true" />
              {asignacion.modulosCount} módulos
            </>
          ) : (
            "Pendiente"
          )}
        </span>
      </MetricaCol>
      {onQuitar ? (
        <Tooltip content="Quitar del curso">
          <Button variant="ghost" size="sm" onClick={() => onQuitar(inscripcion)}>
            <UserMinus className="size-4" aria-hidden="true" />
          </Button>
        </Tooltip>
      ) : null}
    </Card>
  )
}

function MetricaCol({
  etiqueta,
  children,
}: {
  readonly etiqueta: string
  readonly children: ReactNode
}) {
  return (
    <div className="hidden flex-col items-end gap-0.5 text-right md:flex">
      <span className="text-text-muted text-xs">{etiqueta}</span>
      {children}
    </div>
  )
}

function BadgeEstadoInvitado({ estado }: { readonly estado: EstadoInvitado }) {
  if (estado === "sin-login") {
    return (
      <Badge tone="warning" size="sm" dot={true}>
        Sin login
      </Badge>
    )
  }
  if (estado === "con-login-sin-eval") {
    return (
      <Badge tone="info" size="sm" dot={true}>
        Sin evaluación
      </Badge>
    )
  }
  return (
    <Badge tone="success" size="sm" dot={true}>
      Activo
    </Badge>
  )
}
