import { ApiError } from "@/shared/api/api-error"
import { Button } from "@/shared/components/ui/button"
import { Dialog, DialogFooter } from "@/shared/components/ui/dialog"
import { Field } from "@/shared/components/ui/field"
import { Input } from "@/shared/components/ui/input"
import { Select } from "@/shared/components/ui/select"
import type { AreaResponse } from "@nexott-learn/shared-types"
import { type FormEvent, useEffect, useState } from "react"

interface SkillsCrearDialogProps {
  readonly abierto: boolean
  readonly onCambiarAbierto: (abierto: boolean) => void
  readonly areas: readonly AreaResponse[]
  readonly enviando: boolean
  readonly onConfirmar: (input: { etiquetaVisible: string; areaId: string }) => Promise<void>
}

const MAX_ETIQUETA = 200

export function SkillsCrearDialog({
  abierto,
  onCambiarAbierto,
  areas,
  enviando,
  onConfirmar,
}: SkillsCrearDialogProps) {
  const [etiqueta, setEtiqueta] = useState("")
  const [areaId, setAreaId] = useState("")
  const [errorEtiqueta, setErrorEtiqueta] = useState<string | null>(null)
  const [errorArea, setErrorArea] = useState<string | null>(null)
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null)

  useEffect(() => {
    if (abierto) {
      setEtiqueta("")
      setAreaId(areas[0]?.id ?? "")
      setErrorEtiqueta(null)
      setErrorArea(null)
      setErrorGeneral(null)
    }
  }, [abierto, areas])

  async function manejarSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const limpia = etiqueta.trim()
    if (limpia.length === 0) {
      setErrorEtiqueta("El nombre es obligatorio.")
      return
    }
    if (!areaId) {
      setErrorArea("Selecciona un área.")
      return
    }
    setErrorEtiqueta(null)
    setErrorArea(null)
    setErrorGeneral(null)
    try {
      await onConfirmar({ etiquetaVisible: limpia, areaId })
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setErrorEtiqueta("Ya existe una skill con ese nombre en esa área.")
        return
      }
      setErrorGeneral(err instanceof Error ? err.message : "No se pudo crear la skill")
    }
  }

  return (
    <Dialog
      abierto={abierto}
      onCambiarAbierto={onCambiarAbierto}
      titulo="Nueva skill"
      descripcion="La skill quedará activa y disponible para usarse en cursos."
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
        <Field label="Área" error={errorArea ?? undefined}>
          {(p) => (
            <Select
              {...p}
              value={areaId}
              onChange={(e) => setAreaId(e.target.value)}
              hasError={Boolean(errorArea)}
            >
              <option value="" disabled={true}>
                Selecciona un área…
              </option>
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nombre}
                </option>
              ))}
            </Select>
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
            Crear skill
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
