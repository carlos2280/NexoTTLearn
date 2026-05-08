import { httpClient } from "@/shared/api/http-client"
import {
  type BloquearUsuarioInput,
  type DesbloquearUsuarioInput,
  type UsuarioAdmin,
  usuarioAdminSchema,
} from "@nexott-learn/shared-types"

export async function bloquearUsuario(
  id: string,
  input: BloquearUsuarioInput,
): Promise<UsuarioAdmin> {
  const data = await httpClient.post<UsuarioAdmin>(`/admin/usuarios/${id}/bloquear`, input)
  return usuarioAdminSchema.parse(data)
}

export async function desbloquearUsuario(
  id: string,
  input: DesbloquearUsuarioInput,
): Promise<UsuarioAdmin> {
  const data = await httpClient.post<UsuarioAdmin>(`/admin/usuarios/${id}/desbloquear`, input)
  return usuarioAdminSchema.parse(data)
}
