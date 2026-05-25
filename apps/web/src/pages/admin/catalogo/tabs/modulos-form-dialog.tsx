import { ApiError } from "@/shared/api/api-error"
import { Button } from "@/shared/components/ui/button"
import { Dialog, DialogFooter } from "@/shared/components/ui/dialog"
import { Field } from "@/shared/components/ui/field"
import { Input } from "@/shared/components/ui/input"
import { Textarea } from "@/shared/components/ui/textarea"
import type { ModuloResponse } from "@nexott-learn/shared-types"
import { type FormEvent, useEffect, useState } from "react"
import {
  type ErroresModuloForm,
  MAX_DESCRIPCION_MODULO,
  MAX_TITULO_MODULO,
  validarModulo,
} from "./modulos-form-validar"

interface ModulosFormDialogProps {
  readonly abierto: boolean
  readonly onCambiarAbierto: (abierto: boolean) => void
  readonly modulo: ModuloResponse | null
  readonly enviando: boolean
  readonly onGuardar: (input: {
    readonly titulo: string
    readonly descripcion: string | null
    readonly motivo: string | undefined
  }) => Promise<void>
}

export function ModulosFormDialog({
  abierto,
  onCambiarAbierto,
  modulo,
  enviando,
  onGuardar,
}: ModulosFormDialogProps) {
  const [titulo, setTitulo] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [motivo, setMotivo] = useState("")
  const [errores, setErrores] = useState<ErroresModuloForm>({})

  useEffect(() => {
    if (abierto) {
      setTitulo(modulo?.titulo ?? "")
      setDescripcion(modulo?.descripcion ?? "")
      setMotivo("")
      setErrores({})
    }
  }, [abierto, modulo])

  const esEditar = Boolean(modulo)
  const tituloHaCambiado = modulo ? titulo.trim() !== modulo.titulo : true
  const exigeMotivo = esEditar && tituloHaCambiado

  async function manejarSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const erroresValidacion = validarModulo(titulo, motivo, exigeMotivo)
    if (erroresValidacion) {
      setErrores(erroresValidacion)
      return
    }
    setErrores({})
    try {
      const desc = descripcion.trim()
      await onGuardar({
        titulo: titulo.trim(),
        descripcion: desc.length === 0 ? null : desc,
        motivo: exigeMotivo ? motivo.trim() : undefined,
      })
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setErrores({ titulo: "Ya existe un módulo con ese título." })
        return
      }
      setErrores({ general: err instanceof Error ? err.message : "No se pudo guardar" })
    }
  }

  return (
    <Dialog
      abierto={abierto}
      onCambiarAbierto={onCambiarAbierto}
      titulo={esEditar ? "Editar módulo" : "Nuevo módulo"}
      descripcion={
        esEditar
          ? "Cambia el título o la descripción. Cambiar el título requiere motivo."
          : "El módulo quedará activo y disponible para asociarse a cursos."
      }
    >
      <form onSubmit={manejarSubmit} className="flex flex-col gap-4">
        <Field label="Título" error={errores.titulo}>
          {(p) => (
            <Input
              {...p}
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              maxLength={MAX_TITULO_MODULO}
              autoFocus={true}
              hasError={Boolean(errores.titulo)}
            />
          )}
        </Field>
        <Field
          label="Descripción"
          hint={`${descripcion.length}/${MAX_DESCRIPCION_MODULO} caracteres`}
        >
          {(p) => (
            <Textarea
              {...p}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              maxLength={MAX_DESCRIPCION_MODULO}
              rows={4}
            />
          )}
        </Field>
        {exigeMotivo ? (
          <Field label="Motivo (obligatorio por cambio de título)" error={errores.motivo}>
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
            {esEditar ? "Guardar cambios" : "Crear módulo"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
