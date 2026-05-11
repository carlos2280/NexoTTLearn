import {
  useArchivarSkill,
  useCambiarAreaSkill,
  useCrearSkill,
  useDesarchivarSkill,
  useEliminarSkill,
  useFusionarSkills,
  usePreviewCambioArea,
  useRenombrarSkill,
} from "@/features/catalogo/hooks/use-mutaciones-skills"
import type { PreviewCambioAreaResponse, SkillResponse } from "@nexott-learn/shared-types"
import { useState } from "react"
import { toast } from "sonner"

export function useSkillsAcciones() {
  const [preview, setPreview] = useState<PreviewCambioAreaResponse | null>(null)
  const crear = useCrearSkill()
  const renombrar = useRenombrarSkill()
  const archivar = useArchivarSkill()
  const desarchivar = useDesarchivarSkill()
  const eliminar = useEliminarSkill()
  const cambiarArea = useCambiarAreaSkill()
  const fusionar = useFusionarSkills()
  const pedirPreview = usePreviewCambioArea()

  return {
    preview,
    resetPreview: () => setPreview(null),
    crear: async (input: { etiquetaVisible: string; areaId: string }) => {
      await crear.mutateAsync(input)
      toast.success(`Skill «${input.etiquetaVisible}» creada`)
    },
    renombrar: async (id: string, etiquetaVisible: string, motivo: string) => {
      await renombrar.mutateAsync({ id, input: { etiquetaVisible }, motivo })
      toast.success(`Skill renombrada a «${etiquetaVisible}»`)
    },
    archivar: async (skill: SkillResponse, motivo: string) => {
      await archivar.mutateAsync({ id: skill.id, motivo })
      toast.success(`Skill «${skill.etiquetaVisible}» archivada`)
    },
    desarchivar: async (skill: SkillResponse) => {
      await desarchivar.mutateAsync(skill.id)
      toast.success(`Skill «${skill.etiquetaVisible}» desarchivada`)
    },
    eliminar: async (skill: SkillResponse, motivo: string) => {
      await eliminar.mutateAsync({ id: skill.id, motivo })
      toast.success(`Skill «${skill.etiquetaVisible}» eliminada`)
    },
    pedirPreview: async (skillId: string, areaDestinoId: string) => {
      const r = await pedirPreview.mutateAsync({ id: skillId, input: { areaDestinoId } })
      setPreview(r)
    },
    cambiarArea: async (skillId: string, areaDestinoId: string, motivo: string) => {
      await cambiarArea.mutateAsync({ id: skillId, input: { areaDestinoId }, motivo })
      toast.success("Área cambiada con éxito")
    },
    fusionar: async (ganadoraId: string, perdedoraId: string, motivo: string) => {
      await fusionar.mutateAsync({
        input: { skillGanadoraId: ganadoraId, skillPerdedoraId: perdedoraId },
        motivo,
      })
      toast.success("Skills fusionadas con éxito")
    },
    enviando: {
      crear: crear.isPending,
      renombrar: renombrar.isPending,
      archivar: archivar.isPending,
      eliminar: eliminar.isPending,
      cambiarArea: cambiarArea.isPending,
      fusionar: fusionar.isPending,
      preview: pedirPreview.isPending,
    },
  }
}
