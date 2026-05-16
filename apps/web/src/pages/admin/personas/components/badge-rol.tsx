import { Badge } from "@/shared/components/ui/badge"
import type { ColaboradorAdminUsuarioInfo } from "@nexott-learn/shared-types"

interface BadgeRolProps {
  readonly rol: ColaboradorAdminUsuarioInfo["rol"] | undefined
}

export function BadgeRol({ rol }: BadgeRolProps) {
  if (!rol) {
    return (
      <Badge tono="neutro" conPunto={false}>
        Sin usuario
      </Badge>
    )
  }
  if (rol === "ADMIN") {
    return (
      <Badge tono="acento" conPunto={false}>
        Administrador
      </Badge>
    )
  }
  return (
    <Badge tono="neutro" conPunto={false}>
      Participante
    </Badge>
  )
}
