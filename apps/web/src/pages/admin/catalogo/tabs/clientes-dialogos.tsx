import { ConfirmMotivoDialog } from "@/shared/components/ui/confirm-motivo-dialog"
import { ClientesFormDialog } from "./clientes-form-dialog"
import type { useClientesOrquestacion } from "./use-clientes-orquestacion"

interface ClientesDialogosProps {
  readonly orq: ReturnType<typeof useClientesOrquestacion>
}

export function ClientesDialogos({ orq }: ClientesDialogosProps) {
  const cerrarSiCierra = (v: boolean) => (v ? null : orq.cerrar())
  const cliente = orq.dialog.cliente
  const nombre = cliente?.nombre ?? ""
  const futuroEstado = cliente?.activo ? "desactivado" : "activado"

  return (
    <>
      <ClientesFormDialog
        abierto={orq.dialog.modo === "crear" || orq.dialog.modo === "editar"}
        onCambiarAbierto={cerrarSiCierra}
        cliente={orq.dialog.modo === "editar" ? cliente : null}
        enviando={orq.estado.enviandoGuardar}
        onGuardar={orq.ejecutar.guardar}
      />
      <ConfirmMotivoDialog
        abierto={orq.dialog.modo === "toggle-activo"}
        onCambiarAbierto={cerrarSiCierra}
        titulo={cliente?.activo ? "Desactivar cliente — confirmar" : "Activar cliente — confirmar"}
        descripcion={
          cliente
            ? `«${nombre}» quedará ${futuroEstado}. Esta acción afecta la visibilidad en los selectores de cursos.`
            : undefined
        }
        textoConfirmar={cliente?.activo ? "Desactivar" : "Activar"}
        placeholderMotivo="Por qué se cambia el estado…"
        enviando={orq.estado.enviandoToggle}
        onConfirmar={orq.ejecutar.toggleActivo}
      />
      <ConfirmMotivoDialog
        abierto={orq.dialog.modo === "eliminar"}
        onCambiarAbierto={cerrarSiCierra}
        titulo="Eliminar cliente — confirmar"
        descripcion={
          cliente
            ? `«${nombre}» será eliminado. Solo es seguro si no tiene cursos ni solicitudes activas.`
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
