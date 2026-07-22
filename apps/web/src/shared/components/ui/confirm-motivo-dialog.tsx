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
  /** Si `false`, el motivo es opcional (label + submit se relajan). Default: true. */
  readonly motivoObligatorio?: boolean
  /**
   * Render opcional del error de `onConfirmar`. Si devuelve un nodo, se muestra
   * en lugar del mensaje plano; si devuelve `null`/`undefined`, cae al mensaje
   * plano. Permite pintar detalle estructurado (ej. precondiciones de publicar).
   */
  readonly renderError?: (err: unknown) => ReactNode
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
  motivoObligatorio = true,
  renderError,
}: ConfirmMotivoDialogProps) {
  const [motivo, setMotivo] = useState("")
  const [error, setError] = useState<unknown>(null)
  const [hayError, setHayError] = useState(false)

  useEffect(() => {
    if (abierto) {
      setMotivo("")
      setError(null)
      setHayError(false)
    }
  }, [abierto])

  const motivoValido = !motivoObligatorio || motivo.trim().length > 0

  async function manejarSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!motivoValido) {
      return
    }
    setError(null)
    setHayError(false)
    try {
      await onConfirmar(motivo.trim())
    } catch (err) {
      setError(err)
      setHayError(true)
    }
  }

  const errorPersonalizado = hayError ? renderError?.(error) : null
  const mensajeError =
    error instanceof Error && error.message ? error.message : "No se pudo completar la acción"

  return (
    <Dialog
      abierto={abierto}
      onCambiarAbierto={onCambiarAbierto}
      titulo={titulo}
      descripcion={descripcion}
    >
      <form onSubmit={manejarSubmit} className="flex flex-col gap-4">
        {children}
        <Field label={motivoObligatorio ? "Motivo (obligatorio)" : "Motivo (opcional)"}>
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
        {hayError ? (
          <div role="alert">
            {errorPersonalizado ?? (
              <p className="text-body-sm text-danger-on-soft">{mensajeError}</p>
            )}
          </div>
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
