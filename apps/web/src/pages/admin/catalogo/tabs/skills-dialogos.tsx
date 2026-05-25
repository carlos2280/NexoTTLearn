import { ConfirmMotivoDialog } from "@/shared/components/ui/confirm-motivo-dialog"
import type { AreaResponse, SkillResponse } from "@nexott-learn/shared-types"
import { SkillsCambiarAreaDialog } from "./skills-cambiar-area-dialog"
import { SkillsCrearDialog } from "./skills-crear-dialog"
import { SkillsFusionarDialog } from "./skills-fusionar-dialog"
import { SkillsRenombrarDialog } from "./skills-renombrar-dialog"
import type { useSkillsOrquestacion } from "./use-skills-orquestacion"

interface SkillsDialogosProps {
  readonly orq: ReturnType<typeof useSkillsOrquestacion>
  readonly areas: readonly AreaResponse[]
  readonly skills: readonly SkillResponse[]
}

export function SkillsDialogos({ orq, areas, skills }: SkillsDialogosProps) {
  const cerrarSiCierra = (v: boolean) => (v ? null : orq.cerrar())

  return (
    <>
      <SkillsCrearDialog
        abierto={orq.dialog.modo === "crear"}
        onCambiarAbierto={cerrarSiCierra}
        areas={areas}
        enviando={orq.estado.enviandoCrear}
        onConfirmar={orq.ejecutar.crear}
      />
      <SkillsRenombrarDialog
        abierto={orq.dialog.modo === "renombrar"}
        onCambiarAbierto={cerrarSiCierra}
        skill={orq.dialog.skill}
        enviando={orq.estado.enviandoRenombrar}
        onConfirmar={orq.ejecutar.renombrar}
      />
      <ConfirmMotivoDialog
        abierto={orq.dialog.modo === "archivar"}
        onCambiarAbierto={cerrarSiCierra}
        titulo="Archivar skill — confirmar"
        descripcion={
          orq.dialog.skill
            ? `«${orq.dialog.skill.etiquetaVisible}» dejará de aparecer en los selectores de cursos nuevos. Las referencias existentes se mantienen.`
            : undefined
        }
        textoConfirmar="Archivar"
        placeholderMotivo="Por qué se archiva…"
        enviando={orq.estado.enviandoArchivar}
        onConfirmar={orq.ejecutar.archivar}
      />
      <ConfirmMotivoDialog
        abierto={orq.dialog.modo === "eliminar"}
        onCambiarAbierto={cerrarSiCierra}
        titulo="Eliminar skill — confirmar"
        descripcion={
          orq.dialog.skill
            ? `«${orq.dialog.skill.etiquetaVisible}» será eliminada. Solo es seguro si no tiene referencias.`
            : undefined
        }
        textoConfirmar="Confirmar eliminación"
        variante="danger"
        placeholderMotivo="Por qué se elimina…"
        enviando={orq.estado.enviandoEliminar}
        onConfirmar={orq.ejecutar.eliminar}
      />
      <SkillsCambiarAreaDialog
        abierto={orq.dialog.modo === "cambiar-area"}
        onCambiarAbierto={cerrarSiCierra}
        skill={orq.dialog.skill}
        areas={areas}
        preview={orq.preview}
        cargandoPreview={orq.estado.cargandoPreview}
        enviando={orq.estado.enviandoCambiarArea}
        onPedirPreview={orq.ejecutar.pedirPreview}
        onConfirmar={orq.ejecutar.cambiarArea}
      />
      <SkillsFusionarDialog
        abierto={orq.dialog.modo === "fusionar"}
        onCambiarAbierto={cerrarSiCierra}
        skills={skills}
        areas={areas}
        skillSeleccionada={orq.dialog.skill}
        enviando={orq.estado.enviandoFusionar}
        onConfirmar={orq.ejecutar.fusionar}
      />
    </>
  )
}
