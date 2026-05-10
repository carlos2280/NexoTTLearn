import { useMutation } from "@tanstack/react-query"
import { descargarPlantillaApi } from "../api/excel.api"

// Descarga la plantilla del back y dispara la bajada en el navegador.
export function useDescargarPlantilla() {
  return useMutation<void, Error, { cursoId: string }>({
    mutationFn: async ({ cursoId }) => {
      const { blob, filename } = await descargarPlantillaApi(cursoId)
      const url = URL.createObjectURL(blob)
      try {
        const a = document.createElement("a")
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        a.remove()
      } finally {
        URL.revokeObjectURL(url)
      }
    },
  })
}
