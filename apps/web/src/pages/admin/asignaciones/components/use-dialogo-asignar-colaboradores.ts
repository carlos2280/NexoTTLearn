import { useColaboradoresDisponibles } from "@/features/asignaciones/hooks/use-colaboradores-disponibles"
import { useCrearAsignacionesBatch } from "@/features/asignaciones/hooks/use-mutaciones-asignacion"
import type { CrearAsignacionesBatchResponse } from "@nexott-learn/shared-types"
import { useEffect, useState } from "react"

const PAGE_SIZE = 20

interface ParametrosHook {
  readonly cursoId: string
  readonly abierto: boolean
  readonly onCompletado: (respuesta: CrearAsignacionesBatchResponse) => void
}

// La seleccion vive como Set<string> y persiste cross-pagina: el usuario
// pagina, marca gente, y al asignar va todo en un solo batch.
export function useDialogoAsignarColaboradores({ cursoId, abierto, onCompletado }: ParametrosHook) {
  const [busqueda, setBusqueda] = useState("")
  const [page, setPage] = useState(1)
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const mutation = useCrearAsignacionesBatch()

  useEffect(() => {
    if (!abierto) {
      return
    }
    setBusqueda("")
    setPage(1)
    setSeleccionados(new Set())
    setError(null)
  }, [abierto])

  const query = useColaboradoresDisponibles(
    cursoId,
    { page, pageSize: PAGE_SIZE, q: busqueda.length > 0 ? busqueda : undefined },
    { habilitado: abierto },
  )

  async function asignar() {
    if (seleccionados.size === 0) {
      return
    }
    setError(null)
    try {
      const r = await mutation.mutateAsync({
        cursoId,
        input: { colaboradorIds: Array.from(seleccionados) },
      })
      onCompletado(r)
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron asignar")
    }
  }

  return {
    busqueda,
    page,
    seleccionados,
    error,
    pageSize: PAGE_SIZE,
    enviando: mutation.isPending,
    datos: query.data,
    cargando: query.isLoading && !query.data,
    errorCarga: query.error,
    cambiarBusqueda: (v: string) => {
      setBusqueda(v)
      setPage(1)
    },
    cambiarPage: setPage,
    alternar: (id: string) =>
      setSeleccionados((prev) => {
        const next = new Set(prev)
        next.has(id) ? next.delete(id) : next.add(id)
        return next
      }),
    limpiarSeleccion: () => setSeleccionados(new Set()),
    asignar,
  }
}
