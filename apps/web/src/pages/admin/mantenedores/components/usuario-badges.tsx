import { Badge } from "@/shared/ui/patterns/badge"
import type { RolMantenedor, UsuarioAdmin } from "@nexott-learn/shared-types"

interface RolBadgeProps {
  readonly rol: RolMantenedor
}

export function RolBadge({ rol }: RolBadgeProps) {
  const tone = rol === "ADMIN" ? "violet" : "neutral"
  const label = rol === "ADMIN" ? "Admin" : "Participante"
  return (
    <Badge tone={tone} size="sm">
      {label}
    </Badge>
  )
}

interface EstadoBadgeProps {
  readonly estado: UsuarioAdmin["estado"]
}

export function EstadoBadge({ estado }: EstadoBadgeProps) {
  if (estado === "BLOQUEADO") {
    return (
      <Badge tone="danger" size="sm" dot={true}>
        Bloqueado
      </Badge>
    )
  }
  return (
    <Badge tone="success" size="sm" dot={true}>
      Activo
    </Badge>
  )
}

interface MfaBadgeProps {
  readonly activado: boolean
  readonly confirmado: boolean
}

export function MfaBadge({ activado, confirmado }: MfaBadgeProps) {
  if (!activado) {
    return (
      <Badge tone="neutral" size="sm">
        MFA off
      </Badge>
    )
  }
  if (!confirmado) {
    return (
      <Badge tone="warning" size="sm">
        MFA pendiente
      </Badge>
    )
  }
  return (
    <Badge tone="info" size="sm">
      MFA on
    </Badge>
  )
}
