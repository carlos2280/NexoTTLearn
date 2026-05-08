import { httpClient } from "@/shared/api/http-client"
import {
  type ActualizarUsuarioInput,
  type UsuarioAdmin,
  usuarioAdminSchema,
} from "@nexott-learn/shared-types"

export async function actualizarUsuario(
  id: string,
  input: ActualizarUsuarioInput,
): Promise<UsuarioAdmin> {
  const data = await httpClient.patch<UsuarioAdmin>(`/admin/usuarios/${id}`, input)
  return usuarioAdminSchema.parse(data)
}
