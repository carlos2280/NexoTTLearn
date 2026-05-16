import { Button } from "@/shared/components/ui/button"
import { Dialog, DialogFooter } from "@/shared/components/ui/dialog"
import type { ReactNode } from "react"
import { useState } from "react"

interface ConfirmDialogProps {
  readonly abierto: boolean
  readonly onCambiarAbierto: (abierto: boolean) => void
  readonly titulo: string
  readonly descripcion?: ReactNode
  readonly textoConfirmar: string
  readonly variante?: "primary" | "danger"
  readonly enviando: boolean
  readonly onConfirmar: () => Promise<void>
}

export function ConfirmDialog({
  abierto,
  onCambiarAbierto,
  titulo,
  descripcion,
  textoConfirmar,
  variante = "primary",
  enviando,
  onConfirmar,
}: ConfirmDialogProps) {
  const [error, setError] = useState<string | null>(null)

  async function manejarConfirmar() {
    setError(null)
    try {
      await onConfirmar()
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo completar la acción")
    }
  }

  return (
    <Dialog
      abierto={abierto}
      onCambiarAbierto={onCambiarAbierto}
      titulo={titulo}
      descripcion={descripcion}
    >
      <div className="flex flex-col gap-4">
        {error ? (
          <p role="alert" className="text-body-sm text-danger-on-soft">
            {error}
          </p>
        ) : null}
        <DialogFooter>
          <Button
            variant="secondary"
            size="sm"
            type="button"
            onClick={() => onCambiarAbierto(false)}
          >
            Cancelar
          </Button>
          <Button
            variant={variante}
            size="sm"
            type="button"
            onClick={manejarConfirmar}
            isLoading={enviando}
          >
            {textoConfirmar}
          </Button>
        </DialogFooter>
      </div>
    </Dialog>
  )
}
