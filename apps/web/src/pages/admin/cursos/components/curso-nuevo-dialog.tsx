import { ApiError } from "@/shared/api/api-error"
import { Button } from "@/shared/components/ui/button"
import { Dialog, DialogFooter } from "@/shared/components/ui/dialog"
import type { ClienteResponse, CrearCursoInput } from "@nexott-learn/shared-types"
import { type FormEvent, useEffect, useState } from "react"
import { CursoNuevoCampos } from "./curso-nuevo-campos"
import {
  type CursoNuevoForm,
  type ErroresCursoNuevo,
  validarCursoNuevo,
} from "./curso-nuevo-form-validar"

interface CursoNuevoDialogProps {
  readonly abierto: boolean
  readonly onCambiarAbierto: (abierto: boolean) => void
  readonly clientes: readonly ClienteResponse[]
  readonly cargandoClientes: boolean
  readonly enviando: boolean
  readonly onCrear: (input: CrearCursoInput) => Promise<void>
}

const ESTADO_INICIAL: CursoNuevoForm = {
  titulo: "",
  clienteId: "",
  fechaInicio: "",
  fechaDeadline: "",
}

export function CursoNuevoDialog({
  abierto,
  onCambiarAbierto,
  clientes,
  cargandoClientes,
  enviando,
  onCrear,
}: CursoNuevoDialogProps) {
  const [form, setForm] = useState<CursoNuevoForm>(ESTADO_INICIAL)
  const [errores, setErrores] = useState<ErroresCursoNuevo>({})

  useEffect(() => {
    if (abierto) {
      setForm(ESTADO_INICIAL)
      setErrores({})
    }
  }, [abierto])

  async function manejarSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const erroresValidacion = validarCursoNuevo(form)
    if (erroresValidacion) {
      setErrores(erroresValidacion)
      return
    }
    setErrores({})
    try {
      await onCrear({
        titulo: form.titulo.trim(),
        clienteId: form.clienteId,
        fechaInicio: form.fechaInicio,
        fechaDeadline: form.fechaDeadline,
      })
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setErrores({ general: "Ya existe un curso con ese título para ese cliente." })
        return
      }
      setErrores({ general: err instanceof Error ? err.message : "No se pudo crear el curso." })
    }
  }

  return (
    <Dialog
      abierto={abierto}
      onCambiarAbierto={onCambiarAbierto}
      titulo="Nuevo curso"
      descripcion="El curso nace en estado BORRADOR. Podrás configurar contenido y publicarlo después."
    >
      <form onSubmit={manejarSubmit} className="flex flex-col gap-4">
        <CursoNuevoCampos
          form={form}
          onCambio={setForm}
          clientes={clientes}
          cargandoClientes={cargandoClientes}
          errores={errores}
        />
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
            Crear curso
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
