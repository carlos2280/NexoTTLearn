import { Button } from "@/shared/components/ui/button"
import { Dialog, DialogFooter } from "@/shared/components/ui/dialog"
import { Field } from "@/shared/components/ui/field"
import { Skeleton } from "@/shared/components/ui/skeleton"
import type {
  AreaResponse,
  PreviewCambioAreaResponse,
  SkillResponse,
} from "@nexott-learn/shared-types"
import { type FormEvent, useEffect, useState } from "react"
import { SkillsAreaSelector } from "./skills-area-selector"
import { SkillsPreviewImpacto } from "./skills-preview-impacto"

interface SkillsCambiarAreaDialogProps {
  readonly abierto: boolean
  readonly onCambiarAbierto: (abierto: boolean) => void
  readonly skill: SkillResponse | null
  readonly areas: readonly AreaResponse[]
  readonly preview: PreviewCambioAreaResponse | null
  readonly cargandoPreview: boolean
  readonly enviando: boolean
  readonly onPedirPreview: (areaDestinoId: string) => Promise<void>
  readonly onConfirmar: (areaDestinoId: string, motivo: string) => Promise<void>
}

export function SkillsCambiarAreaDialog({
  abierto,
  onCambiarAbierto,
  skill,
  areas,
  preview,
  cargandoPreview,
  enviando,
  onPedirPreview,
  onConfirmar,
}: SkillsCambiarAreaDialogProps) {
  const [areaDestinoId, setAreaDestinoId] = useState("")
  const [motivo, setMotivo] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (abierto && skill) {
      const primeraDistinta = areas.find((a) => a.id !== skill.areaId)
      setAreaDestinoId(primeraDistinta?.id ?? "")
      setMotivo("")
      setError(null)
    }
  }, [abierto, skill, areas])

  const motivoValido = motivo.trim().length > 0
  const seleccionValida = Boolean(areaDestinoId) && skill !== null && areaDestinoId !== skill.areaId

  async function pedirPreview() {
    if (!seleccionValida) {
      return
    }
    setError(null)
    try {
      await onPedirPreview(areaDestinoId)
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo calcular el impacto")
    }
  }

  async function manejarSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!(seleccionValida && motivoValido)) {
      return
    }
    try {
      await onConfirmar(areaDestinoId, motivo.trim())
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cambiar el área")
    }
  }

  return (
    <Dialog
      abierto={abierto}
      onCambiarAbierto={onCambiarAbierto}
      titulo="Cambiar área de la skill"
      descripcion={
        skill
          ? `Mueves «${skill.etiquetaVisible}» de un área a otra. Verás el impacto antes de confirmar.`
          : undefined
      }
      ancho="md"
    >
      <form onSubmit={manejarSubmit} className="flex flex-col gap-4">
        <SkillsAreaSelector
          skill={skill}
          areas={areas}
          areaDestinoId={areaDestinoId}
          onCambiarDestino={setAreaDestinoId}
        />
        {preview ? (
          <SkillsPreviewImpacto preview={preview} />
        ) : cargandoPreview ? (
          <Skeleton forma="bloque" className="h-24" />
        ) : (
          <Button
            variant="secondary"
            size="sm"
            type="button"
            onClick={pedirPreview}
            disabled={!seleccionValida}
          >
            Ver impacto
          </Button>
        )}
        <Field label="Motivo (obligatorio)">
          {(p) => (
            <textarea
              {...p}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={2}
              placeholder="Por qué cambias el área de esta skill…"
              className="w-full resize-none rounded-md border border-border-strong bg-surface px-3 py-2 text-input text-text-primary placeholder:text-text-tertiary focus:border-accent focus:shadow-ring-accent-soft focus:outline-none"
            />
          )}
        </Field>
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
          <Button
            variant="primary"
            size="sm"
            type="submit"
            disabled={!(seleccionValida && motivoValido && preview)}
            isLoading={enviando}
          >
            Confirmar cambio
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
