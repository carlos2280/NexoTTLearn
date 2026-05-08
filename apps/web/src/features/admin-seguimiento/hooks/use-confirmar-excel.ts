import type { ExcelConfirmarResponse } from "@nexott-learn/shared-types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { confirmarExcelApi } from "../api/excel.api"
import { COHORTE_AREAS_KEY } from "./use-cohorte-areas"
import { COHORTE_DISTRIBUCION_KEY } from "./use-cohorte-distribucion"
import { COHORTE_SERIE_KEY } from "./use-cohorte-serie"
import { SEGUIMIENTO_KPIS_KEY } from "./use-kpis-seguimiento"
import { SEGUIMIENTO_MATRIZ_KEY } from "./use-matriz-seguimiento"

interface ConfirmarVars {
  readonly cursoId: string
  readonly uploadId: string
}

export function useConfirmarExcel() {
  const qc = useQueryClient()
  return useMutation<ExcelConfirmarResponse, Error, ConfirmarVars>({
    mutationFn: ({ cursoId, uploadId }) => confirmarExcelApi(cursoId, uploadId),
    onSuccess: () => {
      // Invalida todas las vistas que se alimentan de EvaluacionInicial.
      qc.invalidateQueries({ queryKey: SEGUIMIENTO_MATRIZ_KEY })
      qc.invalidateQueries({ queryKey: SEGUIMIENTO_KPIS_KEY })
      qc.invalidateQueries({ queryKey: COHORTE_SERIE_KEY })
      qc.invalidateQueries({ queryKey: COHORTE_AREAS_KEY })
      qc.invalidateQueries({ queryKey: COHORTE_DISTRIBUCION_KEY })
    },
  })
}
