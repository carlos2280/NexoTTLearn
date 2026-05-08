import { httpClient } from "@/shared/api/http-client"
import {
  type ResetPasswordResponse,
  type ResetPasswordUsuarioInput,
  resetPasswordResponseSchema,
} from "@nexott-learn/shared-types"

export async function resetPasswordUsuario(
  id: string,
  input: ResetPasswordUsuarioInput,
): Promise<ResetPasswordResponse> {
  const data = await httpClient.post<ResetPasswordResponse>(
    `/admin/usuarios/${id}/reset-password`,
    input,
  )
  return resetPasswordResponseSchema.parse(data)
}
