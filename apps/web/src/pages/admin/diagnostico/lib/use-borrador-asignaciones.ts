import type { CandidatoAsignacion, TipoAsignacion } from "@nexott-learn/shared-types"
import { useEffect, useMemo, useState } from "react"

// Estado local del tab "Asignacion": mantiene el borrador de asignaciones por
// inscripcion. Se inicializa con (confirmadas ?? sugerencias) y permite cambios
// inline antes de confirmar via [Confirmar asignacion]. Cuando llegan datos
// nuevos del server (refetch), reintegra solo las inscripciones aun no tocadas.

export type BorradorPorInscripcion = ReadonlyMap<string, ReadonlyMap<string, TipoAsignacion>>

interface UseBorradorArgs {
  readonly candidatos: readonly CandidatoAsignacion[]
}

export interface UseBorradorReturn {
  readonly borrador: BorradorPorInscripcion
  readonly tocadas: ReadonlySet<string>
  readonly setTipo: (inscripcionId: string, moduloId: string, tipo: TipoAsignacion) => void
  readonly quitar: (inscripcionId: string, moduloId: string) => void
  readonly aceptarSugerencias: (inscripcionId: string) => void
  readonly limpiar: () => void
}

function inicialPara(c: CandidatoAsignacion): Map<string, TipoAsignacion> {
  const map = new Map<string, TipoAsignacion>()
  if (c.confirmadas.length > 0) {
    for (const a of c.confirmadas) {
      map.set(a.moduloId, a.tipo)
    }
  } else {
    for (const s of c.sugerencias) {
      map.set(s.moduloId, s.tipo)
    }
  }
  return map
}

export function useBorradorAsignaciones({ candidatos }: UseBorradorArgs): UseBorradorReturn {
  const [estado, setEstado] = useState<Map<string, Map<string, TipoAsignacion>>>(() => new Map())
  const [tocadas, setTocadas] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    setEstado((prev) => {
      const next = new Map(prev)
      for (const c of candidatos) {
        if (!tocadas.has(c.inscripcionId)) {
          next.set(c.inscripcionId, inicialPara(c))
        }
      }
      return next
    })
  }, [candidatos, tocadas])

  const setTipo = (inscripcionId: string, moduloId: string, tipo: TipoAsignacion) => {
    setEstado((prev) => {
      const next = new Map(prev)
      const sub = new Map(next.get(inscripcionId) ?? [])
      sub.set(moduloId, tipo)
      next.set(inscripcionId, sub)
      return next
    })
    setTocadas((prev) => new Set(prev).add(inscripcionId))
  }

  const quitar = (inscripcionId: string, moduloId: string) => {
    setEstado((prev) => {
      const next = new Map(prev)
      const sub = new Map(next.get(inscripcionId) ?? [])
      sub.delete(moduloId)
      next.set(inscripcionId, sub)
      return next
    })
    setTocadas((prev) => new Set(prev).add(inscripcionId))
  }

  const aceptarSugerencias = (inscripcionId: string) => {
    const c = candidatos.find((x) => x.inscripcionId === inscripcionId)
    if (!c) {
      return
    }
    setEstado((prev) => {
      const next = new Map(prev)
      next.set(inscripcionId, inicialPara({ ...c, confirmadas: [] }))
      return next
    })
    setTocadas((prev) => new Set(prev).add(inscripcionId))
  }

  const limpiar = () => {
    setEstado(new Map())
    setTocadas(new Set())
  }

  const borrador = useMemo<BorradorPorInscripcion>(
    () => new Map(Array.from(estado, ([k, v]) => [k, new Map(v)])),
    [estado],
  )

  return { borrador, tocadas, setTipo, quitar, aceptarSugerencias, limpiar }
}
