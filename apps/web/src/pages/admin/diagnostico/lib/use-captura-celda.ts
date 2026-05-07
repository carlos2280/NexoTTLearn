import { useUpsertEvaluacionCelda } from "@/features/admin-diagnostico/hooks/use-diagnostico-matriz"
import { ApiError } from "@/shared/api/api-error"
import type { MatrizDiagnosticoArea, MatrizDiagnosticoFila } from "@nexott-learn/shared-types"
import { useCallback, useState } from "react"
import { toast } from "sonner"

interface CeldaActiva {
  readonly fila: MatrizDiagnosticoFila
  readonly area: MatrizDiagnosticoArea
}

interface UseCapturaCeldaResult {
  readonly fila: MatrizDiagnosticoFila | undefined
  readonly area: MatrizDiagnosticoArea | undefined
  readonly enviando: boolean
  readonly abrir: (celda: CeldaActiva) => void
  readonly cerrar: () => void
  readonly guardar: (puntaje: number, observaciones: string | undefined) => Promise<void>
}

export function useCapturaCelda(): UseCapturaCeldaResult {
  const [activa, setActiva] = useState<CeldaActiva | undefined>()
  const mutation = useUpsertEvaluacionCelda()

  const abrir = useCallback((celda: CeldaActiva) => setActiva(celda), [])
  const cerrar = useCallback(() => setActiva(undefined), [])

  const guardar = useCallback(
    async (puntaje: number, observaciones: string | undefined) => {
      if (!activa) {
        return
      }
      try {
        await mutation.mutateAsync({
          inscripcionId: activa.fila.inscripcionId,
          areaId: activa.area.id,
          input: { puntaje, observaciones: observaciones ?? null },
        })
        toast.success("Evaluación guardada")
        setActiva(undefined)
      } catch (error) {
        const mensaje =
          error instanceof ApiError ? error.message : "No pudimos guardar la evaluación"
        toast.error(mensaje)
      }
    },
    [activa, mutation],
  )

  return {
    fila: activa?.fila,
    area: activa?.area,
    enviando: mutation.isPending,
    abrir,
    cerrar,
    guardar,
  }
}
