import { Button } from "@/shared/components/ui/button"
import { Dialog, DialogFooter } from "@/shared/components/ui/dialog"
import { Field } from "@/shared/components/ui/field"
import type { AreaResponse } from "@nexott-learn/shared-types"
import { type FormEvent, useEffect, useState } from "react"

interface AreasEliminarDialogProps {
  readonly area: AreaResponse | null
  readonly abierto: boolean
  readonly onCambiarAbierto: (abierto: boolean) => void
  readonly onConfirmar: (motivo: string) => Promise<void>
  readonly enviando: boolean
}

export function AreasEliminarDialog({
  area,
  abierto,
  onCambiarAbierto,
  onConfirmar,
  enviando,
}: AreasEliminarDialogProps) {
  const [motivo, setMotivo] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (abierto) {
      setMotivo("")
      setError(null)
    }
  }, [abierto])

  const motivoValido = motivo.trim().length > 0

  async function manejarSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!motivoValido) {
      return
    }
    try {
      await onConfirmar(motivo.trim())
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar")
    }
  }

  return (
    <Dialog
      abierto={abierto}
      onCambiarAbierto={onCambiarAbierto}
      titulo="Eliminar área — confirmar"
      descripcion={
        area
          ? `«${area.nombre}» será eliminada. Las skills que cuelgan de ella requerirán reasignación manual.`
          : undefined
      }
    >
      <form onSubmit={manejarSubmit} className="flex flex-col gap-4">
        <Field label="Motivo (obligatorio)">
          {(p) => (
            <textarea
              {...p}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
              // biome-ignore lint/a11y/noAutofocus: P-01 de identidad visual exige autofocus en el textarea de motivo de confirmaciones destructivas.
              autoFocus={true}
              placeholder="Documenta por qué se elimina…"
              className="w-full resize-none rounded-md border border-border-strong bg-surface px-3 py-2 text-input text-text-primary placeholder:text-text-tertiary focus:border-accent focus:shadow-ring-accent-soft focus:outline-none"
            />
          )}
        </Field>
        {error ? (
          <p role="alert" className="text-body-sm text-danger-on-soft">
            {error}
          </p>
        ) : null}
        <p className="text-caption text-text-tertiary">Quedará registrado en el log auditable.</p>
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
            variant="danger"
            size="sm"
            type="submit"
            disabled={!motivoValido}
            isLoading={enviando}
          >
            Confirmar eliminación
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
