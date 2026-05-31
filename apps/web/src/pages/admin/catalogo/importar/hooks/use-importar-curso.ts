import { importarCurso } from "@/features/cursos/api/importar-curso.api"
import type { ImportarCursoResponse } from "@nexott-learn/shared-types"
import { useMutation } from "@tanstack/react-query"

interface UseImportarCursoResult {
  readonly importar: (contenidoMd: string) => Promise<ImportarCursoResponse>
  readonly isPending: boolean
  readonly resultado: ImportarCursoResponse | null
  readonly error: Error | null
  readonly reset: () => void
}

/**
 * Mutation que envia el contenido del `.md` al backend. La validación y
 * persistencia ocurren server-side; este hook solo expone estado de la
 * mutation para que la página renderice loading/success/error.
 */
export function useImportarCurso(): UseImportarCursoResult {
  const mutation = useMutation({
    mutationFn: (contenidoMd: string) => importarCurso({ contenidoMd }),
  })

  return {
    importar: async (contenidoMd) => await mutation.mutateAsync(contenidoMd),
    isPending: mutation.isPending,
    resultado: mutation.data ?? null,
    error: mutation.error ?? null,
    reset: mutation.reset,
  }
}
