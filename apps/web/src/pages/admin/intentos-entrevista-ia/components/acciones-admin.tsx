import { useAjustarIntentoEntrevistaIa } from "@/features/entrevista-ia/hooks/use-ajustar-intento-entrevista-ia"
import { useAnularIntentoEntrevistaIa } from "@/features/entrevista-ia/hooks/use-anular-intento-entrevista-ia"
import { Button } from "@/shared/components/ui/button"
import { ConfirmMotivoDialog } from "@/shared/components/ui/confirm-motivo-dialog"
import { Field } from "@/shared/components/ui/field"
import { Input } from "@/shared/components/ui/input"
import type { EstadoIntentoEntrevistaIa } from "@nexott-learn/shared-types"
import { type ChangeEvent, useState } from "react"

interface AccionesAdminProps {
  readonly intentoId: string
  readonly estado: EstadoIntentoEntrevistaIa
  readonly notaActual: number | null
}

const NOTA_MIN = 0
const NOTA_MAX = 100

export function AccionesAdmin({ intentoId, estado, notaActual }: AccionesAdminProps) {
  const [ajustarAbierto, setAjustarAbierto] = useState(false)
  const [anularAbierto, setAnularAbierto] = useState(false)
  const [notaTexto, setNotaTexto] = useState(notaActual !== null ? String(notaActual) : "")
  const [errorNota, setErrorNota] = useState<string | null>(null)

  const ajustarMutation = useAjustarIntentoEntrevistaIa()
  const anularMutation = useAnularIntentoEntrevistaIa()

  const intentoFinalizado = estado === "FINALIZADO"
  const motivoBloqueo = estado === "ANULADO" ? "Intento ya anulado" : "El intento aún no finalizó"

  function abrirAjustar() {
    setNotaTexto(notaActual !== null ? String(notaActual) : "")
    setErrorNota(null)
    setAjustarAbierto(true)
  }

  function manejarCambioNota(e: ChangeEvent<HTMLInputElement>) {
    setNotaTexto(e.target.value)
    setErrorNota(null)
  }

  async function confirmarAjustar(motivo: string) {
    const nota = Number(notaTexto)
    if (!Number.isInteger(nota) || nota < NOTA_MIN || nota > NOTA_MAX) {
      setErrorNota(`Ingresa un número entero entre ${NOTA_MIN} y ${NOTA_MAX}.`)
      throw new Error("Nota inválida")
    }
    await ajustarMutation.mutateAsync({ intentoId, notaAjustada: nota, motivo })
    setAjustarAbierto(false)
  }

  async function confirmarAnular(motivo: string) {
    await anularMutation.mutateAsync({ intentoId, motivo })
    setAnularAbierto(false)
  }

  return (
    <section className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-6">
      <div className="flex flex-col gap-1">
        <span className="nx-eyebrow text-text-tertiary">Acciones</span>
        <h2 className="text-h3 text-text-primary">Ajustar o anular</h2>
        <p className="text-body-sm text-text-secondary">
          {intentoFinalizado
            ? "El ajuste de nota recalcula las skills del colaborador. La anulación deja el intento sin efecto."
            : motivoBloqueo}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={abrirAjustar}
          disabled={!intentoFinalizado}
          title={intentoFinalizado ? undefined : motivoBloqueo}
        >
          Ajustar nota
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setAnularAbierto(true)}
          disabled={!intentoFinalizado}
          title={intentoFinalizado ? undefined : motivoBloqueo}
        >
          Anular intento
        </Button>
      </div>

      <ConfirmMotivoDialog
        abierto={ajustarAbierto}
        onCambiarAbierto={setAjustarAbierto}
        titulo="Ajustar nota global"
        descripcion="Cambiar manualmente la nota recalcula las skills del colaborador."
        textoConfirmar="Ajustar y recalcular"
        enviando={ajustarMutation.isPending}
        onConfirmar={confirmarAjustar}
      >
        <Field
          label={`Nota nueva (${NOTA_MIN}–${NOTA_MAX})`}
          error={errorNota ?? undefined}
          hint={notaActual !== null ? `Nota actual: ${notaActual}` : undefined}
        >
          {(attrs) => (
            <Input
              {...attrs}
              type="number"
              min={NOTA_MIN}
              max={NOTA_MAX}
              step={1}
              inputMode="numeric"
              value={notaTexto}
              onChange={manejarCambioNota}
              hasError={errorNota !== null}
            />
          )}
        </Field>
      </ConfirmMotivoDialog>

      <ConfirmMotivoDialog
        abierto={anularAbierto}
        onCambiarAbierto={setAnularAbierto}
        titulo="Anular intento"
        descripcion="El intento dejará de contar para las skills del colaborador. La acción no se puede deshacer."
        textoConfirmar="Anular intento"
        variante="danger"
        enviando={anularMutation.isPending}
        onConfirmar={confirmarAnular}
      />
    </section>
  )
}
