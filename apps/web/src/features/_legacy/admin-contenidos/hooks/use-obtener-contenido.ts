import type { ContenidoAdminItem } from "@nexott-learn/shared-types"
import { useQuery } from "@tanstack/react-query"
import { obtenerContenidoAdmin } from "../api/obtener-contenido-admin.api"

export const ADMIN_CONTENIDO_KEY = (
  cursoId: string,
  moduloId: string,
  seccionId: string,
  contenidoId: string,
): readonly unknown[] =>
  [
    "admin",
    "cursos",
    cursoId,
    "modulos",
    moduloId,
    "secciones",
    seccionId,
    "contenidos",
    contenidoId,
  ] as const

interface UseObtenerContenidoOptions {
  readonly enabled?: boolean
}

// Carga el payload completo de un contenido. El listado embebido en
// SeccionAdminItem solo trae cabecera (id, tipo, titulo); el editor del
// bloque necesita `contenido` para hidratar su draft. Cache por id —
// mientras el bloque viva en pantalla, no se vuelve a pedir.
export function useObtenerContenido(
  cursoId: string,
  moduloId: string,
  seccionId: string,
  contenidoId: string,
  options: UseObtenerContenidoOptions = {},
) {
  return useQuery<ContenidoAdminItem>({
    queryKey: ADMIN_CONTENIDO_KEY(cursoId, moduloId, seccionId, contenidoId),
    queryFn: () => obtenerContenidoAdmin(cursoId, moduloId, seccionId, contenidoId),
    enabled: options.enabled ?? true,
    staleTime: Number.POSITIVE_INFINITY,
  })
}
