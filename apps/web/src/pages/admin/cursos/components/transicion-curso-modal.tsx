import { ConfirmDialog } from "@/shared/ui/patterns/confirm-dialog"

interface TransicionCursoModalProps {
  readonly abierto: boolean
  readonly variante: "despublicar" | "cerrar"
  readonly cursoTitulo: string
  readonly enviando: boolean
  readonly onCerrar: () => void
  readonly onConfirmar: (motivo: string | undefined) => void | Promise<void>
}

export function TransicionCursoModal({
  abierto,
  variante,
  cursoTitulo,
  enviando,
  onCerrar,
  onConfirmar,
}: TransicionCursoModalProps) {
  const isClose = variante === "cerrar"
  return (
    <ConfirmDialog
      open={abierto}
      onOpenChange={(open) => {
        if (!open) {
          onCerrar()
        }
      }}
      tone="warning"
      title={isClose ? `Cerrar ${cursoTitulo}` : `Despublicar ${cursoTitulo}`}
      description={
        isClose
          ? "El curso pasará a estado cerrado. Las inscripciones activas se cerrarán y no se podrá editar el contenido."
          : "El curso volverá a estado borrador. Conservará todo su contenido y candidatos, pero dejará de estar activo."
      }
      confirmLabel={isClose ? "Cerrar curso" : "Despublicar"}
      reasonLabel="Motivo (opcional)"
      loading={enviando}
      onConfirm={(motivo) => onConfirmar(motivo)}
    />
  )
}
