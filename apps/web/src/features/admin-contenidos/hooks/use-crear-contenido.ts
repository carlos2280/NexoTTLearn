import { ADMIN_SECCIONES_KEY } from "@/features/admin-secciones/hooks/use-secciones-admin"
import type {
  ContenidoAdminItem,
  CrearContenidoInput,
  ObtenerSeccionesAdminResponse,
} from "@nexott-learn/shared-types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { crearContenidoAdmin } from "../api/crear-contenido-admin.api"

interface CrearContenidoVariables {
  readonly cursoId: string
  readonly moduloId: string
  readonly seccionId: string
  readonly input: CrearContenidoInput
}

// Crear contenido. NO optimistic: el back asigna `id`, `orden`, `creadoEn` y
// (segun el tipo) un `contenido` por defecto que necesitamos para renderizar
// el bloque. Esperamos el round-trip y luego lo metemos en el cache.
export function useCrearContenido() {
  const queryClient = useQueryClient()

  return useMutation<ContenidoAdminItem, Error, CrearContenidoVariables>({
    mutationFn: ({ cursoId, moduloId, seccionId, input }) =>
      crearContenidoAdmin(cursoId, moduloId, seccionId, input),
    onSuccess: (contenidoCreado, { cursoId, moduloId, seccionId }) => {
      const queryKey = ADMIN_SECCIONES_KEY(cursoId, moduloId)
      queryClient.setQueryData<ObtenerSeccionesAdminResponse>(queryKey, (current) => {
        if (!current) {
          return current
        }
        return {
          ...current,
          items: current.items.map((sec) =>
            sec.id === seccionId
              ? {
                  ...sec,
                  contenidos: [...sec.contenidos, embeddedFromItem(contenidoCreado)],
                }
              : sec,
          ),
        }
      })
      // Refetch para que `metadata.duracionEstimada` y demas derivados queden
      // sincronizados con la BD.
      queryClient.invalidateQueries({ queryKey })
    },
  })
}

// El back devuelve un `ContenidoAdminItem` con `contenido` (payload completo).
// El cache de secciones almacena solo la cabecera embebida, asi que mapeamos.
function embeddedFromItem(item: ContenidoAdminItem) {
  const metadata = item.metadata
  const duracionRaw = metadata?.duracionEstimada
  const duracion = typeof duracionRaw === "number" ? duracionRaw : null
  return {
    id: item.id,
    seccionId: item.seccionId,
    tipo: item.tipo,
    titulo: item.titulo,
    orden: item.orden,
    duracionEstimada: duracion,
    metadata: item.metadata,
    archivado: item.archivado,
    creadoEn: item.creadoEn,
    actualizadoEn: item.actualizadoEn,
  }
}
