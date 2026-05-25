import { useActualizarCurso } from "@/features/cursos/hooks/use-mutaciones-curso"
import { ApiError } from "@/shared/api/api-error"
import type { ActualizarCursoInput } from "@nexott-learn/shared-types"
import { toast } from "sonner"

export function useActualizarCursoDetalle(cursoId: string) {
  const mutacion = useActualizarCurso()

  async function guardar(input: ActualizarCursoInput, motivo: string | undefined) {
    try {
      await mutacion.mutateAsync({ id: cursoId, input, motivo })
      toast.success("Cambios guardados")
    } catch (err) {
      if (err instanceof ApiError) {
        throw err
      }
      throw new Error(err instanceof Error ? err.message : "No se pudo guardar")
    }
  }

  return { guardar, enviando: mutacion.isPending }
}
