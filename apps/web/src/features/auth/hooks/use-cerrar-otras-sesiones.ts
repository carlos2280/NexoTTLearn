import { useMutation } from "@tanstack/react-query"
import { cerrarOtrasSesiones } from "../api/cerrar-otras-sesiones.api"

export function useCerrarOtrasSesiones() {
  return useMutation({ mutationFn: cerrarOtrasSesiones })
}
