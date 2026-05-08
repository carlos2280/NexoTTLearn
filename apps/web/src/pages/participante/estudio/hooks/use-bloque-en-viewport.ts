import { useEffect, useRef, useState } from "react"

const BLOCK_ID_RE = /^block-/

// Observa una lista de elementos `block-{id}` en el canvas y devuelve cual es
// el "actual" (mas visible en viewport). Usa IntersectionObserver con
// thresholds finos para que el cambio sea responsivo al scroll.

interface Options {
  readonly bloqueIds: readonly string[]
  /** Margen superior en px que se descuenta para alinear con el mini-header sticky. */
  readonly offsetTopPx?: number
}

export function useBloqueEnViewport({ bloqueIds, offsetTopPx = 80 }: Options): string | null {
  const [actualId, setActualId] = useState<string | null>(bloqueIds[0] ?? null)
  const visibilidadRef = useRef(new Map<string, number>())

  useEffect(() => {
    if (bloqueIds.length === 0) {
      return
    }

    const observer = crearObserver(bloqueIds, visibilidadRef.current, setActualId, offsetTopPx)
    const observados = observarBloques(observer, bloqueIds)

    return () => {
      for (const el of observados) {
        observer.unobserve(el)
      }
      observer.disconnect()
    }
  }, [bloqueIds, offsetTopPx])

  return actualId
}

function crearObserver(
  bloqueIds: readonly string[],
  visibilidad: Map<string, number>,
  setActualId: (id: string) => void,
  offsetTopPx: number,
): IntersectionObserver {
  // rootMargin: descuenta header arriba y deja una banda muerta abajo (45 %)
  // para que el "actual" sea el bloque cuyo encabezado entra en el tercio
  // superior de lectura, no el ultimo en aparecer al hacer scroll.
  return new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const id = entry.target.id.replace(BLOCK_ID_RE, "")
        visibilidad.set(id, entry.intersectionRatio)
      }
      const mejorId = elegirMasVisible(bloqueIds, visibilidad)
      if (mejorId !== null) {
        setActualId(mejorId)
      }
    },
    {
      rootMargin: `-${offsetTopPx}px 0px -45% 0px`,
      threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
    },
  )
}

function elegirMasVisible(
  bloqueIds: readonly string[],
  visibilidad: Map<string, number>,
): string | null {
  // Empate-rompedor: si dos bloques empatan en ratio (caso de bloque alto que
  // ocupa toda la franja de lectura), gana el primero en orden de canvas.
  let mejorId: string | null = null
  let mejorRatio = 0
  for (const id of bloqueIds) {
    const ratio = visibilidad.get(id) ?? 0
    if (ratio > mejorRatio) {
      mejorId = id
      mejorRatio = ratio
    }
  }
  return mejorId
}

function observarBloques(observer: IntersectionObserver, bloqueIds: readonly string[]): Element[] {
  const elementos: Element[] = []
  for (const id of bloqueIds) {
    const el = document.getElementById(`block-${id}`)
    if (el) {
      observer.observe(el)
      elementos.push(el)
    }
  }
  return elementos
}
