import type { ExportarColaboradoresQuery } from "@nexott-learn/shared-types"
import { useMutation } from "@tanstack/react-query"
import { descargarExportColaboradores, dispararDescarga } from "../api/exportar-colaboradores.api"

export function useExportarPersonas() {
  return useMutation({
    mutationFn: async (query: ExportarColaboradoresQuery) => {
      const payload = await descargarExportColaboradores(query)
      dispararDescarga(payload)
      return payload
    },
  })
}
