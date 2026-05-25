import { Button } from "@/shared/components/ui/button"
import { Dialog, DialogFooter } from "@/shared/components/ui/dialog"
import { Field } from "@/shared/components/ui/field"
import { Input } from "@/shared/components/ui/input"
import { Select, SelectItem } from "@/shared/components/ui/select"
import { COMENTARIO_MAX, NOTA_MAX, NOTA_MIN } from "../hooks/cualitativa-validar"
import { useFormCapaCualitativa } from "../hooks/use-form-capa-cualitativa"

interface DialogCapaCualitativaProps {
  readonly abierto: boolean
  readonly onCambiarAbierto: (abierto: boolean) => void
  readonly intentoId: string
  readonly notaActual: number | null
}

/**
 * Carga la capa cualitativa (E8). Inputs: nota 0-100 + comentario textual
 * + nivel de confianza (BAJA/MEDIA/ALTA). El comentario se muestra al
 * colaborador en la devolucion.
 */
export function DialogCapaCualitativa({
  abierto,
  onCambiarAbierto,
  intentoId,
  notaActual,
}: DialogCapaCualitativaProps) {
  const form = useFormCapaCualitativa({
    intentoId,
    notaActual,
    abierto,
    onCerrar: () => onCambiarAbierto(false),
  })
  return (
    <Dialog
      abierto={abierto}
      onCambiarAbierto={onCambiarAbierto}
      titulo="Cargar capa cualitativa"
      descripcion="Análisis del código: claridad, decisiones técnicas, calidad del trabajo."
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
        <Field label="Comentario" error={form.errores.comentario ?? undefined}>
          {(attrs) => (
            <textarea
              {...attrs}
              value={form.comentario}
              onChange={(e) => form.setComentario(e.target.value)}
              rows={5}
              maxLength={COMENTARIO_MAX}
              placeholder="Qué destaca, qué falta, decisiones técnicas relevantes…"
              className="resize-vertical w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-input text-text-primary placeholder:text-text-tertiary focus:border-accent focus:shadow-ring-accent-soft focus:outline-none"
            />
          )}
        </Field>
        <Field label="Nivel de confianza">
          {(attrs) => (
            <Select
              id={attrs.id}
              value={form.confianza}
              onValueChange={(v) => form.setConfianza(v as "BAJA" | "MEDIA" | "ALTA")}
              aria-label="Nivel de confianza"
            >
              <SelectItem value="BAJA">Baja — revisar con cuidado</SelectItem>
              <SelectItem value="MEDIA">Media — confío en el análisis</SelectItem>
              <SelectItem value="ALTA">Alta — análisis riguroso</SelectItem>
            </Select>
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
