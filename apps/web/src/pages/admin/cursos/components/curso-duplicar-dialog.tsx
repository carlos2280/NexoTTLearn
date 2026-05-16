import { Button } from "@/shared/components/ui/button"
import { Dialog, DialogFooter } from "@/shared/components/ui/dialog"
import { Field } from "@/shared/components/ui/field"
import { Input } from "@/shared/components/ui/input"
import { Textarea } from "@/shared/components/ui/textarea"
import type { CursoResumen } from "@nexott-learn/shared-types"
import { type FormEvent, useEffect, useState } from "react"

interface CursoDuplicarDialogProps {
  readonly abierto: boolean
  readonly onCambiarAbierto: (abierto: boolean) => void
  readonly curso: CursoResumen | null
  readonly enviando: boolean
  readonly onConfirmar: (input: { tituloNuevo: string; motivo: string }) => Promise<void>
}

export function CursoDuplicarDialog({
  abierto,
  onCambiarAbierto,
  curso,
  enviando,
  onConfirmar,
}: CursoDuplicarDialogProps) {
  const [titulo, setTitulo] = useState("")
  const [motivo, setMotivo] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (abierto && curso) {
      setTitulo(`${curso.titulo} (copia)`)
      setMotivo("")
      setError(null)
    }
  }, [abierto, curso])

  const puedeEnviar = titulo.trim().length > 0 && motivo.trim().length > 0

  async function manejarSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!puedeEnviar) {
      return
    }
    try {
      await onConfirmar({ tituloNuevo: titulo.trim(), motivo: motivo.trim() })
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo duplicar el curso.")
    }
  }

  return (
    <Dialog
      abierto={abierto}
      onCambiarAbierto={onCambiarAbierto}
      titulo="Duplicar curso"
      descripcion="Se creará una copia en BORRADOR con la misma configuración. Los módulos archivados del curso fuente no se copian."
    >
      <form onSubmit={manejarSubmit} className="flex flex-col gap-4">
        <Field label="Título de la copia">
          {(p) => (
            <Input
              {...p}
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              maxLength={200}
              autoFocus={true}
            />
          )}
        </Field>
        <Field label="Motivo (obligatorio)">
          {(p) => (
            <Textarea
              {...p}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
              placeholder="Documenta por qué se duplica…"
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
            variant="primary"
            size="sm"
            type="submit"
            disabled={!puedeEnviar}
            isLoading={enviando}
          >
            Duplicar curso
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
