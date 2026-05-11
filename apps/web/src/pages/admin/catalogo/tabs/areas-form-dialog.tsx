import { ApiError } from "@/shared/api/api-error"
import { Button } from "@/shared/components/ui/button"
import { Dialog, DialogFooter } from "@/shared/components/ui/dialog"
import { Field } from "@/shared/components/ui/field"
import { Input } from "@/shared/components/ui/input"
import type { AreaResponse, CrearAreaInput } from "@nexott-learn/shared-types"
import { type FormEvent, useEffect, useState } from "react"

interface AreasFormDialogProps {
  readonly abierto: boolean
  readonly onCambiarAbierto: (abierto: boolean) => void
  readonly area: AreaResponse | null
  readonly onGuardar: (input: CrearAreaInput) => Promise<void>
  readonly enviando: boolean
}

interface ErroresForm {
  readonly nombre?: string
  readonly general?: string
}

const MAX_NOMBRE = 80
const MAX_DESCRIPCION = 280

export function AreasFormDialog({
  abierto,
  onCambiarAbierto,
  area,
  onGuardar,
  enviando,
}: AreasFormDialogProps) {
  const [nombre, setNombre] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [errores, setErrores] = useState<ErroresForm>({})

  useEffect(() => {
    if (abierto) {
      setNombre(area?.nombre ?? "")
      setDescripcion(area?.descripcion ?? "")
      setErrores({})
    }
  }, [abierto, area])

  async function manejarSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const valor = nombre.trim()
    if (valor.length === 0) {
      setErrores({ nombre: "El nombre es obligatorio." })
      return
    }
    if (valor.length > MAX_NOMBRE) {
      setErrores({ nombre: `Máximo ${MAX_NOMBRE} caracteres.` })
      return
    }
    setErrores({})
    try {
      await onGuardar({
        nombre: valor,
        descripcion: descripcion.trim().length === 0 ? undefined : descripcion.trim(),
      })
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setErrores({ nombre: "Ya existe un área con ese nombre." })
        return
      }
      const mensaje = err instanceof Error ? err.message : "No se pudo guardar"
      setErrores({ general: mensaje })
    }
  }

  return (
    <Dialog
      abierto={abierto}
      onCambiarAbierto={onCambiarAbierto}
      titulo={area ? "Editar área" : "Nueva área"}
      descripcion={
        area ? "Cambia el nombre o la descripción del área." : "Agrupa skills bajo un área."
      }
    >
      <form onSubmit={manejarSubmit} className="flex flex-col gap-4">
        <Field label="Nombre" error={errores.nombre}>
          {(p) => (
            <Input
              {...p}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              maxLength={MAX_NOMBRE}
              autoFocus={true}
              hasError={Boolean(errores.nombre)}
            />
          )}
        </Field>
        <Field label="Descripción" hint={`${descripcion.length}/${MAX_DESCRIPCION} caracteres`}>
          {(p) => (
            <textarea
              {...p}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              maxLength={MAX_DESCRIPCION}
              rows={3}
              className="w-full resize-none rounded-md border border-border-strong bg-surface px-3 py-2 text-input text-text-primary placeholder:text-text-tertiary focus:border-accent focus:shadow-ring-accent-soft focus:outline-none"
            />
          )}
        </Field>
        {errores.general ? (
          <p role="alert" className="text-body-sm text-danger-on-soft">
            {errores.general}
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
            {area ? "Guardar cambios" : "Crear área"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
