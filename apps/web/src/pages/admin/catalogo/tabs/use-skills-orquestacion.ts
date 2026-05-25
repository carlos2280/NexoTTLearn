import type { SkillResponse } from "@nexott-learn/shared-types"
import { useState } from "react"
import { useSkillsAcciones } from "./use-skills-acciones"

export type ModoDialogSkills =
  | "cerrado"
  | "crear"
  | "renombrar"
  | "archivar"
  | "eliminar"
  | "cambiar-area"
  | "fusionar"

export interface EstadoDialogSkills {
  readonly modo: ModoDialogSkills
  readonly skill: SkillResponse | null
}

const CERRADO: EstadoDialogSkills = { modo: "cerrado", skill: null }

export function useSkillsOrquestacion() {
  const [dialog, setDialog] = useState<EstadoDialogSkills>(CERRADO)
  const acc = useSkillsAcciones()

  const abrir = (modo: ModoDialogSkills, skill: SkillResponse | null = null) => {
    acc.resetPreview()
    setDialog({ modo, skill })
  }
  const cerrar = () => {
    acc.resetPreview()
    setDialog(CERRADO)
  }

  async function conSkill(op: (s: SkillResponse) => Promise<void>) {
    if (!dialog.skill) {
      return
    }
    await op(dialog.skill)
    cerrar()
  }

  return {
    dialog,
    preview: acc.preview,
    abrir,
    cerrar,
    ejecutar: {
      crear: async (i: { etiquetaVisible: string; areaId: string }) => {
        await acc.crear(i)
        cerrar()
      },
      renombrar: (i: { etiquetaVisible: string; motivo: string }) =>
        conSkill((s) => acc.renombrar(s.id, i.etiquetaVisible, i.motivo)),
      archivar: (motivo: string) => conSkill((s) => acc.archivar(s, motivo)),
      desarchivar: (skill: SkillResponse) => acc.desarchivar(skill),
      eliminar: (motivo: string) => conSkill((s) => acc.eliminar(s, motivo)),
      pedirPreview: async (areaDestinoId: string) => {
        if (dialog.skill) {
          await acc.pedirPreview(dialog.skill.id, areaDestinoId)
        }
      },
      cambiarArea: (areaDestinoId: string, motivo: string) =>
        conSkill((s) => acc.cambiarArea(s.id, areaDestinoId, motivo)),
      fusionar: async (ganadoraId: string, perdedoraId: string, motivo: string) => {
        await acc.fusionar(ganadoraId, perdedoraId, motivo)
        cerrar()
      },
    },
    estado: {
      enviandoCrear: acc.enviando.crear,
      enviandoRenombrar: acc.enviando.renombrar,
      enviandoArchivar: acc.enviando.archivar,
      enviandoEliminar: acc.enviando.eliminar,
      enviandoCambiarArea: acc.enviando.cambiarArea,
      enviandoFusionar: acc.enviando.fusionar,
      cargandoPreview: acc.enviando.preview,
    },
  }
}
