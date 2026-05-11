import { useEffect, useState } from "react"

const INTERVALO_MS = 30_000

interface RelojVivo {
  readonly hora: string
  readonly fechaLarga: string
}

const formateadorHora = new Intl.DateTimeFormat("es-ES", {
  hour: "2-digit",
  minute: "2-digit",
})

const formateadorFecha = new Intl.DateTimeFormat("es-ES", {
  weekday: "long",
  day: "numeric",
  month: "long",
})

function calcular(): RelojVivo {
  const ahora = new Date()
  return {
    hora: formateadorHora.format(ahora),
    fechaLarga: formateadorFecha.format(ahora),
  }
}

export function useRelojVivo(): RelojVivo {
  const [estado, setEstado] = useState<RelojVivo>(() => calcular())

  useEffect(() => {
    const id = setInterval(() => setEstado(calcular()), INTERVALO_MS)
    return () => clearInterval(id)
  }, [])

  return estado
}
