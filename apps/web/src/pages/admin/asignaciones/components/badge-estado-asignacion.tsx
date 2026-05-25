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

function etiquetaAsignado(estado: EstadoAsignado, tieneEntregaACliente: boolean): string {
  if (!tieneEntregaACliente) {
    if (estado === "APTO") {
      return "Aprobado"
    }
    if (estado === "NO_APTO") {
      return "No aprobado"
    }
  }
  return etiqueta(estado)
}

interface Props {
  readonly asignacion: Asignacion
  /**
   * Si el curso no entrega a cliente, APTO/NO_APTO se renombran a
   * "Aprobado/No aprobado" — el binario "apto/no apto" presupone fase
   * cliente posterior que aqui no aplica. Default true mantiene el copy
   * historico.
   */
  readonly tieneEntregaACliente?: boolean
}

export function BadgeEstadoAsignacion({ asignacion, tieneEntregaACliente = true }: Props) {
  if (asignacion.rol === "ASIGNADO" && asignacion.estadoAsignado) {
    return (
      <Badge tono={tonoAsignado(asignacion.estadoAsignado)}>
        {etiquetaAsignado(asignacion.estadoAsignado, tieneEntregaACliente)}
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
