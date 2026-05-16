import { Badge } from "@/shared/components/ui/badge"
import type { Asignacion, EstadoAsignado, EstadoVoluntario } from "@nexott-learn/shared-types"

type Tono = "neutro" | "acento" | "success" | "warning" | "danger" | "info"

const SEPARADOR_REGEX = /_/g
const PRIMERA_LETRA_REGEX = /^./

function tonoAsignado(estado: EstadoAsignado): Tono {
  switch (estado) {
    case "ASIGNADO":
      return "info"
    case "EN_PROGRESO":
      return "acento"
    case "LISTO":
      return "warning"
    case "APTO":
      return "success"
    case "NO_APTO":
      return "danger"
    case "RETIRADO":
      return "neutro"
    default:
      return "neutro"
  }
}

function tonoVoluntario(estado: EstadoVoluntario): Tono {
  switch (estado) {
    case "INSCRITO":
      return "info"
    case "EN_PROGRESO":
      return "acento"
    case "LISTO":
      return "warning"
    case "COMPLETADO":
      return "success"
    case "RETIRADO":
      return "neutro"
    default:
      return "neutro"
  }
}

function etiqueta(estado: string): string {
  const enMinus = estado.replace(SEPARADOR_REGEX, " ").toLowerCase()
  return enMinus.replace(PRIMERA_LETRA_REGEX, (c) => c.toUpperCase())
}

interface Props {
  readonly asignacion: Asignacion
}

export function BadgeEstadoAsignacion({ asignacion }: Props) {
  if (asignacion.rol === "ASIGNADO" && asignacion.estadoAsignado) {
    return (
      <Badge tono={tonoAsignado(asignacion.estadoAsignado)}>
        {etiqueta(asignacion.estadoAsignado)}
      </Badge>
    )
  }
  if (asignacion.rol === "VOLUNTARIO" && asignacion.estadoVoluntario) {
    return (
      <Badge tono={tonoVoluntario(asignacion.estadoVoluntario)}>
        {etiqueta(asignacion.estadoVoluntario)}
      </Badge>
    )
  }
  return <Badge tono="neutro">—</Badge>
}
