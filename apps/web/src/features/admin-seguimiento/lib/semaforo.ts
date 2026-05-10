import type { SemaforoCelda } from "@nexott-learn/shared-types"

interface SemaforoConfig {
  readonly label: string
  readonly tone: "success" | "warning" | "danger" | "muted"
  readonly icon: "check" | "alert" | "circle" | "dash"
}

const CONFIG: Record<SemaforoCelda, SemaforoConfig> = {
  verde: { label: "Cumple", tone: "success", icon: "check" },
  amarillo: { label: "Cerca del umbral", tone: "warning", icon: "alert" },
  rojo: { label: "No cumple", tone: "danger", icon: "circle" },
  vacio: { label: "Sin dato", tone: "muted", icon: "dash" },
}

export function configSemaforo(semaforo: SemaforoCelda): SemaforoConfig {
  return CONFIG[semaforo]
}

export function asegurarSemaforo(semaforo: SemaforoCelda): SemaforoCelda {
  switch (semaforo) {
    case "verde":
    case "amarillo":
    case "rojo":
    case "vacio":
      return semaforo
    default: {
      const _exhaustive: never = semaforo
      return _exhaustive
    }
  }
}
