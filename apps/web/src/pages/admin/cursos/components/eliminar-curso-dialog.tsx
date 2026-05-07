import { ConfirmDialog } from "@/shared/ui/patterns/confirm-dialog"

interface EliminarCursoDialogProps {
  readonly abierto: boolean
  readonly cursoTitulo: string
  readonly enviando: boolean
  readonly onCancelar: () => void
  readonly onConfirmar: () => void | Promise<void>
}

export function EliminarCursoDialog({
  abierto,
  cursoTitulo,
  enviando,
  onCancelar,
  onConfirmar,
}: EliminarCursoDialogProps) {
  return (
    <ConfirmDialog
      open={abierto}
      onOpenChange={(open) => {
        if (!open) {
          onCancelar()
        }
      }}
      tone="danger"
      title={`Eliminar ${cursoTitulo}`}
      description="Esta acción no se puede deshacer. El borrador se eliminará permanentemente."
      confirmLabel="Eliminar curso"
      loading={enviando}
      onConfirm={() => onConfirmar()}
    />
  )
}
