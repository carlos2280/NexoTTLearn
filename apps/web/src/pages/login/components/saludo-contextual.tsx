import { useEffect, useState } from "react"

function obtenerSaludo(hora: number): string {
  if (hora >= 5 && hora < 12) {
    return "Buenos días"
  }
  if (hora >= 12 && hora < 19) {
    return "Buenas tardes"
  }
  return "Buenas noches"
}

function formatearHora(d: Date): string {
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`
}

function formatearFecha(d: Date): string {
  return d.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })
}

interface SaludoContextualProps {
  readonly variant?: "saludo" | "timestamp"
}

export function SaludoContextual({ variant = "saludo" }: SaludoContextualProps) {
  const [ahora, setAhora] = useState<Date>(() => new Date())

  useEffect(() => {
    const id = window.setInterval(() => setAhora(new Date()), 30_000)
    return () => window.clearInterval(id)
  }, [])

  if (variant === "timestamp") {
    return (
      <div className="flex items-center gap-3 text-caption text-text-tertiary">
        <span className="tabular font-mono">{formatearHora(ahora)}</span>
        <span className="h-1 w-1 rounded-pill bg-text-tertiary" />
        <span className="capitalize">{formatearFecha(ahora)}</span>
      </div>
    )
  }

  return <span className="text-text-primary">{obtenerSaludo(ahora.getHours())}</span>
}
