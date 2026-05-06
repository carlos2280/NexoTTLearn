import { useActualizarContenido } from "@/features/admin-contenidos/hooks/use-actualizar-contenido"
import { type UseAutoSaveResult, useAutoSave } from "../hooks/use-auto-save"

interface UseBloqueAutoSaveOptions<T> {
  readonly cursoId: string
  readonly moduloId: string
  readonly seccionId: string
  readonly contenidoId: string
  readonly draft: T
  readonly initial: T
  readonly equals?: (a: T, b: T) => boolean
}

// Wrapper de useAutoSave + useActualizarContenido tipado al payload `contenido`
// del bloque. Cada bloque (lectura/video/recurso) lo usa para no repetir el
// cableado debounce + mutation. El cast a Record<string, unknown> es seguro
// porque los payloads de los 3 tipos de F5.B son objetos planos serializables.
export function useBloqueAutoSave<T>({
  cursoId,
  moduloId,
  seccionId,
  contenidoId,
  draft,
  initial,
  equals,
}: UseBloqueAutoSaveOptions<T>): UseAutoSaveResult {
  const mutation = useActualizarContenido()

  return useAutoSave<T>({
    value: draft,
    initial,
    equals,
    save: async (next) => {
      await mutation.mutateAsync({
        cursoId,
        moduloId,
        seccionId,
        contenidoId,
        input: { contenido: next as unknown as Record<string, unknown> },
      })
    },
  })
}
