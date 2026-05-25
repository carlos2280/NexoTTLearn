import type { AplicarRequest, AplicarResponse, PreviewResponse } from "@nexott-learn/shared-types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  aplicarPreview,
  crearPreview,
  descargarTemplate,
  descartarPreview,
} from "../api/evaluacion-inicial.api"
import { HISTORIAL_EVALUACION_KEY } from "./use-historial-evaluacion"

export function useDescargarTemplate() {
  return useMutation<Blob, Error, string>({
    mutationFn: (cursoId: string) => descargarTemplate(cursoId),
  })
}

interface CrearPreviewVars {
  readonly cursoId: string
  readonly archivo: File
}

export function useCrearPreview() {
  return useMutation<PreviewResponse, Error, CrearPreviewVars>({
    mutationFn: ({ cursoId, archivo }) => crearPreview(cursoId, archivo),
  })
}

interface DescartarPreviewVars {
  readonly cursoId: string
  readonly previewId: string
}

export function useDescartarPreview() {
  return useMutation<void, Error, DescartarPreviewVars>({
    mutationFn: ({ cursoId, previewId }) => descartarPreview(cursoId, previewId),
  })
}

interface AplicarPreviewVars {
  readonly cursoId: string
  readonly previewId: string
  readonly body: AplicarRequest
  readonly idempotencyKey: string
}

export function useAplicarPreview() {
  const queryClient = useQueryClient()
  return useMutation<AplicarResponse, Error, AplicarPreviewVars>({
    mutationFn: ({ cursoId, previewId, body, idempotencyKey }) =>
      aplicarPreview(cursoId, previewId, body, idempotencyKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HISTORIAL_EVALUACION_KEY })
    },
  })
}
