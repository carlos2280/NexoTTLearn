import { Badge } from "@/shared/components/ui/badge"
import type { EstadoEmpleado } from "@nexott-learn/shared-types"

interface BadgeEstadoEmpleadoProps {
  readonly estado: EstadoEmpleado
}

export function BadgeEstadoEmpleado({ estado }: BadgeEstadoEmpleadoProps) {
  if (estado === "ACTIVO") {
    return (
      <Badge tono="success" conPunto={true}>
        Activo
      </Badge>
    )
  }
  return (
    <Badge tono="contorno" conPunto={true}>
      Ex empleado
    </Badge>
  )
}
