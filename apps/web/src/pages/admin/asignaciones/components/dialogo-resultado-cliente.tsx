import { useRegistrarResultadoEntrevistaCliente } from "@/features/asignaciones/hooks/use-mutaciones-asignacion"
import { Button } from "@/shared/components/ui/button"
import { Dialog, DialogFooter } from "@/shared/components/ui/dialog"
import { Field } from "@/shared/components/ui/field"
import type {
  Asignacion,
  PatchResultadoEntrevistaRequest,
  ResultadoEntrevistaCliente,
} from "@nexott-learn/shared-types"
import { type FormEvent, useEffect, useState } from "react"

interface Props {
  readonly abierto: boolean
  readonly asignacion: Asignacion | undefined
  readonly onCambiarAbierto: (abierto: boolean) => void
}

const OPCIONES: readonly {
  readonly valor: ResultadoEntrevistaCliente
  readonly etiqueta: string
}[] = [
  { valor: "PASO", etiqueta: "Pasó" },
  { valor: "NO_PASO", etiqueta: "No pasó" },
  { valor: "PENDIENTE", etiqueta: "Pendiente" },
]

export function DialogoResultadoCliente({ abierto, asignacion, onCambiarAbierto }: Props) {
  const [resultado, setResultado] = useState<ResultadoEntrevistaCliente>("PASO")
  const [observaciones, setObservaciones] = useState("")
  const [fecha, setFecha] = useState("")
  const [error, setError] = useState<string | null>(null)
  const mutation = useRegistrarResultadoEntrevistaCliente()

  useEffect(() => {
    if (abierto) {
      setResultado("PASO")
      setObservaciones("")
      setFecha("")
      setError(null)
    }
  }, [abierto])

  if (!asignacion) {
    return null
  }

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!asignacion) {
      return
    }
    try {
      const obsTrim = observaciones.trim()
      const input: PatchResultadoEntrevistaRequest = {
        resultadoEntrevistaCliente: resultado,
        ...(obsTrim ? { observacionesCliente: obsTrim } : {}),
        ...(fecha ? { fechaEntrevistaCliente: fecha } : {}),
      }
      await mutation.mutateAsync({ asignacionId: asignacion.id, input })
      onCambiarAbierto(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo registrar")
    }
  }

  return (
    <Dialog
      abierto={abierto}
      onCambiarAbierto={onCambiarAbierto}
      titulo="Resultado entrevista cliente"
      descripcion={`Colaborador: ${asignacion.colaborador.nombreCompleto}`}
      ancho="md"
    >
      <form onSubmit={enviar} className="flex flex-col gap-4">
        <Field label="Resultado">
          {(p) => (
            <div {...p} className="flex flex-wrap gap-2">
              {OPCIONES.map((o) => (
                <Button
                  key={o.valor}
                  type="button"
                  size="sm"
                  variant={resultado === o.valor ? "primary" : "secondary"}
                  onClick={() => setResultado(o.valor)}
                >
                  {o.etiqueta}
                </Button>
              ))}
            </div>
          )}
        </Field>
        <Field label="Fecha entrevista (opcional)">
          {(p) => (
            <input
              {...p}
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="rounded-md border border-border-strong bg-surface px-3 py-2 text-input text-text-primary focus:border-accent focus:outline-none"
            />
          )}
        </Field>
        <Field label="Observaciones cliente (opcional)">
          {(p) => (
            <textarea
              {...p}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              rows={3}
              maxLength={2000}
              className="w-full resize-none rounded-md border border-border-strong bg-surface px-3 py-2 text-input text-text-primary focus:border-accent focus:outline-none"
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
          <Button variant="primary" size="sm" type="submit" isLoading={mutation.isPending}>
            Guardar
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
