import { ConfirmMotivoDialog } from "@/shared/components/ui/confirm-motivo-dialog"
import { ModulosFormDialog } from "./modulos-form-dialog"
import type { useModulosOrquestacion } from "./use-modulos-orquestacion"

interface ModulosDialogosProps {
  readonly orq: ReturnType<typeof useModulosOrquestacion>
}

export function ModulosDialogos({ orq }: ModulosDialogosProps) {
  const cerrarSiCierra = (v: boolean) => (v ? null : orq.cerrar())
  const tituloModulo = orq.dialog.modulo?.titulo ?? ""

  return (
    <>
      <ModulosFormDialog
        abierto={orq.dialog.modo === "crear" || orq.dialog.modo === "editar"}
        onCambiarAbierto={cerrarSiCierra}
        modulo={orq.dialog.modo === "editar" ? orq.dialog.modulo : null}
        enviando={orq.estado.enviandoGuardar}
        onGuardar={orq.ejecutar.guardar}
      />
      <ConfirmMotivoDialog
        abierto={orq.dialog.modo === "archivar"}
        onCambiarAbierto={cerrarSiCierra}
        titulo="Archivar módulo — confirmar"
        descripcion={
          orq.dialog.modulo
            ? `«${tituloModulo}» dejará de aparecer en los selectores. Las referencias existentes se mantienen.`
            : undefined
        }
        textoConfirmar="Archivar"
        placeholderMotivo="Por qué se archiva…"
        enviando={orq.estado.enviandoArchivar}
        onConfirmar={orq.ejecutar.archivar}
      />
      <ConfirmMotivoDialog
        abierto={orq.dialog.modo === "desarchivar"}
        onCambiarAbierto={cerrarSiCierra}
        titulo="Desarchivar módulo — confirmar"
        descripcion={
          orq.dialog.modulo
            ? `«${tituloModulo}» volverá a estar disponible en los selectores.`
            : undefined
        }
        textoConfirmar="Desarchivar"
        placeholderMotivo="Por qué se desarchiva…"
        enviando={orq.estado.enviandoDesarchivar}
        onConfirmar={orq.ejecutar.desarchivar}
      />
      <ConfirmMotivoDialog
        abierto={orq.dialog.modo === "eliminar"}
        onCambiarAbierto={cerrarSiCierra}
        titulo="Eliminar módulo — confirmar"
        descripcion={
          orq.dialog.modulo
            ? `«${tituloModulo}» será eliminado. Solo es seguro si no tiene secciones ni cursos asociados.`
            : undefined
        }
        textoConfirmar="Confirmar eliminación"
        variante="danger"
        placeholderMotivo="Por qué se elimina…"
        enviando={orq.estado.enviandoEliminar}
        onConfirmar={orq.ejecutar.eliminar}
      />
    </>
  )
}
