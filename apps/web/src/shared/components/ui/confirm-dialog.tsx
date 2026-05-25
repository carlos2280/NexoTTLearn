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

  const acciones = (
    <>
      <Button variant="secondary" size="sm" type="button" onClick={() => onCambiarAbierto(false)}>
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
    </>
  )

  return (
    <Dialog
      abierto={abierto}
      onCambiarAbierto={onCambiarAbierto}
      titulo={titulo}
      descripcion={descripcion}
    >
      {error ? (
        <div className="flex flex-col gap-4">
          <p role="alert" className="text-body-sm text-danger-on-soft">
            {error}
          </p>
          <DialogFooter>{acciones}</DialogFooter>
        </div>
      ) : (
        // Sin error: colapsa el padding interno del Dialog (`-my-5`) y omite
        // el `border-t` del footer para que quede UNA sola separacion limpia
        // pegada bajo la cabecera, en vez de un bloque vacio entre dos lineas.
        <div className="-my-5">
          <footer className="-mx-6 flex items-center justify-end gap-2 bg-subtle/40 px-6 py-3">
            {acciones}
          </footer>
        </div>
      )}
    </Dialog>
  )
}
