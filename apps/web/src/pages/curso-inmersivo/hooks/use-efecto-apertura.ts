import { useMarcarApertura } from "@/features/plan-personal/hooks/use-marcar-apertura"
import { useEffect, useRef } from "react"
import type { SeccionActiva } from "./use-seccion-activa"

interface UseEfectoAperturaInput {
  readonly asignacionId: string | null
  readonly seccionActiva: SeccionActiva | null
}

/**
 * Dispara `POST .../apertura` la primera vez que el participante "aterriza"
 * en una sección que aún no había abierto en esta vista. La regla D94 es
 * idempotente en el server, pero evitamos spam por re-render usando un set
 * local que recuerda lo ya disparado en este montaje.
 *
 * No tocar el server cuando la sección ya está `completada`: si ya está
 * marcada en BD no aporta nada y agita las queries de avance sin razón.
 */
export function useEfectoApertura(input: UseEfectoAperturaInput): void {
  const { asignacionId, seccionActiva } = input
  // `mutate` de Tanstack Query es una referencia estable, así que puede entrar
  // a las deps sin disparar bucles (a diferencia del objeto completo del hook).
  const { mutate } = useMarcarApertura()
  const disparadasRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!(asignacionId && seccionActiva)) {
      return
    }
    if (seccionActiva.completada) {
      return
    }
    const clave = `${asignacionId}:${seccionActiva.seccionId}`
    if (disparadasRef.current.has(clave)) {
      return
    }
    disparadasRef.current.add(clave)
    mutate({ asignacionId, seccionId: seccionActiva.seccionId })
  }, [asignacionId, seccionActiva, mutate])
}
