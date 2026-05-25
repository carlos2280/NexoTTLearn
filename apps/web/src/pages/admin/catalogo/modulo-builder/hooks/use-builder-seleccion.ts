import { useEffect, useState } from "react"
import type { Seleccion } from "../types"

const INICIAL: Seleccion = { tipo: "modulo" }

/**
 * Estado local de "que esta seleccionado en el arbol del builder".
 *  - ESC deselecciona (vuelve al modulo).
 *  - Si llega un cambio de modulo, se reinicia.
 */
export function useBuilderSeleccion(moduloId: string | undefined) {
  const [seleccion, setSeleccion] = useState<Seleccion>(INICIAL)

  // Reiniciar al cambiar de modulo
  // biome-ignore lint/correctness/useExhaustiveDependencies: moduloId es prop de entrada; su cambio debe disparar el reset aunque setSeleccion sea estable
  useEffect(() => {
    setSeleccion(INICIAL)
  }, [moduloId])

  // ESC deselecciona
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setSeleccion(INICIAL)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  return {
    seleccion,
    seleccionarModulo: () => setSeleccion(INICIAL),
    seleccionarSeccion: (seccionId: string) => setSeleccion({ tipo: "seccion", seccionId }),
    seleccionarBloque: (bloqueId: string) => setSeleccion({ tipo: "bloque", bloqueId }),
  }
}

export type BuilderSeleccion = ReturnType<typeof useBuilderSeleccion>
