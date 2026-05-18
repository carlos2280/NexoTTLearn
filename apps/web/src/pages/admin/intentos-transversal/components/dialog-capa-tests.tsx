import { Button } from "@/shared/components/ui/button"
import { Dialog, DialogFooter } from "@/shared/components/ui/dialog"
import { Field } from "@/shared/components/ui/field"
import { Input } from "@/shared/components/ui/input"
import { NOTA_MAX, NOTA_MIN, useFormCapaTests } from "../hooks/use-form-capa-tests"

interface DialogCapaTestsProps {
  readonly abierto: boolean
  readonly onCambiarAbierto: (abierto: boolean) => void
  readonly intentoId: string
  readonly notaActual: number | null
}

/**
 * Carga la capa de tests automatizados (E7). Inputs: nota 0-100 + textarea con
 * el JSON del runner (cobertura, tests pasados/fallidos, etc.).
 */
export function DialogCapaTests({
  abierto,
  onCambiarAbierto,
  intentoId,
  notaActual,
}: DialogCapaTestsProps) {
  const form = useFormCapaTests({
    intentoId,
    notaActual,
    abierto,
    onCerrar: () => onCambiarAbierto(false),
  })
  return (
    <Dialog
      abierto={abierto}
      onCambiarAbierto={onCambiarAbierto}
      titulo="Cargar capa de tests"
      descripcion="Resultados del runner de CI: cobertura, tests pasados/fallidos."
    >
      <form onSubmit={form.handleSubmit} className="flex flex-col gap-4">
        <Field
          label={`Nota (${NOTA_MIN}–${NOTA_MAX})`}
          error={form.errores.nota ?? undefined}
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
              value={form.nota}
              onChange={(e) => form.setNota(e.target.value)}
              hasError={form.errores.nota !== null}
            />
          )}
        </Field>
        <Field label="Detalle (JSON del runner)" error={form.errores.detalle ?? undefined}>
          {(attrs) => (
            <textarea
              {...attrs}
              value={form.detalleTxt}
              onChange={(e) => form.setDetalleTxt(e.target.value)}
              rows={6}
              placeholder='{"coverage": 0.82, "passed": 41, "failed": 0}'
              className="resize-vertical w-full rounded-md border border-border-strong bg-surface px-3 py-2 font-mono text-caption text-text-primary placeholder:text-text-tertiary focus:border-accent focus:shadow-ring-accent-soft focus:outline-none"
            />
          )}
        </Field>
        {form.errores.general ? (
          <p role="alert" className="text-body-sm text-danger-on-soft">
            {form.errores.general}
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
          <Button variant="primary" size="sm" type="submit" isLoading={form.enviando}>
            Cargar capa
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
