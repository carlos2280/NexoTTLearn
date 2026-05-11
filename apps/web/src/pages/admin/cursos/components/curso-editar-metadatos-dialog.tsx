import { ApiError } from "@/shared/api/api-error"
import { Button } from "@/shared/components/ui/button"
import { Dialog, DialogFooter } from "@/shared/components/ui/dialog"
import type {
  ActualizarCursoInput,
  ClienteResponse,
  CursoDetalle,
} from "@nexott-learn/shared-types"
import { type FormEvent, useEffect, useState } from "react"
import { CursoEditarMetadatosCampos } from "./curso-editar-metadatos-campos"
import {
  type FormMetadatos,
  calcularCambiosMetadatos,
  metadatosDesdeDetalle,
} from "./curso-editar-metadatos-validar"

interface CursoEditarMetadatosDialogProps {
  readonly abierto: boolean
  readonly onCambiarAbierto: (abierto: boolean) => void
  readonly curso: CursoDetalle | null
  readonly clientes: readonly ClienteResponse[]
  readonly enviando: boolean
  readonly onGuardar: (input: ActualizarCursoInput, motivo: string | undefined) => Promise<void>
}

const FORM_VACIO: FormMetadatos = {
  titulo: "",
  clienteId: "",
  fechaInicio: "",
  fechaDeadline: "",
}

export function CursoEditarMetadatosDialog({
  abierto,
  onCambiarAbierto,
  curso,
  clientes,
  enviando,
  onGuardar,
}: CursoEditarMetadatosDialogProps) {
  const [form, setForm] = useState<FormMetadatos>(FORM_VACIO)
  const [motivo, setMotivo] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (abierto && curso) {
      setForm(metadatosDesdeDetalle(curso))
      setMotivo("")
      setError(null)
    }
  }, [abierto, curso])

  if (!curso) {
    return null
  }
  const exigeMotivo = curso.estado !== "BORRADOR"

  async function manejarSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    if (!curso) {
      return
    }
    const cambios = calcularCambiosMetadatos(curso, form)
    if (!cambios) {
      setError("No has cambiado ningún campo.")
      return
    }
    if (exigeMotivo && motivo.trim().length === 0) {
      setError("Editar un curso no-borrador requiere motivo.")
      return
    }
    try {
      await onGuardar(cambios, exigeMotivo ? motivo.trim() : undefined)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo guardar.")
    }
  }

  return (
    <Dialog
      abierto={abierto}
      onCambiarAbierto={onCambiarAbierto}
      titulo="Editar curso"
      descripcion="Cambia los datos generales. Pesos, áreas, skills y módulos se editan desde sus propias secciones."
    >
      <form onSubmit={manejarSubmit} className="flex flex-col gap-4">
        <CursoEditarMetadatosCampos
          form={form}
          onCambio={setForm}
          clientes={clientes}
          exigeMotivo={exigeMotivo}
          motivo={motivo}
          onMotivo={setMotivo}
        />
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
          <Button variant="primary" size="sm" type="submit" isLoading={enviando}>
            Guardar cambios
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
