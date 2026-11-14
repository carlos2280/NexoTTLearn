import { importarCurso } from "@/features/cursos/api/importar-curso.api"
import type { ImportarCursoResponse } from "@nexott-learn/shared-types"
import { useMutation } from "@tanstack/react-query"

/**
 * `confirmarDuplicado`: crear otro curso aunque el titulo ya exista (2A).
 * `reemplazarCursoId`: reemplazar el contenido de ese curso en borrador (2B).
 */
export interface OpcionesImportar {
  readonly confirmarDuplicado?: true
  readonly reemplazarCursoId?: string
}

interface UseImportarCursoResult {
  readonly importar: (
    contenidoMd: string,
    opciones?: OpcionesImportar,
  ) => Promise<ImportarCursoResponse>
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
    mutationFn: (vars: { contenidoMd: string; opciones: OpcionesImportar }) =>
      importarCurso({ contenidoMd: vars.contenidoMd, ...vars.opciones }),
  })

  return {
    importar: async (contenidoMd, opciones = {}) =>
      await mutation.mutateAsync({ contenidoMd, opciones }),
    isPending: mutation.isPending,
    resultado: mutation.data ?? null,
    error: mutation.error ?? null,
    reset: mutation.reset,
  }
}
