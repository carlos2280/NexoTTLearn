import { useEffect, useState } from "react"

/**
 * Timer respiratorio del chat (no countdown). Empieza desde `inicioISO` y
 * devuelve un string formateado `MM:SS`. Se actualiza cada segundo mientras
 * el chat sigue activo (controlado por `activo`).
 */
export function useTimerEntrevista(inicioISO: string, activo: boolean): string {
  const [tick, setTick] = useState(0)
  useEffect(() => {
    if (!activo) {
      return
    }
    const id = window.setInterval(() => setTick((t) => t + 1), 1_000)
    return () => window.clearInterval(id)
  }, [activo])
  // tick fuerza re-render; el calculo real va aqui.
  const inicio = Date.parse(inicioISO)
  const segundos = Number.isNaN(inicio)
    ? tick
    : Math.max(0, Math.floor((Date.now() - inicio) / 1_000))
  const mm = String(Math.floor(segundos / 60)).padStart(2, "0")
  const ss = String(segundos % 60).padStart(2, "0")
  return `${mm}:${ss}`
}
