import { useCrearAsignacionesBatch } from "@/features/asignaciones/hooks/use-mutaciones-asignacion"
import { Button } from "@/shared/components/ui/button"
import { Dialog, DialogFooter } from "@/shared/components/ui/dialog"
import { Field } from "@/shared/components/ui/field"
import type { CrearAsignacionesBatchResponse } from "@nexott-learn/shared-types"
import { type FormEvent, useEffect, useState } from "react"

interface Props {
  readonly abierto: boolean
  readonly cursoId: string
  readonly onCambiarAbierto: (abierto: boolean) => void
  readonly onCompletado: (respuesta: CrearAsignacionesBatchResponse) => void
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const SEPARADOR_IDS_REGEX = /[\s,;]+/u

function parsearIds(raw: string): { ok: string[]; invalid: string[] } {
  const tokens = raw
    .split(SEPARADOR_IDS_REGEX)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
  const ok: string[] = []
  const invalid: string[] = []
  for (const t of tokens) {
    if (UUID_REGEX.test(t)) {
      ok.push(t)
    } else {
      invalid.push(t)
    }
  }
  return { ok, invalid }
}

export function DialogoAsignarBatch({ abierto, cursoId, onCambiarAbierto, onCompletado }: Props) {
  const [raw, setRaw] = useState("")
  const [error, setError] = useState<string | null>(null)
  const mutation = useCrearAsignacionesBatch()

  useEffect(() => {
    if (abierto) {
      setRaw("")
      setError(null)
    }
  }, [abierto])

  const { ok, invalid } = parsearIds(raw)

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (ok.length === 0) {
      setError("Añade al menos un colaborador UUID válido.")
      return
    }
    if (invalid.length > 0) {
      setError(`Hay ${invalid.length} entradas con formato inválido.`)
      return
    }
    try {
      const respuesta = await mutation.mutateAsync({
        cursoId,
        input: { colaboradorIds: ok },
      })
      onCompletado(respuesta)
      onCambiarAbierto(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo asignar")
    }
  }

  return (
    <Dialog
      abierto={abierto}
      onCambiarAbierto={onCambiarAbierto}
      titulo="Asignar colaboradores"
      descripcion="Pega hasta 100 UUIDs separados por comas, espacios o saltos de línea."
      ancho="md"
    >
      <form onSubmit={enviar} className="flex flex-col gap-4">
        <Field
          label="UUIDs de colaboradores"
          hint={ok.length > 0 ? `${ok.length} válidos detectados.` : undefined}
        >
          {(p) => (
            <textarea
              {...p}
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              rows={6}
              placeholder="b3a7…  b4f2…"
              className="w-full resize-none rounded-md border border-border-strong bg-surface px-3 py-2 font-mono text-input text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none"
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
            disabled={ok.length === 0}
            isLoading={mutation.isPending}
          >
            Asignar {ok.length > 0 ? `(${ok.length})` : ""}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
