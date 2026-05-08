import { httpClient } from "@/shared/api/http-client"
import {
  type CrearUsuarioInput,
  type UsuarioConCredenciales,
  usuarioConCredencialesSchema,
} from "@nexott-learn/shared-types"

export async function crearUsuario(input: CrearUsuarioInput): Promise<UsuarioConCredenciales> {
  const data = await httpClient.post<UsuarioConCredenciales>("/admin/usuarios", input)
  return usuarioConCredencialesSchema.parse(data)
}
