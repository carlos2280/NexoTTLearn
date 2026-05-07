import { useCerrarCurso } from "@/features/admin-cursos/hooks/use-cerrar-curso"
import { useDespublicarCurso } from "@/features/admin-cursos/hooks/use-despublicar-curso"
import { useEliminarCurso } from "@/features/admin-cursos/hooks/use-eliminar-curso"
import { ApiError } from "@/shared/api/api-error"
import type { CursoListItem } from "@nexott-learn/shared-types"
import { useCallback, useState } from "react"

export type TransitionVariant = "unpublish" | "close"

export interface TransitionState {
  readonly variant: TransitionVariant
  readonly curso: CursoListItem
}

interface AccionesCursoResult {
  readonly transition: TransitionState | undefined
  readonly transitionPending: boolean
  readonly transitionError: string | undefined
  readonly requestUnpublish: (curso: CursoListItem) => void
  readonly requestClose: (curso: CursoListItem) => void
  readonly confirmTransition: (motivo: string | undefined) => Promise<void>
  readonly cancelTransition: () => void

  readonly toDelete: CursoListItem | undefined
  readonly deletePending: boolean
  readonly deleteError: string | undefined
  readonly requestDelete: (curso: CursoListItem) => void
  readonly confirmDelete: () => Promise<void>
  readonly cancelDelete: () => void
}

export function useAccionesCurso(): AccionesCursoResult {
  const [transition, setTransition] = useState<TransitionState | undefined>()
  const [transitionError, setTransitionError] = useState<string | undefined>()
  const [toDelete, setToDelete] = useState<CursoListItem | undefined>()
  const [deleteError, setDeleteError] = useState<string | undefined>()

  const despublicar = useDespublicarCurso()
  const cerrar = useCerrarCurso()
  const eliminar = useEliminarCurso()

  const requestUnpublish = useCallback((curso: CursoListItem) => {
    setTransitionError(undefined)
    setTransition({ variant: "unpublish", curso })
  }, [])

  const requestClose = useCallback((curso: CursoListItem) => {
    setTransitionError(undefined)
    setTransition({ variant: "close", curso })
  }, [])

  const cancelTransition = useCallback(() => {
    setTransition(undefined)
    setTransitionError(undefined)
  }, [])

  const confirmTransition = useCallback(
    async (motivo: string | undefined) => {
      if (!transition) {
        return
      }
      setTransitionError(undefined)
      try {
        const input = motivo ? { motivo } : {}
        if (transition.variant === "unpublish") {
          await despublicar.mutateAsync({ id: transition.curso.id, input })
        } else {
          await cerrar.mutateAsync({ id: transition.curso.id, input })
        }
        setTransition(undefined)
      } catch (error) {
        setTransitionError(
          error instanceof ApiError ? error.message : "No se pudo aplicar el cambio.",
        )
      }
    },
    [transition, despublicar, cerrar],
  )

  const requestDelete = useCallback((curso: CursoListItem) => {
    setDeleteError(undefined)
    setToDelete(curso)
  }, [])

  const cancelDelete = useCallback(() => {
    setToDelete(undefined)
    setDeleteError(undefined)
  }, [])

  const confirmDelete = useCallback(async () => {
    if (!toDelete) {
      return
    }
    setDeleteError(undefined)
    try {
      await eliminar.mutateAsync(toDelete.id)
      setToDelete(undefined)
    } catch (error) {
      setDeleteError(error instanceof ApiError ? error.message : "No se pudo eliminar el curso.")
    }
  }, [toDelete, eliminar])

  return {
    transition,
    transitionPending: despublicar.isPending || cerrar.isPending,
    transitionError,
    requestUnpublish,
    requestClose,
    confirmTransition,
    cancelTransition,

    toDelete,
    deletePending: eliminar.isPending,
    deleteError,
    requestDelete,
    confirmDelete,
    cancelDelete,
  }
}
