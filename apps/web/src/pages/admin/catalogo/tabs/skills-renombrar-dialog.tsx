import { ApiError } from "@/shared/api/api-error"
import { Button } from "@/shared/components/ui/button"
import { Dialog, DialogFooter } from "@/shared/components/ui/dialog"
import { Field } from "@/shared/components/ui/field"
import { Input } from "@/shared/components/ui/input"
import type { SkillResponse } from "@nexott-learn/shared-types"
import { type FormEvent, useEffect, useState } from "react"

interface SkillsRenombrarDialogProps {
  readonly abierto: boolean
  readonly onCambiarAbierto: (abierto: boolean) => void
  readonly skill: SkillResponse | null
  readonly enviando: boolean
  readonly onConfirmar: (input: { etiquetaVisible: string; motivo: string }) => Promise<void>
}

const MAX_ETIQUETA = 200

export function SkillsRenombrarDialog({
  abierto,
  onCambiarAbierto,
  skill,
  enviando,
  onConfirmar,
}: SkillsRenombrarDialogProps) {
  const [etiqueta, setEtiqueta] = useState("")
  const [motivo, setMotivo] = useState("")
  const [errorEtiqueta, setErrorEtiqueta] = useState<string | null>(null)
  const [errorMotivo, setErrorMotivo] = useState<string | null>(null)
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null)

  useEffect(() => {
    if (abierto) {
      setEtiqueta(skill?.etiquetaVisible ?? "")
      setMotivo("")
      setErrorEtiqueta(null)
      setErrorMotivo(null)
      setErrorGeneral(null)
    }
  }, [abierto, skill])

  async function manejarSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const limpia = etiqueta.trim()
    if (limpia.length === 0) {
      setErrorEtiqueta("El nombre es obligatorio.")
      return
    }
    if (motivo.trim().length === 0) {
      setErrorMotivo("El motivo es obligatorio para renombrar.")
      return
    }
    setErrorEtiqueta(null)
    setErrorMotivo(null)
    setErrorGeneral(null)
    try {
      await onConfirmar({ etiquetaVisible: limpia, motivo: motivo.trim() })
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setErrorEtiqueta("Ya existe una skill con ese nombre en esa área.")
        return
      }
      setErrorGeneral(err instanceof Error ? err.message : "No se pudo renombrar")
    }
  }

  return (
    <Dialog
      abierto={abierto}
      onCambiarAbierto={onCambiarAbierto}
      titulo="Renombrar skill"
      descripcion="Cambia el nombre visible. Las referencias en cursos se mantienen."
    >
      <form onSubmit={manejarSubmit} className="flex flex-col gap-4">
        <Field label="Nombre visible" error={errorEtiqueta ?? undefined}>
          {(p) => (
            <Input
              {...p}
              value={etiqueta}
              onChange={(e) => setEtiqueta(e.target.value)}
              maxLength={MAX_ETIQUETA}
              autoFocus={true}
              hasError={Boolean(errorEtiqueta)}
            />
          )}
        </Field>
        <Field label="Motivo (obligatorio)" error={errorMotivo ?? undefined}>
          {(p) => (
            <textarea
              {...p}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={2}
              placeholder="Por qué se renombra…"
              className="w-full resize-none rounded-md border border-border-strong bg-surface px-3 py-2 text-input text-text-primary placeholder:text-text-tertiary focus:border-accent focus:shadow-ring-accent-soft focus:outline-none"
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
            Guardar cambios
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
