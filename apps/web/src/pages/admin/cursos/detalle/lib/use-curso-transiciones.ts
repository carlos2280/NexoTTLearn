import { useCerrarCurso } from "@/features/admin-cursos/hooks/use-cerrar-curso"
import { useDespublicarCurso } from "@/features/admin-cursos/hooks/use-despublicar-curso"
import { useEliminarCurso } from "@/features/admin-cursos/hooks/use-eliminar-curso"
import { ApiError } from "@/shared/api/api-error"
import { RUTAS } from "@/shared/constants/rutas"
import type { TransicionEstadoCursoInput } from "@nexott-learn/shared-types"
import { useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"

type Variante = "despublicar" | "cerrar"

interface UseCursoTransicionesInput {
  readonly cursoId: string | undefined
}

export function useCursoTransiciones({ cursoId }: UseCursoTransicionesInput) {
  const navigate = useNavigate()
  const despublicarMutation = useDespublicarCurso()
  const cerrarMutation = useCerrarCurso()
  const eliminarMutation = useEliminarCurso()

  const confirmarTransicion = useCallback(
    async (variante: Variante, motivo: string | undefined) => {
      if (!cursoId) {
        return
      }
      const input: TransicionEstadoCursoInput = motivo ? { motivo } : {}
      try {
        if (variante === "despublicar") {
          await despublicarMutation.mutateAsync({ id: cursoId, input })
          toast.success("Curso despublicado")
        } else {
          await cerrarMutation.mutateAsync({ id: cursoId, input })
          toast.success("Curso cerrado")
        }
      } catch (error) {
        const message =
          error instanceof ApiError ? error.message : "No pudimos completar la operación"
        toast.error(message)
        throw error
      }
    },
    [cursoId, despublicarMutation, cerrarMutation],
  )

  const confirmarEliminar = useCallback(async () => {
    if (!cursoId) {
      return
    }
    try {
      await eliminarMutation.mutateAsync(cursoId)
      toast.success("Curso eliminado")
      navigate(RUTAS.admin.cursos)
    } catch (error) {
      const message = error instanceof ApiError ? error.message : "No pudimos eliminar el curso"
      toast.error(message)
    }
  }, [cursoId, eliminarMutation, navigate])

  return {
    despublicarPending: despublicarMutation.isPending,
    cerrarPending: cerrarMutation.isPending,
    eliminarPending: eliminarMutation.isPending,
    confirmarTransicion,
    confirmarEliminar,
  }
}
