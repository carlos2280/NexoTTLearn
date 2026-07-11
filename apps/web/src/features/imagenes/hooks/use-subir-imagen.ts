import { useMutation } from "@tanstack/react-query"
import { subirImagen } from "../api/subir-imagen.api"

/**
 * Sube una imagen de contenido y devuelve su URL. No invalida caché: la imagen
 * se inserta en el HTML del bloque, cuyo guardado lo maneja el editor.
 */
export function useSubirImagen() {
  return useMutation({
    mutationFn: (archivo: File) => subirImagen(archivo),
  })
}
