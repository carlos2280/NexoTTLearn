import { ApiError } from "@/shared/api/api-error"
import { Button } from "@/shared/components/ui/button"
import { Dialog, DialogFooter } from "@/shared/components/ui/dialog"
import { Field } from "@/shared/components/ui/field"
import { Input } from "@/shared/components/ui/input"
import { Textarea } from "@/shared/components/ui/textarea"
import type { ClienteResponse } from "@nexott-learn/shared-types"
import { type FormEvent, useEffect, useState } from "react"
import {
  type ErroresClienteForm,
  MAX_NOMBRE_CLIENTE,
  validarCliente,
} from "./clientes-form-validar"

interface ClientesFormDialogProps {
  readonly abierto: boolean
  readonly onCambiarAbierto: (abierto: boolean) => void
  readonly cliente: ClienteResponse | null
  readonly enviando: boolean
  readonly onGuardar: (input: {
    readonly nombre: string
    readonly motivo: string | undefined
  }) => Promise<void>
}

export function ClientesFormDialog({
  abierto,
  onCambiarAbierto,
  cliente,
  enviando,
  onGuardar,
}: ClientesFormDialogProps) {
  const [nombre, setNombre] = useState("")
  const [motivo, setMotivo] = useState("")
  const [errores, setErrores] = useState<ErroresClienteForm>({})

  useEffect(() => {
    if (abierto) {
      setNombre(cliente?.nombre ?? "")
      setMotivo("")
      setErrores({})
    }
  }, [abierto, cliente])

  const esEditar = Boolean(cliente)
  const nombreHaCambiado = cliente ? nombre.trim() !== cliente.nombre : true
  const exigeMotivo = esEditar && nombreHaCambiado

  async function manejarSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const erroresValidacion = validarCliente(nombre, motivo, exigeMotivo)
    if (erroresValidacion) {
      setErrores(erroresValidacion)
      return
    }
    setErrores({})
    try {
      await onGuardar({
        nombre: nombre.trim(),
        motivo: exigeMotivo ? motivo.trim() : undefined,
      })
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setErrores({ nombre: "Ya existe un cliente con ese nombre." })
        return
      }
      setErrores({ general: err instanceof Error ? err.message : "No se pudo guardar" })
    }
  }

  return (
    <Dialog
      abierto={abierto}
      onCambiarAbierto={onCambiarAbierto}
      titulo={esEditar ? "Editar cliente" : "Nuevo cliente"}
      descripcion={
        esEditar
          ? "Cambia el nombre del cliente. Renombrar requiere motivo auditable."
          : "El cliente quedará activo y disponible para solicitar perfiles."
      }
    >
      <form onSubmit={manejarSubmit} className="flex flex-col gap-4">
        <Field label="Nombre" error={errores.nombre}>
          {(p) => (
            <Input
              {...p}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              maxLength={MAX_NOMBRE_CLIENTE}
              autoFocus={true}
              hasError={Boolean(errores.nombre)}
            />
          )}
        </Field>
        {exigeMotivo ? (
          <Field label="Motivo (obligatorio por cambio de nombre)" error={errores.motivo}>
            {(p) => (
              <Textarea
                {...p}
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                rows={2}
                placeholder="Por qué se renombra…"
                hasError={Boolean(errores.motivo)}
              />
            )}
          </Field>
        ) : null}
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
            {esEditar ? "Guardar cambios" : "Crear cliente"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
