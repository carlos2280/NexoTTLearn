import type { EstadoSeguimiento } from "@nexott-learn/shared-types"

interface EstadoConfig {
  readonly label: string
  readonly tone: "success" | "warning" | "danger" | "info"
  readonly icon: "check" | "alert" | "siren" | "trophy"
}

export function configEstadoSeguimiento(estado: EstadoSeguimiento): EstadoConfig {
  switch (estado) {
    case "Apto":
      return { label: "Apto", tone: "success", icon: "check" }
    case "EnRuta":
      return { label: "En ruta", tone: "warning", icon: "alert" }
    case "EnRiesgo":
      return { label: "En riesgo", tone: "danger", icon: "siren" }
    case "Completado":
      return { label: "Completado", tone: "info", icon: "trophy" }
    default: {
      const _exhaustive: never = estado
      return _exhaustive
    }
  }
}
