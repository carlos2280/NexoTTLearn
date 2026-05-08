import { httpClient } from "@/shared/api/http-client"
import {
  type ActivarMfaUsuarioInput,
  type ResetMfaUsuarioInput,
  type UsuarioAdmin,
  usuarioAdminSchema,
} from "@nexott-learn/shared-types"

export async function activarMfaUsuario(
  id: string,
  input: ActivarMfaUsuarioInput,
): Promise<UsuarioAdmin> {
  const data = await httpClient.post<UsuarioAdmin>(`/admin/usuarios/${id}/activar-mfa`, input)
  return usuarioAdminSchema.parse(data)
}

export async function resetMfaUsuario(
  id: string,
  input: ResetMfaUsuarioInput,
): Promise<UsuarioAdmin> {
  const data = await httpClient.post<UsuarioAdmin>(`/admin/usuarios/${id}/reset-mfa`, input)
  return usuarioAdminSchema.parse(data)
}
