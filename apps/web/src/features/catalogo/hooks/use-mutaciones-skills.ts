import type {
  CambiarAreaSkillInput,
  CrearSkillInput,
  FusionarSkillsInput,
  RenombrarSkillInput,
} from "@nexott-learn/shared-types"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
  archivarSkill,
  cambiarAreaSkill,
  crearSkill,
  desarchivarSkill,
  eliminarSkill,
  fusionarSkills,
  previewCambioAreaSkill,
  renombrarSkill,
} from "../api/skills.api"
import { SKILLS_QUERY_KEY } from "./use-listar-skills"

function useInvalidarSkills() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: SKILLS_QUERY_KEY })
}

export function useCrearSkill() {
  const invalidar = useInvalidarSkills()
  return useMutation({
    mutationFn: (input: CrearSkillInput) => crearSkill(input),
    onSuccess: () => invalidar(),
  })
}

interface RenombrarArgs {
  readonly id: string
  readonly input: RenombrarSkillInput
  readonly motivo: string
}

export function useRenombrarSkill() {
  const invalidar = useInvalidarSkills()
  return useMutation({
    mutationFn: ({ id, input, motivo }: RenombrarArgs) => renombrarSkill(id, input, motivo),
    onSuccess: () => invalidar(),
  })
}

export function useArchivarSkill() {
  const invalidar = useInvalidarSkills()
  return useMutation({
    mutationFn: ({ id, motivo }: { readonly id: string; readonly motivo: string }) =>
      archivarSkill(id, motivo),
    onSuccess: () => invalidar(),
  })
}

export function useDesarchivarSkill() {
  const invalidar = useInvalidarSkills()
  return useMutation({
    mutationFn: (id: string) => desarchivarSkill(id),
    onSuccess: () => invalidar(),
  })
}

export function useEliminarSkill() {
  const invalidar = useInvalidarSkills()
  return useMutation({
    mutationFn: ({ id, motivo }: { readonly id: string; readonly motivo: string }) =>
      eliminarSkill(id, motivo),
    onSuccess: () => invalidar(),
  })
}

export function usePreviewCambioArea() {
  return useMutation({
    mutationFn: ({ id, input }: { readonly id: string; readonly input: CambiarAreaSkillInput }) =>
      previewCambioAreaSkill(id, input),
  })
}

interface CambiarAreaArgs {
  readonly id: string
  readonly input: CambiarAreaSkillInput
  readonly motivo: string
}

export function useCambiarAreaSkill() {
  const invalidar = useInvalidarSkills()
  return useMutation({
    mutationFn: ({ id, input, motivo }: CambiarAreaArgs) => cambiarAreaSkill(id, input, motivo),
    onSuccess: () => invalidar(),
  })
}

export function useFusionarSkills() {
  const invalidar = useInvalidarSkills()
  return useMutation({
    mutationFn: ({
      input,
      motivo,
    }: { readonly input: FusionarSkillsInput; readonly motivo: string }) =>
      fusionarSkills(input, motivo),
    onSuccess: () => invalidar(),
  })
}
