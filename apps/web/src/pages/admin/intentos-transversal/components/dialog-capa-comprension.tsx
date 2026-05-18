import { Button } from "@/shared/components/ui/button"
import { Dialog, DialogFooter } from "@/shared/components/ui/dialog"
import { Field } from "@/shared/components/ui/field"
import { Input } from "@/shared/components/ui/input"
import { Plus } from "lucide-react"
import { NOTA_MAX, NOTA_MIN, TURNOS_MAX } from "../hooks/comprension-validar"
import { useFormCapaComprension } from "../hooks/use-form-capa-comprension"
import { TurnoComprensionItem } from "./turno-comprension-item"

interface DialogCapaComprensionProps {
  readonly abierto: boolean
  readonly onCambiarAbierto: (abierto: boolean) => void
  readonly intentoId: string
  readonly notaActual: number | null
}

/**
 * Carga la capa de comprension (E9). Inputs: nota 0-100 + transcripcion de
 * la mini-entrevista IA como lista dinamica de turnos (rol + mensaje).
 */
export function DialogCapaComprension({
  abierto,
  onCambiarAbierto,
  intentoId,
  notaActual,
}: DialogCapaComprensionProps) {
  const form = useFormCapaComprension({
    intentoId,
    notaActual,
    abierto,
    onCerrar: () => onCambiarAbierto(false),
  })
  return (
    <Dialog
      abierto={abierto}
      onCambiarAbierto={onCambiarAbierto}
      titulo="Cargar capa de comprensión"
      descripcion="Mini-entrevista IA sobre las decisiones del entregable."
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
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <span className="text-body-sm text-text-secondary">Turnos de la entrevista</span>
            <span className="tabular text-caption text-text-tertiary">
              {form.turnos.length} / {TURNOS_MAX}
            </span>
          </div>
          <ul className="flex flex-col gap-2 rounded-md border border-border bg-subtle/40 p-3">
            {form.turnos.map((turno, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: el orden + rol son la identidad de cada turno dentro del borrador.
              <li key={i}>
                <TurnoComprensionItem
                  indice={i}
                  turno={turno}
                  onActualizar={(p) => form.actualizarTurno(i, p)}
                  onEliminar={() => form.eliminarTurno(i)}
                />
              </li>
            ))}
            <li>
              <button
                type="button"
                onClick={form.agregarTurno}
                disabled={form.turnos.length >= TURNOS_MAX}
                className="inline-flex w-fit items-center gap-1.5 rounded-md px-2 py-1.5 text-accent text-body-sm transition-colors hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="h-3.5 w-3.5" aria-hidden={true} />
                Añadir turno
              </button>
            </li>
          </ul>
          {form.errores.turnos ? (
            <p role="alert" className="text-caption text-danger">
              {form.errores.turnos}
            </p>
          ) : null}
        </div>
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
