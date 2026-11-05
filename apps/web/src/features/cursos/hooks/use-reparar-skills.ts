import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { previsualizarRepararSkills, repararSkills } from "../api/reparar-skills.api"
import { CURSOS_QUERY_KEY } from "./use-listar-cursos"

function claveReparacion(cursoId: string) {
  return [...CURSOS_QUERY_KEY, cursoId, "reparar-skills"] as const
}

/** Resumen de lo que repararia el curso (no escribe nada). */
export function usePrevisualizarRepararSkills(cursoId: string, habilitado: boolean) {
  return useQuery({
    queryKey: claveReparacion(cursoId),
    queryFn: () => previsualizarRepararSkills(cursoId),
    enabled: habilitado,
  })
}

/** Aplica la reparacion; refresca el curso (y con el, el resumen). */
export function useRepararSkills(cursoId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => repararSkills(cursoId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CURSOS_QUERY_KEY }),
  })
}
