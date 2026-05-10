import type { ExcelPreviewResponse } from "@nexott-learn/shared-types"
import { useMutation } from "@tanstack/react-query"
import { previewExcelApi } from "../api/excel.api"

interface PreviewVars {
  readonly cursoId: string
  readonly archivo: File
}

export function usePreviewExcel() {
  return useMutation<ExcelPreviewResponse, Error, PreviewVars>({
    mutationFn: ({ cursoId, archivo }) => previewExcelApi(cursoId, archivo),
  })
}
