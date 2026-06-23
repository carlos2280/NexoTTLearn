import type {
  CrearColaboradorInput,
  PatchSkillRequest,
  RolUsuario,
} from "@nexott-learn/shared-types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { cambiarRolColaborador, crearColaborador, editarNotaSkill } from "../api/colaboradores.api"
import { PERSONAS_QUERY_KEY } from "./use-listar-personas"

function useInvalidarPersonas() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: PERSONAS_QUERY_KEY })
}

export function useCrearPersona() {
  const invalidar = useInvalidarPersonas()
  return useMutation({
    mutationFn: (input: CrearColaboradorInput) => crearColaborador(input),
    onSuccess: () => invalidar(),
  })
}

interface CambiarRolArgs {
  readonly colaboradorId: string
  readonly rol: RolUsuario
  readonly motivo: string
}

export function useCambiarRol() {
  const invalidar = useInvalidarPersonas()
  return useMutation({
    mutationFn: (args: CambiarRolArgs) => cambiarRolColaborador(args),
    onSuccess: () => invalidar(),
  })
}

interface EditarNotaArgs {
  readonly colaboradorId: string
  readonly skillId: string
  readonly input: PatchSkillRequest
  readonly motivo: string
}

export function useEditarNotaSkill() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (args: EditarNotaArgs) => editarNotaSkill(args),
    onSuccess: (_data, vars) =>
      queryClient.invalidateQueries({
        queryKey: [...PERSONAS_QUERY_KEY, "ficha", vars.colaboradorId],
      }),
  })
}
