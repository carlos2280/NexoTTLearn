import { useQuitarInscripcion } from "@/features/admin-diagnostico/hooks/use-inscripciones-curso"
import { ApiError } from "@/shared/api/api-error"
import type { InscripcionDiagnosticoItem } from "@nexott-learn/shared-types"
import { useCallback, useState } from "react"
import { toast } from "sonner"

interface UseQuitarDialogResult {
  readonly objetivo: InscripcionDiagnosticoItem | undefined
  readonly enviando: boolean
  readonly pedirQuitar: (inscripcion: InscripcionDiagnosticoItem) => void
  readonly cancelar: () => void
  readonly confirmar: (cursoId: string) => Promise<void>
}

export function useQuitarDialog(): UseQuitarDialogResult {
  const [objetivo, setObjetivo] = useState<InscripcionDiagnosticoItem | undefined>()
  const mutation = useQuitarInscripcion()

  const pedirQuitar = useCallback((inscripcion: InscripcionDiagnosticoItem) => {
    setObjetivo(inscripcion)
  }, [])

  const cancelar = useCallback(() => {
    setObjetivo(undefined)
  }, [])

  const confirmar = useCallback(
    async (cursoId: string) => {
      if (!objetivo) {
        return
      }
      try {
        await mutation.mutateAsync({ cursoId, inscripcionId: objetivo.inscripcionId })
        toast.success(
          `${objetivo.participante.nombre} ${objetivo.participante.apellido} fue quitado del curso`,
        )
        setObjetivo(undefined)
      } catch (error) {
        const mensaje = error instanceof ApiError ? error.message : "No pudimos quitar al candidato"
        toast.error(mensaje)
      }
    },
    [mutation, objetivo],
  )

  return { objetivo, enviando: mutation.isPending, pedirQuitar, cancelar, confirmar }
}
