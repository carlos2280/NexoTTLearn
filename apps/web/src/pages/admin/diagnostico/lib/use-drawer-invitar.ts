import { useInvitarCandidatos } from "@/features/admin-diagnostico/hooks/use-invitar-candidatos"
import type { CandidatoDisponible, InvitarCandidatosResponse } from "@nexott-learn/shared-types"
import { useEffect, useMemo, useState } from "react"

export interface DrawerInvitarController {
  readonly abierto: boolean
  readonly abrir: () => void
  readonly cerrar: () => void
  readonly busqueda: string
  readonly setBusqueda: (q: string) => void
  readonly busquedaDebounced: string
  readonly seleccionados: readonly CandidatoDisponible[]
  readonly toggle: (candidato: CandidatoDisponible) => void
  readonly limpiarSeleccion: () => void
  readonly enviar: () => Promise<InvitarCandidatosResponse | undefined>
  readonly enviando: boolean
  readonly resumen: InvitarCandidatosResponse | undefined
  readonly limpiarResumen: () => void
}

export function useDrawerInvitar(cursoId: string | undefined): DrawerInvitarController {
  const [abierto, setAbierto] = useState(false)
  const [busqueda, setBusqueda] = useState("")
  const busquedaDebounced = useDebouncedValue(busqueda, 250)
  const [seleccionados, setSeleccionados] = useState<CandidatoDisponible[]>([])
  const [resumen, setResumen] = useState<InvitarCandidatosResponse | undefined>(undefined)
  const mutation = useInvitarCandidatos()

  const idsSeleccionados = useMemo(() => new Set(seleccionados.map((c) => c.id)), [seleccionados])

  const abrir = () => {
    setAbierto(true)
    setBusqueda("")
    setSeleccionados([])
    setResumen(undefined)
  }
  const cerrar = () => setAbierto(false)
  const limpiarSeleccion = () => setSeleccionados([])
  const limpiarResumen = () => setResumen(undefined)

  const toggle = (candidato: CandidatoDisponible) => {
    setSeleccionados((prev) =>
      idsSeleccionados.has(candidato.id)
        ? prev.filter((c) => c.id !== candidato.id)
        : [...prev, candidato],
    )
  }

  const enviar = async () => {
    if (!cursoId || seleccionados.length === 0) {
      return undefined
    }
    const data = await mutation.mutateAsync({
      cursoId,
      body: { participanteIds: seleccionados.map((c) => c.id) },
    })
    setResumen(data)
    setSeleccionados([])
    return data
  }

  return {
    abierto,
    abrir,
    cerrar,
    busqueda,
    setBusqueda,
    busquedaDebounced,
    seleccionados,
    toggle,
    limpiarSeleccion,
    enviar,
    enviando: mutation.isPending,
    resumen,
    limpiarResumen,
  }
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(t)
  }, [value, delayMs])
  return debounced
}
