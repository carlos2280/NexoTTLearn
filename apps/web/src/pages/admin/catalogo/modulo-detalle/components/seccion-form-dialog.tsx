import { ApiError } from "@/shared/api/api-error"
import { Button } from "@/shared/components/ui/button"
import { Dialog, DialogFooter } from "@/shared/components/ui/dialog"
import { Field } from "@/shared/components/ui/field"
import { Input } from "@/shared/components/ui/input"
import type { SeccionResponse } from "@nexott-learn/shared-types"
import { type FormEvent, useEffect, useState } from "react"

const MAX_TITULO = 200

interface SeccionFormDialogProps {
  readonly abierto: boolean
  readonly onCambiarAbierto: (abierto: boolean) => void
  readonly seccion: SeccionResponse | null
  readonly enviando: boolean
  readonly onGuardar: (titulo: string) => Promise<void>
}

export function SeccionFormDialog({
  abierto,
  onCambiarAbierto,
  seccion,
  enviando,
  onGuardar,
}: SeccionFormDialogProps) {
  const [titulo, setTitulo] = useState("")
  const [errorTitulo, setErrorTitulo] = useState<string | null>(null)
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null)

  useEffect(() => {
    if (abierto) {
      setTitulo(seccion?.titulo ?? "")
      setErrorTitulo(null)
      setErrorGeneral(null)
    }
  }, [abierto, seccion])

  const esEditar = Boolean(seccion)

  async function manejarSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorTitulo(null)
    setErrorGeneral(null)
    const t = titulo.trim()
    if (t.length === 0) {
      setErrorTitulo("El título es obligatorio.")
      return
    }
    if (t.length > MAX_TITULO) {
      setErrorTitulo(`Máximo ${MAX_TITULO} caracteres.`)
      return
    }
    try {
      await onGuardar(t)
    } catch (err) {
      setErrorGeneral(err instanceof ApiError ? err.message : "No se pudo guardar.")
    }
  }

  return (
    <Dialog
      abierto={abierto}
      onCambiarAbierto={onCambiarAbierto}
      titulo={esEditar ? "Editar sección" : "Nueva sección"}
      descripcion={
        esEditar
          ? "Cambia el título de la sección. El orden se mantiene."
          : "La sección queda añadida al final del módulo. Puedes reordenarla después."
      }
    >
      <form onSubmit={manejarSubmit} className="flex flex-col gap-4">
        <Field label="Título" error={errorTitulo ?? undefined}>
          {(p) => (
            <Input
              {...p}
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              maxLength={MAX_TITULO}
              autoFocus={true}
              hasError={Boolean(errorTitulo)}
              placeholder="Ej. Sintaxis básica de Python"
            />
          )}
        </Field>
        {errorGeneral ? (
          <p role="alert" className="text-body-sm text-danger-on-soft">
            {errorGeneral}
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
          <Button variant="primary" size="sm" type="submit" isLoading={enviando}>
            {esEditar ? "Guardar cambios" : "Crear sección"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
