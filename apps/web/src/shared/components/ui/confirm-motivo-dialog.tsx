import { Button } from "@/shared/components/ui/button"
import { Dialog, DialogFooter } from "@/shared/components/ui/dialog"
import { Field } from "@/shared/components/ui/field"
import { type FormEvent, type ReactNode, useEffect, useState } from "react"

interface ConfirmMotivoDialogProps {
  readonly abierto: boolean
  readonly onCambiarAbierto: (abierto: boolean) => void
  readonly titulo: string
  readonly descripcion?: ReactNode
  readonly textoConfirmar: string
  readonly variante?: "primary" | "danger"
  readonly placeholderMotivo?: string
  readonly enviando: boolean
  readonly onConfirmar: (motivo: string) => Promise<void>
  readonly children?: ReactNode
}

export function ConfirmMotivoDialog({
  abierto,
  onCambiarAbierto,
  titulo,
  descripcion,
  textoConfirmar,
  variante = "primary",
  placeholderMotivo = "Documenta por qué…",
  enviando,
  onConfirmar,
  children,
}: ConfirmMotivoDialogProps) {
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
      <form onSubmit={manejarSubmit} className="flex flex-col gap-4">
        {children}
        <Field label="Motivo (obligatorio)">
          {(p) => (
            <textarea
              {...p}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
              // biome-ignore lint/a11y/noAutofocus: P-01 — autofocus obligatorio en motivo de acción auditable.
              autoFocus={true}
              placeholder={placeholderMotivo}
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
            variant={variante}
            size="sm"
            type="submit"
            disabled={!motivoValido}
            isLoading={enviando}
          >
            {textoConfirmar}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
