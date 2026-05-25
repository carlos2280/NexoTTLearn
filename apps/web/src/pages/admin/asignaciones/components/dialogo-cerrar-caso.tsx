import { useCerrarCaso } from "@/features/asignaciones/hooks/use-mutaciones-asignacion"
import { Button } from "@/shared/components/ui/button"
import { Dialog, DialogFooter } from "@/shared/components/ui/dialog"
import { Field } from "@/shared/components/ui/field"
import type {
  Asignacion,
  CerrarCasoAsignadoRequest,
  CerrarCasoVoluntarioRequest,
} from "@nexott-learn/shared-types"
import { type FormEvent, useEffect, useState } from "react"

interface Props {
  readonly abierto: boolean
  readonly asignacion: Asignacion | undefined
  readonly onCambiarAbierto: (abierto: boolean) => void
  /**
   * Cuando es `false` el copy del diálogo refleja que el cierre es el final
   * del proceso (no hay fase posterior de "entrevista cliente"): el título
   * pasa a "Cerrar curso" y los botones a "Aprobado / No aprobado". El
   * backend sigue persistiendo APTO/NO_APTO como hasta ahora.
   */
  readonly tieneEntregaACliente: boolean
}

type Resultado = "APTO" | "NO_APTO"

function construirBody(
  esAsignado: boolean,
  resultado: Resultado,
  observaciones: string,
): CerrarCasoAsignadoRequest | CerrarCasoVoluntarioRequest {
  const obsTrim = observaciones.trim()
  const obs = obsTrim ? { observacionesAdmin: obsTrim } : {}
  if (esAsignado) {
    return { resultado, ...obs }
  }
  return obs
}

export function DialogoCerrarCaso({
  abierto,
  asignacion,
  onCambiarAbierto,
  tieneEntregaACliente,
}: Props) {
  const [resultado, setResultado] = useState<Resultado>("APTO")
  const [observaciones, setObservaciones] = useState("")
  const [motivo, setMotivo] = useState("")
  const [error, setError] = useState<string | null>(null)
  const mutation = useCerrarCaso()

  useEffect(() => {
    if (abierto) {
      setResultado("APTO")
      setObservaciones("")
      setMotivo("")
      setError(null)
    }
  }, [abierto])

  if (!asignacion) {
    return null
  }
  const esAsignado = asignacion.rol === "ASIGNADO"

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!asignacion) {
      return
    }
    try {
      await mutation.mutateAsync({
        asignacionId: asignacion.id,
        body: construirBody(esAsignado, resultado, observaciones),
        idempotencyKey: crypto.randomUUID(),
        motivo: motivo.trim() || undefined,
      })
      onCambiarAbierto(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cerrar")
    }
  }

  const tituloAsignado = tieneEntregaACliente ? "Cerrar caso" : "Cerrar curso"
  const etiquetaApto = tieneEntregaACliente ? "Apto" : "Aprobado"
  const etiquetaNoApto = tieneEntregaACliente ? "No apto" : "No aprobado"

  return (
    <Dialog
      abierto={abierto}
      onCambiarAbierto={onCambiarAbierto}
      titulo={esAsignado ? tituloAsignado : "Cerrar como completado"}
      descripcion={`Colaborador: ${asignacion.colaborador.nombreCompleto}`}
      ancho="md"
    >
      <form onSubmit={enviar} className="flex flex-col gap-4">
        {esAsignado ? (
          <Field label="Resultado">
            {(p) => (
              <div {...p} className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={resultado === "APTO" ? "primary" : "secondary"}
                  onClick={() => setResultado("APTO")}
                >
                  {etiquetaApto}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={resultado === "NO_APTO" ? "danger" : "secondary"}
                  onClick={() => setResultado("NO_APTO")}
                >
                  {etiquetaNoApto}
                </Button>
              </div>
            )}
          </Field>
        ) : null}
        <Field label="Observaciones admin (opcional)">
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
        <Field label="Motivo (opcional, para auditoría)">
          {(p) => (
            <input
              {...p}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              type="text"
              className="w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-input text-text-primary focus:border-accent focus:outline-none"
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
            variant={esAsignado && resultado === "NO_APTO" ? "danger" : "primary"}
            size="sm"
            type="submit"
            isLoading={mutation.isPending}
          >
            {esAsignado ? tituloAsignado : "Cerrar"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
