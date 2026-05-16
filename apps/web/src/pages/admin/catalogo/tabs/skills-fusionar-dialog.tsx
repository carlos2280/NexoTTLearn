import { Button } from "@/shared/components/ui/button"
import { Dialog, DialogFooter } from "@/shared/components/ui/dialog"
import { Field } from "@/shared/components/ui/field"
import { Select } from "@/shared/components/ui/select"
import type { AreaResponse, SkillResponse } from "@nexott-learn/shared-types"
import { Combine } from "lucide-react"
import { type FormEvent, useEffect, useState } from "react"
import { SkillsResumen } from "./skills-resumen"

interface SkillsFusionarDialogProps {
  readonly abierto: boolean
  readonly onCambiarAbierto: (abierto: boolean) => void
  readonly skills: readonly SkillResponse[]
  readonly areas: readonly AreaResponse[]
  readonly skillSeleccionada: SkillResponse | null
  readonly enviando: boolean
  readonly onConfirmar: (ganadoraId: string, perdedoraId: string, motivo: string) => Promise<void>
}

function nombreArea(areas: readonly AreaResponse[], id: string): string {
  return areas.find((a) => a.id === id)?.nombre ?? "—"
}

export function SkillsFusionarDialog({
  abierto,
  onCambiarAbierto,
  skills,
  areas,
  skillSeleccionada,
  enviando,
  onConfirmar,
}: SkillsFusionarDialogProps) {
  const [ganadoraId, setGanadoraId] = useState("")
  const [perdedoraId, setPerdedoraId] = useState("")
  const [motivo, setMotivo] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (abierto) {
      setGanadoraId(skillSeleccionada?.id ?? "")
      setPerdedoraId("")
      setMotivo("")
      setError(null)
    }
  }, [abierto, skillSeleccionada])

  const ganadora = skills.find((s) => s.id === ganadoraId)
  const perdedora = skills.find((s) => s.id === perdedoraId)
  const distintas = Boolean(ganadoraId) && Boolean(perdedoraId) && ganadoraId !== perdedoraId
  const motivoValido = motivo.trim().length > 0

  async function manejarSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!(distintas && motivoValido)) {
      return
    }
    try {
      await onConfirmar(ganadoraId, perdedoraId, motivo.trim())
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo fusionar")
    }
  }

  return (
    <Dialog
      abierto={abierto}
      onCambiarAbierto={onCambiarAbierto}
      titulo="Fusionar skills"
      descripcion="La perdedora quedará ARCHIVADA y todas sus referencias pasarán a la ganadora."
      ancho="md"
    >
      <form onSubmit={manejarSubmit} className="flex flex-col gap-4">
        <Field label="Ganadora (la que se conserva)">
          {(p) => (
            <Select {...p} value={ganadoraId} onChange={(e) => setGanadoraId(e.target.value)}>
              <option value="" disabled={true}>
                Selecciona…
              </option>
              {skills.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.etiquetaVisible} · {nombreArea(areas, s.areaId)}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Perdedora (queda archivada)">
          {(p) => (
            <Select {...p} value={perdedoraId} onChange={(e) => setPerdedoraId(e.target.value)}>
              <option value="" disabled={true}>
                Selecciona…
              </option>
              {skills.map((s) => (
                <option key={s.id} value={s.id} disabled={s.id === ganadoraId}>
                  {s.etiquetaVisible} · {nombreArea(areas, s.areaId)}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <SkillsResumen skill={ganadora} areas={areas} etiqueta="Conservar" />
          <SkillsResumen skill={perdedora} areas={areas} etiqueta="Archivar" />
        </div>
        <div className="flex items-center gap-2 rounded-md border border-warning-soft bg-warning-soft px-3 py-2 text-body-sm text-warning-on-soft">
          <Combine className="h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden={true} />
          <span>La operación no se puede deshacer.</span>
        </div>
        <Field label="Motivo (obligatorio)">
          {(p) => (
            <textarea
              {...p}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={2}
              placeholder="Por qué se fusionan…"
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
            disabled={!(distintas && motivoValido)}
            isLoading={enviando}
          >
            Fusionar
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
